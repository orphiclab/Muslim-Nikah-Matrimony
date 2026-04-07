import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RuleEngineService } from '../rule-engine/rule-engine.service';

@Injectable()
export class ProfileListService {
  private readonly logger = new Logger(ProfileListService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ruleEngine: RuleEngineService,
  ) {}

  async getVisibleProfiles(viewerProfileId: string) {
    // Load viewer profile with subscription
    const viewerProfile = await this.prisma.childProfile.findUnique({
      where: { id: viewerProfileId },
      include: { subscription: true },
    });

    if (!viewerProfile) {
      throw new NotFoundException({ success: false, message: 'Viewer profile not found', error_code: 'NOT_FOUND' });
    }

    // Fetch ALL active profiles (pre-filter only by status — never filter by gender/age in DB)
    const allActiveProfiles = await this.prisma.childProfile.findMany({
      where: { status: 'ACTIVE' },
      include: { subscription: true },
    });

    // Hide profiles whose subscription has expired
    const now = new Date();
    const visibleProfiles = allActiveProfiles.filter(profile => {
      const sub = (profile as any).subscription;
      if (!sub) return false; // no subscription = not visible
      if (sub.status === 'ACTIVE' && sub.endDate && new Date(sub.endDate) < now) return false; // expired
      return sub.status === 'ACTIVE';
    });

    // Pass every profile through RuleEngine — NEVER bypass
    const allowed = this.ruleEngine.getVisibleProfiles(
      viewerProfile as any,
      visibleProfiles as any[],
    );

    // Sanitize each result — strip private fields, apply nickname privacy
    const sanitized = allowed.map(({ profile, contactVisible }) => {
      const safeProfile = this.ruleEngine.sanitizeProfile(profile as any, {
        viewer: viewerProfile as any,
        target: profile as any,
      });

      // Privacy: if member hides real name, show nickname instead
      const displayName =
        !profile.showRealName && profile.nickname
          ? profile.nickname
          : profile.name;

      return {
        ...safeProfile,
        name: displayName,
        boostExpiresAt: (profile as any).boostExpiresAt ?? null,
        isVip: !!((profile as any).boostExpiresAt && new Date((profile as any).boostExpiresAt) > new Date()),
        _meta: { contactVisible, nameIsNickname: !profile.showRealName },
      };
    });

    // Sort: active VIP boosts first, then by createdAt descending
    const now = new Date();
    sanitized.sort((a, b) => {
      const aVip = !!(a.boostExpiresAt && new Date(a.boostExpiresAt) > now);
      const bVip = !!(b.boostExpiresAt && new Date(b.boostExpiresAt) > now);
      if (aVip && !bVip) return -1;
      if (!aVip && bVip) return 1;
      return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
    });

    this.logger.log(`getVisibleProfiles: ${sanitized.length} profiles for viewer=${viewerProfileId}`);

    return { success: true, data: sanitized, total: sanitized.length };
  }

  /** Public profile detail — no auth needed. Atomically increments viewCount. */
  async getPublicProfile(profileId: string) {
    const profile = await this.prisma.childProfile.update({
      where: { id: profileId },
      data: { viewCount: { increment: 1 } } as any,
      include: { subscription: true, user: true },
    }).catch(() => null);

    if (!profile || profile.status !== 'ACTIVE') {
      throw new NotFoundException({ success: false, message: 'Profile not found', error_code: 'NOT_FOUND' });
    }

    const age = Math.floor((Date.now() - new Date(profile.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
    const isVip = !!(profile.boostExpiresAt && new Date(profile.boostExpiresAt as any) > new Date());
    const displayName = !profile.showRealName && (profile as any).nickname ? (profile as any).nickname : profile.name;
    const p = profile as any;
    const u = p.user ?? {};

    return {
      success: true,
      data: {
        id: p.id,
        memberId: p.memberId,
        name: displayName,
        gender: p.gender,
        age,
        height: p.height,
        weight: p.weight,
        complexion: p.complexion,
        appearance: p.appearance,
        dressCode: p.dressCode,
        ethnicity: p.ethnicity,
        civilStatus: p.civilStatus,
        children: p.children,
        country: p.country,
        city: p.city,
        education: p.education,
        occupation: p.occupation,
        annualIncome: p.annualIncome,
        familyStatus: p.familyStatus,
        fatherOccupation: p.fatherOccupation,
        motherOccupation: p.motherOccupation,
        siblings: p.siblings,
        minAgePreference: p.minAgePreference,
        maxAgePreference: p.maxAgePreference,
        countryPreference: p.countryPreference,
        aboutUs: p.aboutUs,
        expectations: p.expectations,
        viewCount: p.viewCount,
        isVip,
        boostExpiresAt: p.boostExpiresAt,
        createdAt: p.createdAt,
        // Phone / WhatsApp — only exposed if the owner has not hidden them
        phone: u.phoneVisible !== false ? (u.phone ?? null) : null,
        whatsappNumber: u.whatsappVisible !== false ? (u.whatsappNumber ?? null) : null,
        _meta: {
          nameIsNickname: !p.showRealName,
          phoneVisible: u.phoneVisible !== false,
          whatsappVisible: u.whatsappVisible !== false,
        },
      },
    };
  }
}
