import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PaymentService } from '../payment/payment.service';
import { IsString, IsOptional, IsNumber, IsArray, IsBoolean, Min } from 'class-validator';

export class ApprovePaymentDto {
  @IsString() paymentId: string;
  @IsOptional() @IsString() adminNote?: string;
}

export class CreatePackageDto {
  @IsString() name: string;
  @IsOptional() @IsString() description?: string;
  @IsNumber() @Min(0) price: number;
  @IsOptional() @IsString() currency?: string;
  @IsNumber() @Min(1) durationDays: number;
  @IsOptional() @IsArray() features?: string[];
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsNumber() sortOrder?: number;
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
    private readonly paymentService: PaymentService,
  ) {}

  // ─── Payments ─────────────────────────────────────────────────────────────
  async approvePayment(adminId: string, dto: ApprovePaymentDto) {
    const payment = await this.prisma.payment.findUnique({ where: { id: dto.paymentId } });
    if (!payment) throw new NotFoundException({ success: false, message: 'Payment not found', error_code: 'NOT_FOUND' });

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: 'SUCCESS', approvedBy: adminId, approvedAt: new Date(), adminNote: dto.adminNote },
      });
      await this.paymentService.activateSubscription(tx, payment.childProfileId);
    });

    this.events.emit('PAYMENT_SUCCESS', { paymentId: payment.id, profileId: payment.childProfileId, approvedBy: adminId });
    this.logger.log(`Admin APPROVED payment: ${payment.id} by admin ${adminId}`);
    return { success: true, message: 'Payment approved and profile activated' };
  }

  async getAllPayments(status?: string) {
    const payments = await this.prisma.payment.findMany({
      where: status ? { status: status as any } : undefined,
      include: { user: { select: { id: true, email: true } }, childProfile: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: payments };
  }

  // ─── Users ────────────────────────────────────────────────────────────────
  async getAllUsers() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true, email: true, role: true, phone: true, createdAt: true,
        childProfiles: { select: { id: true, name: true, status: true, subscription: { select: { status: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: users };
  }

  // ─── Profiles ─────────────────────────────────────────────────────────────
  async getAllProfiles(status?: string) {
    const profiles = await this.prisma.childProfile.findMany({
      where: status ? { status: status as any } : undefined,
      include: { user: { select: { id: true, email: true } }, subscription: true },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: profiles };
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
    education?: string; occupation?: string;
  }) {
    const where: any = { status: 'ACTIVE' };
    if (filters.gender) where.gender = filters.gender;
    if (filters.city) where.city = { contains: filters.city, mode: 'insensitive' };
    if (filters.ethnicity) where.ethnicity = { contains: filters.ethnicity, mode: 'insensitive' };
    if (filters.civilStatus) where.civilStatus = { contains: filters.civilStatus, mode: 'insensitive' };
    if (filters.education) where.education = { contains: filters.education, mode: 'insensitive' };
    if (filters.occupation) where.occupation = { contains: filters.occupation, mode: 'insensitive' };

    const allProfiles = await this.prisma.childProfile.findMany({
      where,
      select: {
        id: true, name: true, gender: true, dateOfBirth: true,
        city: true, country: true, height: true, education: true,
        occupation: true, ethnicity: true, civilStatus: true,
        createdAt: true, status: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();
    const filtered = allProfiles
      .map(p => {
        const dob = new Date(p.dateOfBirth);
        const age = Math.floor((now.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        return { ...p, age };
      })
      .filter(p => {
        if (filters.minAge && p.age < filters.minAge) return false;
        if (filters.maxAge && p.age > filters.maxAge) return false;
        return true;
      });

    return { success: true, data: filtered, total: filtered.length };
  }

  // ─── Packages ─────────────────────────────────────────────────────────────
  async getActivePackages() {
    const packages = await this.prisma.package.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return { success: true, data: packages };
  }

  async getPackages() {
    const packages = await this.prisma.package.findMany({
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
      },
    });
    return { success: true, data: pkg };
  }

  async updatePackage(id: string, dto: Partial<CreatePackageDto>) {
    const existing = await this.prisma.package.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Package not found');
    const pkg = await this.prisma.package.update({ where: { id }, data: dto as any });
    return { success: true, data: pkg };
  }

  async deletePackage(id: string) {
    const existing = await this.prisma.package.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Package not found');
    await this.prisma.package.delete({ where: { id } });
    return { success: true, message: 'Package deleted' };
  }
}
