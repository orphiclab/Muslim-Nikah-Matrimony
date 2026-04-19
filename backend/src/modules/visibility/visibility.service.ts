import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RuleEngineService } from '../rule-engine/rule-engine.service';
import { NotificationService } from '../notification/notification.service';
import { MailService } from '../auth/mail.service';

@Injectable()
export class VisibilityService {
  private readonly logger = new Logger(VisibilityService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ruleEngine: RuleEngineService,
    private readonly notifications: NotificationService,
    private readonly mail: MailService,
  ) {}

  async checkContactVisibility(viewerProfileId: string, targetProfileId: string) {
    const [viewer, target] = await Promise.all([
      this.prisma.childProfile.findUnique({ where: { id: viewerProfileId }, include: { subscription: true } }),
      this.prisma.childProfile.findUnique({ where: { id: targetProfileId }, include: { subscription: true } }),
    ]);

    if (!viewer || !target) {
      return { success: false, message: 'Profile not found', error_code: 'NOT_FOUND' };
    }

    const ctx = { viewer: viewer as any, target: target as any };
    const result = this.ruleEngine.canViewContact(ctx);

    this.logger.log(
      `VisibilityCheck: viewer=${viewerProfileId} target=${targetProfileId} allowed=${result.allowed} reason=${result.reason ?? 'ok'}`,
    );

    return {
      success: true,
      data: {
        canViewContact: result.allowed,
        reason: result.reason,
        // Chat is always available when contact is hidden (fallback)
        chatEnabled: this.ruleEngine.canViewProfile(ctx).allowed,
      },
    };
  }

  async toggleContactVisibility(userId: string, profileId: string, visible: boolean) {
    const profile = await this.prisma.childProfile.findUnique({ where: { id: profileId } });
    if (!profile || profile.userId !== userId) {
      return { success: false, message: 'Forbidden', error_code: 'FORBIDDEN' };
    }

    await this.prisma.childProfile.update({
      where: { id: profileId },
      data: { contactVisible: visible },
    });

    // Notify the profile owner (in-app)
    await this.notifications.create({
      userId,
      type: 'PROFILE_VISIBILITY_CHANGED',
      title: 'Profile Visibility Updated',
      body: `Your contact details for profile "${profile.name}" are now ${visible ? 'visible' : 'hidden'} to other members.`,
      meta: { profileId, visible },
    });

    // Send email notification (fire and forget)
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (user) {
      this.mail.sendContactVisibilityChanged(user.email, {
        profileName: profile.name ?? 'Your Profile',
        visible,
      }).catch(() => {});
    }

    this.logger.log(`Contact visibility toggled: profile=${profileId} visible=${visible}`);
    return { success: true, message: `Contact visibility set to ${visible}` };
  }
}

