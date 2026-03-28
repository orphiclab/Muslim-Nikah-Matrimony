import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RuleEngineService } from '../rule-engine/rule-engine.service';
import { SubscriptionStatus } from '@prisma/client';

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

    // Pass every profile through RuleEngine — NEVER bypass
    const allowed = this.ruleEngine.getVisibleProfiles(
      viewerProfile as any,
      allActiveProfiles as any[],
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
        _meta: { contactVisible, nameIsNickname: !profile.showRealName },
      };
    });

    this.logger.log(`getVisibleProfiles: ${sanitized.length} profiles for viewer=${viewerProfileId}`);

    return { success: true, data: sanitized, total: sanitized.length };
  }
}
