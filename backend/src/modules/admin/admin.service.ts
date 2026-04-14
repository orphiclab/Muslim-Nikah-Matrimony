import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PaymentService } from '../payment/payment.service';
import { ApprovePaymentDto, RejectPaymentDto, CreatePackageDto, UpdateSiteSettingsDto } from './dto/admin.dto';
import { PaymentStatus, ProfileStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { NotificationService } from '../notification/notification.service';

export { ApprovePaymentDto, RejectPaymentDto, CreatePackageDto, UpdateSiteSettingsDto };

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
    private readonly paymentService: PaymentService,
    private readonly activityLog: ActivityLogService,
    private readonly notifications: NotificationService,
  ) {}

  // ─── Payments ─────────────────────────────────────────────────────────────
  async approvePayment(adminId: string, dto: ApprovePaymentDto) {
    const payment = await this.prisma.payment.findUnique({ where: { id: dto.paymentId } });
    if (!payment) throw new NotFoundException({ success: false, message: 'Payment not found', error_code: 'NOT_FOUND' });

    // Look up the package for duration (fall back to stored value, then 30 days)
    let durationDays = payment.packageDurationDays ?? 30;
    let planName = 'standard';
    if (payment.packageId) {
      const pkg = await this.prisma.package.findUnique({ where: { id: payment.packageId } });
      if (pkg) {
        durationDays = pkg.durationDays;
        planName = pkg.name;
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: 'SUCCESS', approvedBy: adminId, approvedAt: new Date(), adminNote: dto.adminNote },
      });
      if (payment.purpose === 'BOOST') {
      const days = (payment.gatewayPayload as { days?: number })?.days || 7;
        await this.paymentService.activateBoost(tx, payment.childProfileId, days);
      } else {
        await this.paymentService.activateSubscription(tx, payment.childProfileId, durationDays, planName);
      }
    });

    this.events.emit('PAYMENT_SUCCESS', { paymentId: payment.id, profileId: payment.childProfileId, approvedBy: adminId });
    this.logger.log(`Admin APPROVED payment: ${payment.id} → ${durationDays} days subscription`);
    this.activityLog.log({
      actorId: adminId, actorRole: 'ADMIN',
      action: 'PAYMENT_APPROVED', category: 'PAYMENT',
      entityId: payment.id,
      entityLabel: `Payment ${payment.id.slice(0, 8)} (${payment.purpose})`,
      meta: { durationDays, planName, profileId: payment.childProfileId },
    });

    // Notify the payment owner
    const purposeLabel = payment.purpose === 'BOOST' ? 'Boost' : 'Subscription';
    await this.notifications.create({
      userId: payment.userId,
      type: payment.purpose === 'BOOST' ? 'BOOST_ACTIVATED' : 'PAYMENT_APPROVED',
      title: `${purposeLabel} Payment Approved ✓`,
      body: `Your ${purposeLabel.toLowerCase()} payment has been approved and your profile is now active.`,
      meta: { paymentId: payment.id, profileId: payment.childProfileId, durationDays },
    });

    return { success: true, message: `Payment approved — profile activated for ${durationDays} days` };
  }

  async rejectPayment(adminId: string, dto: RejectPaymentDto) {
    const payment = await this.prisma.payment.findUnique({ where: { id: dto.paymentId } });
    if (!payment) throw new NotFoundException({ success: false, message: 'Payment not found' });

    await this.prisma.$transaction(async (tx) => {
      // Mark payment as FAILED with the reason
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED', rejectionReason: dto.reason, approvedBy: adminId },
      });

      // Only reset subscription profile — leave BOOST profile untouched
      if (payment.purpose !== 'BOOST') {
        await tx.childProfile.update({
          where: { id: payment.childProfileId },
          data: { status: 'DRAFT', rejectionReason: dto.reason },
        });
      }
    });

    this.logger.log(`Admin REJECTED payment: ${payment.id} — reason: ${dto.reason} (purpose: ${payment.purpose})`);
    this.activityLog.log({
      actorId: adminId, actorRole: 'ADMIN',
      action: 'PAYMENT_REJECTED', category: 'PAYMENT', level: 'WARNING',
      entityId: payment.id,
      entityLabel: `Payment ${payment.id.slice(0, 8)} (${payment.purpose})`,
      meta: { reason: dto.reason, purpose: payment.purpose, profileId: payment.childProfileId },
    });

    // Notify the payment owner with rejection reason
    const rPurposeLabel = payment.purpose === 'BOOST' ? 'Boost' : 'Subscription';
    await this.notifications.create({
      userId: payment.userId,
      type: 'PAYMENT_REJECTED',
      title: `${rPurposeLabel} Payment Rejected`,
      body: `Your ${rPurposeLabel.toLowerCase()} payment was rejected. Reason: ${dto.reason}`,
      meta: { paymentId: payment.id, profileId: payment.childProfileId, reason: dto.reason },
    });

    return { success: true, message: 'Payment rejected' };
  }

  async getAllPayments(status?: string) {
    const payments = await this.prisma.payment.findMany({
      where: status ? { status: status as PaymentStatus } : undefined,
      include: {
        user: { select: { id: true, email: true } },
        childProfile: { select: { id: true, name: true, memberId: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: payments };
  }

  // ─── Users ────────────────────────────────────────────────────────────────
  async getAllUsers() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true, email: true, role: true, phone: true, createdAt: true,
        _count: { select: { childProfiles: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: users };
  }

  async getUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true, email: true, role: true, phone: true,
        whatsappNumber: true, createdAt: true, updatedAt: true,
        childProfiles: {
          select: {
            id: true, memberId: true, name: true, gender: true,
            status: true, city: true, country: true, createdAt: true,
            subscription: { select: { status: true, endDate: true, planName: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { childProfiles: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return { success: true, data: user };
  }

  async createUser(dto: { email: string; password: string; phone?: string; whatsappNumber?: string; role: string }) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('A user with this email already exists.');
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        phone: dto.phone ?? null,
        whatsappNumber: dto.whatsappNumber ?? null,
        role: dto.role as any,
      },
      select: { id: true, email: true, role: true, phone: true, createdAt: true },
    });
    this.logger.log(`Admin created user: ${user.email} (${user.role})`);
    this.activityLog.log({
      actorId: undefined, actorRole: 'ADMIN',
      action: 'ADMIN_USER_CREATED', category: 'ADMIN',
      entityId: user.id, entityLabel: user.email,
      meta: { role: user.role },
    });
    return { success: true, data: user };
  }

  async updateUser(id: string, dto: { phone?: string; whatsappNumber?: string; role?: string }) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    const data: any = {};
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.whatsappNumber !== undefined) data.whatsappNumber = dto.whatsappNumber;
    if (dto.role !== undefined) data.role = dto.role;
    const updated = await this.prisma.user.update({ where: { id }, data,
      select: { id: true, email: true, role: true, phone: true, whatsappNumber: true, createdAt: true, updatedAt: true },
    });
    return { success: true, data: updated };
  }

  async changeUserPassword(id: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id }, data: { password: hashedPassword } });
    this.logger.log(`Admin changed password for user: ${user.email}`);
    this.activityLog.log({
      actorRole: 'ADMIN',
      action: 'ADMIN_PASSWORD_CHANGED', category: 'ADMIN',
      entityId: id, entityLabel: user.email,
    });
    return { success: true, message: 'Password updated successfully' };
  }

  // ─── Profiles ─────────────────────────────────────────────────
  async getAllProfiles(status?: string) {
    const profiles = await this.prisma.childProfile.findMany({
      where: status ? { status: status as ProfileStatus } : undefined,
      include: { user: { select: { id: true, email: true } }, subscription: true },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: profiles };
  }

  async getProfile(id: string) {
    const profile = await this.prisma.childProfile.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, phone: true, role: true } },
        subscription: true,
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: { id: true, amount: true, currency: true, status: true, purpose: true, createdAt: true, method: true },
        },
      },
    });
    if (!profile) throw new NotFoundException('Profile not found');
    return { success: true, data: profile };
  }

  // ─── Boosts ─────────────────────────────────────────────────
  async getBoosts() {
    const now = new Date();
    const profiles = await this.prisma.childProfile.findMany({
      where: { boostExpiresAt: { not: null } },
      select: {
        id: true, memberId: true, name: true, gender: true, city: true, country: true,
        boostExpiresAt: true, status: true, viewCount: true,
        user: { select: { email: true } },
      },
      orderBy: { boostExpiresAt: 'desc' },
    });
    return {
      success: true,
      data: profiles.map(p => ({
        ...p,
        isActive: p.boostExpiresAt ? new Date(p.boostExpiresAt) > now : false,
        daysLeft: p.boostExpiresAt
          ? Math.max(0, Math.ceil((new Date(p.boostExpiresAt).getTime() - now.getTime()) / 86400000))
          : 0,
      })),
    };
  }

  async removeBoost(id: string) {
    await this.prisma.childProfile.update({
      where: { id },
      data: { boostExpiresAt: null },
    });
    return { success: true, message: 'Boost removed' };
  }

  async extendBoost(id: string, days: number) {
    const profile = await this.prisma.childProfile.findUnique({ where: { id }, select: { boostExpiresAt: true } });
    if (!profile) throw new NotFoundException('Profile not found');
    const base = profile.boostExpiresAt && new Date(profile.boostExpiresAt) > new Date()
      ? new Date(profile.boostExpiresAt)
      : new Date();
    const newExpiry = new Date(base.getTime() + days * 86400000);
    await this.prisma.childProfile.update({ where: { id }, data: { boostExpiresAt: newExpiry } });
    return { success: true, data: { boostExpiresAt: newExpiry } };
  }

  // ─── Analytics ───────────────────────────────────────────────
  async getAnalytics() {
    const now = new Date();
    const [totalUsers, totalProfiles, activeProfiles, pendingPayments, totalRevenue,
      activeBoosts, totalMessages, topViewed] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.childProfile.count(),
      this.prisma.childProfile.count({ where: { status: 'ACTIVE' } }),
      this.prisma.payment.count({ where: { status: 'PENDING' } }),
      this.prisma.payment.aggregate({ where: { status: 'SUCCESS' }, _sum: { amount: true } }),
      this.prisma.childProfile.count({ where: { boostExpiresAt: { gt: now } } }),
      this.prisma.chatMessage.count(),
      this.prisma.childProfile.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true, memberId: true, name: true, viewCount: true, gender: true, city: true },
        orderBy: { viewCount: 'desc' },
        take: 5,
      }),
    ]);
    return {
      success: true,
      data: {
        totalUsers, totalProfiles, activeProfiles, pendingPayments,
        totalRevenue: totalRevenue._sum.amount ?? 0,
        activeBoosts, totalMessages,
        topViewed,
      },
    };
  }

  // ─── Chat monitor ────────────────────────────────────────────────────────
  async getRecentMessages(limit = 100) {
    const messages = await this.prisma.chatMessage.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        content: true,
        createdAt: true,
        readAt: true,
        senderProfile: { select: { id: true, name: true, memberId: true, gender: true } },
        receiverProfile: { select: { id: true, name: true, memberId: true, gender: true } },
      },
    });
    return { success: true, data: messages };
  }

  // ─── Public single profile (increments viewCount) ─────────────────
  async getPublicProfile(id: string) {
    const profile: any = await this.prisma.childProfile.findFirst({
      where: { id, status: 'ACTIVE' },
      select: {
        id: true, memberId: true, name: true, gender: true, dateOfBirth: true,
        height: true, weight: true, complexion: true, ethnicity: true, civilStatus: true,
        children: true, country: true, city: true, education: true, occupation: true,
        annualIncome: true, familyStatus: true, fatherOccupation: true, motherOccupation: true,
        siblings: true, minAgePreference: true, maxAgePreference: true, countryPreference: true,
        aboutUs: true, expectations: true, createdAt: true,
        showRealName: true, nickname: true, boostExpiresAt: true, viewCount: true,
      },
    });

    if (!profile) throw new NotFoundException('Profile not found');

    // Increment view count (fire and forget)
    this.prisma.childProfile.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

    const now = new Date();
    const dob = new Date(profile.dateOfBirth);
    const age = Math.floor((now.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    const displayName = !profile.showRealName && profile.nickname ? profile.nickname : profile.name;
    const isVip = profile.boostExpiresAt && new Date(profile.boostExpiresAt) > now;
    const { showRealName, nickname, boostExpiresAt, ...rest } = profile;
    return { success: true, data: { ...rest, name: displayName, age, isVip } };
  }

  // ─── Dashboard stats ──────────────────────────────────────────────────────
  async getDashboard() {
    const [totalUsers, totalProfiles, activeProfiles, pendingPayments, totalRevenue] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.childProfile.count(),
      this.prisma.childProfile.count({ where: { status: 'ACTIVE' } }),
      this.prisma.payment.count({ where: { status: 'PENDING' } }),
      this.prisma.payment.aggregate({ where: { status: 'SUCCESS' }, _sum: { amount: true } }),
    ]);
    return {
      success: true,
      data: { totalUsers, totalProfiles, activeProfiles, pendingPayments, totalRevenue: totalRevenue._sum.amount ?? 0 },
    };
  }

  // ─── Public Profiles (safe fields only, no auth) ──────────────────────────
  async getPublicProfiles(filters: {
    minAge?: number; maxAge?: number; gender?: string;
    city?: string; ethnicity?: string; civilStatus?: string;
    education?: string; occupation?: string; memberId?: string;
    viewerProfileId?: string;
  }) {
    const where: any = { status: 'ACTIVE' };
    if (filters.gender) where.gender = filters.gender;
    if (filters.city) where.city = { contains: filters.city, mode: 'insensitive' };
    if (filters.ethnicity) where.ethnicity = { contains: filters.ethnicity, mode: 'insensitive' };
    if (filters.civilStatus) where.civilStatus = { contains: filters.civilStatus, mode: 'insensitive' };
    if (filters.education) where.education = { contains: filters.education, mode: 'insensitive' };
    if (filters.occupation) where.occupation = { contains: filters.occupation, mode: 'insensitive' };
    if (filters.memberId) where.memberId = { contains: filters.memberId.toUpperCase(), mode: 'insensitive' };

    // Load viewer profile for country preference checks (if logged in)
    let viewerCountry: string | null = null;
    let viewerCountryPreference: string | null = null;
    if (filters.viewerProfileId) {
      const viewer = await this.prisma.childProfile.findUnique({
        where: { id: filters.viewerProfileId },
        select: { country: true, countryPreference: true },
      });
      if (viewer) {
        viewerCountry = viewer.country ?? null;
        viewerCountryPreference = viewer.countryPreference ?? null;
      }
    }

    // If viewer has a country preference, restrict DB query to those countries
    // countryPreference is comma-separated e.g. "Australia,United Kingdom"
    if (viewerCountryPreference) {
      const prefList = viewerCountryPreference.split(',').map(s => s.trim()).filter(Boolean);
      if (prefList.length === 1) {
        where.country = { equals: prefList[0], mode: 'insensitive' };
      } else if (prefList.length > 1) {
        where.country = { in: prefList };
      }
    }

    const allProfiles: any[] = await this.prisma.childProfile.findMany({
      where,
      select: {
        id: true, memberId: true, name: true, gender: true, dateOfBirth: true,
        city: true, country: true, height: true, education: true,
        occupation: true, ethnicity: true, civilStatus: true,
        createdAt: true, status: true,
        showRealName: true, nickname: true,
        boostExpiresAt: true,
        countryPreference: true,
        createdBy: true,
      } as any,
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();
    const filtered = allProfiles
      .map(p => {
        const dob = new Date(p.dateOfBirth);
        const age = Math.floor((now.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        const displayName = !p.showRealName && p.nickname ? p.nickname : p.name;
        const isVip = p.boostExpiresAt && new Date(p.boostExpiresAt) > now;
        const { showRealName, nickname, boostExpiresAt, countryPreference, ...rest } = p;
        return { ...rest, name: displayName, age, isVip, _countryPreference: countryPreference };
      })
      .filter(p => {
        if (filters.minAge && p.age < filters.minAge) return false;
        if (filters.maxAge && p.age > filters.maxAge) return false;

        // Rule 2: If target has a countryPreference, viewer must live in one of those countries
        // countryPreference is comma-separated e.g. "Australia,United Kingdom"
        if (p._countryPreference && viewerCountry) {
          const prefs = p._countryPreference.split(',').map((s: string) => s.trim().toLowerCase()).filter(Boolean);
          if (!prefs.includes(viewerCountry.toLowerCase())) return false;
        }

        return true;
      })
      .map(({ _countryPreference, ...p }) => p)  // strip internal field
      .sort((a, b) => (b.isVip === a.isVip ? 0 : b.isVip ? 1 : -1));

    return { success: true, data: filtered, total: filtered.length };
  }

  // ─── Site Settings ────────────────────────────────────────────────────────
  async getSiteSettings() {
    let settings = await this.prisma.siteSettings.findUnique({ where: { id: 'singleton' } });
    if (!settings) {
      settings = await this.prisma.siteSettings.create({
        data: { id: 'singleton', siteDiscountPct: 0, siteDiscountLabel: '', siteDiscountActive: false, platformCurrency: 'LKR' } as any,
      });
    }
    return { success: true, data: settings };
  }

  async updateSiteSettings(dto: UpdateSiteSettingsDto) {
    const settings = await this.prisma.siteSettings.upsert({
      where: { id: 'singleton' },
      create: {
        id: 'singleton',
        siteDiscountPct: dto.siteDiscountPct ?? 0,
        siteDiscountLabel: dto.siteDiscountLabel ?? '',
        siteDiscountActive: dto.siteDiscountActive ?? false,
        platformCurrency: dto.platformCurrency ?? 'LKR',
        whatsappContact: dto.whatsappContact ?? '+94 705 687 697',
        bank1AccName: dto.bank1AccName ?? 'M T M Akram',
        bank1AccNo: dto.bank1AccNo ?? '112054094468',
        bank1BankName: dto.bank1BankName ?? 'Sampath Bank PLC',
        bank1Branch: dto.bank1Branch ?? 'Ratmalana',
        bank2AccName: dto.bank2AccName ?? 'M T M Akram',
        bank2AccNo: dto.bank2AccNo ?? '89870069',
        bank2BankName: dto.bank2BankName ?? 'BOC',
        bank2Branch: dto.bank2Branch ?? 'Anuradhapura',
      } as any,
      update: {
        ...(dto.siteDiscountPct !== undefined && { siteDiscountPct: dto.siteDiscountPct }),
        ...(dto.siteDiscountLabel !== undefined && { siteDiscountLabel: dto.siteDiscountLabel }),
        ...(dto.siteDiscountActive !== undefined && { siteDiscountActive: dto.siteDiscountActive }),
        ...(dto.platformCurrency !== undefined && { platformCurrency: dto.platformCurrency }),
        ...(dto.whatsappContact !== undefined && { whatsappContact: dto.whatsappContact }),
        ...(dto.bank1AccName !== undefined && { bank1AccName: dto.bank1AccName }),
        ...(dto.bank1AccNo !== undefined && { bank1AccNo: dto.bank1AccNo }),
        ...(dto.bank1BankName !== undefined && { bank1BankName: dto.bank1BankName }),
        ...(dto.bank1Branch !== undefined && { bank1Branch: dto.bank1Branch }),
        ...(dto.bank2AccName !== undefined && { bank2AccName: dto.bank2AccName }),
        ...(dto.bank2AccNo !== undefined && { bank2AccNo: dto.bank2AccNo }),
        ...(dto.bank2BankName !== undefined && { bank2BankName: dto.bank2BankName }),
        ...(dto.bank2Branch !== undefined && { bank2Branch: dto.bank2Branch }),
      } as any,
    });
    return { success: true, data: settings };
  }

  // ─── Packages ─────────────────────────────────────────────────────────────
  /**
   * Discount stacking:
   *  1. Package discount reduces originalPrice → pkgPrice (stored as `price`)
   *  2. Site-wide discount is applied ON TOP of pkgPrice (compound)
   *  Final = pkg.price * (1 - siteDiscPct/100)
   */
  private applyDiscount(pkg: any, siteDiscPct = 0, siteActive = false) {
    const pkgPrice = pkg.price;                       // already package-discounted
    const origPrice = pkg.originalPrice ?? pkg.price; // pre-discount price
    const pkgDisc = pkg.discountPct ?? 0;

    let finalPrice = pkgPrice;
    let shownOrig = origPrice;
    let effectiveDisc = pkgDisc;

    if (siteActive && siteDiscPct > 0) {
      // Stack: apply site discount on top of already-discounted price
      finalPrice = Math.round(pkgPrice * (1 - siteDiscPct / 100) * 100) / 100;
      // Effective % off the original price for display
      effectiveDisc = pkgDisc > 0
        ? Math.round((1 - finalPrice / origPrice) * 100)
        : siteDiscPct;
      shownOrig = origPrice > pkgPrice ? origPrice : pkgPrice;
    }

    if (finalPrice === pkgPrice && effectiveDisc === 0) return pkg;

    return {
      ...pkg,
      originalPrice: shownOrig,
      price: finalPrice,
      effectiveDiscountPct: effectiveDisc,
      pkgDiscountPct: pkgDisc,
      siteDiscountPct: siteActive ? siteDiscPct : 0,
    };
  }

  async getActivePackages(type?: string) {
    const [packages, settings] = await Promise.all([
      this.prisma.package.findMany({
        where: { isActive: true, ...(type ? { type } : {}) },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      }),
      this.prisma.siteSettings.findUnique({ where: { id: 'singleton' } }),
    ]);
    const siteDiscPct = settings?.siteDiscountPct ?? 0;
    const siteActive = settings?.siteDiscountActive ?? false;
    const label = settings?.siteDiscountLabel ?? '';
    const currency = (settings as any)?.platformCurrency ?? 'LKR';
    return {
      success: true,
      data: packages.map(p => this.applyDiscount(p, siteDiscPct, siteActive)),
      siteDiscount: { active: siteActive, pct: siteDiscPct, label },
      currency,
    };
  }

  async getPackages(type?: string) {
    const packages = await this.prisma.package.findMany({
      where: type ? { type } : undefined,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return { success: true, data: packages };
  }

  async createPackage(dto: CreatePackageDto) {
    const pkg = await this.prisma.package.create({
      data: {
        name: dto.name,
        description: dto.description,
        price: dto.price,
        currency: dto.currency ?? 'USD',
        durationDays: dto.durationDays,
        features: dto.features ?? [],
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
        type: dto.type ?? 'SUBSCRIPTION',
        discountPct: dto.discountPct ?? null,
        originalPrice: dto.originalPrice ?? null,
        isPopular: dto.isPopular ?? false,
        usdPrice: dto.usdPrice ?? null,
        usdOriginalPrice: dto.usdOriginalPrice ?? null,
      },
    });
    return { success: true, data: pkg };
  }

  async updatePackage(id: string, dto: Partial<CreatePackageDto> & { discountPct?: number | null; originalPrice?: number | null; type?: string }) {
    const existing = await this.prisma.package.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Package not found');

    // Build update data explicitly — using 'as any' drops null values silently
    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.price !== undefined) data.price = dto.price;
    if (dto.currency !== undefined) data.currency = dto.currency;
    if (dto.durationDays !== undefined) data.durationDays = dto.durationDays;
    if (dto.features !== undefined) data.features = dto.features;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.sortOrder !== undefined) data.sortOrder = dto.sortOrder;
    if (dto.type !== undefined) data.type = dto.type;
    // Allow null to CLEAR the discount (explicitly write null, not skip)
    if ('discountPct' in dto) data.discountPct = dto.discountPct ?? null;
    if ('originalPrice' in dto) data.originalPrice = dto.originalPrice ?? null;
    if (dto.isPopular !== undefined) data.isPopular = dto.isPopular;
    if ('usdPrice' in dto) data.usdPrice = dto.usdPrice ?? null;
    if ('usdOriginalPrice' in dto) data.usdOriginalPrice = dto.usdOriginalPrice ?? null;

    const pkg = await this.prisma.package.update({ where: { id }, data });
    this.logger.log(`Package updated: ${id} — price=${data.price ?? existing.price}, discountPct=${data.discountPct ?? existing.discountPct}`);
    return { success: true, data: pkg };
  }

  async deletePackage(id: string) {
    const existing = await this.prisma.package.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Package not found');
    await this.prisma.package.delete({ where: { id } });
    return { success: true, message: 'Package deleted' };
  }
}
