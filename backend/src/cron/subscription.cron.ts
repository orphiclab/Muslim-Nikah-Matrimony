import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationService } from '../modules/notification/notification.service';
import { MailService } from '../modules/auth/mail.service';
import { SmsService } from '../modules/auth/sms.service';

@Injectable()
export class SubscriptionCron {
  private readonly logger = new Logger(SubscriptionCron.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
    private readonly notifications: NotificationService,
    private readonly mail: MailService,
    private readonly sms: SmsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async expireSubscriptions() {
    const now = new Date();
    this.logger.log('Running daily subscription expiry cron...');

    // ── 1. Expire overdue subscriptions ──────────────────────────────────
    const expired = await this.prisma.subscription.findMany({
      where: { status: 'ACTIVE', endDate: { lte: now } },
      include: {
        childProfile: {
          include: { user: { select: { email: true, phone: true, whatsappNumber: true } } },
        },
      },
    });

    for (const sub of expired) {
      await this.prisma.$transaction(async (tx) => {
        await tx.subscription.update({ where: { id: sub.id }, data: { status: 'EXPIRED' } });
        await tx.childProfile.update({ where: { id: sub.childProfileId }, data: { status: 'EXPIRED' } });
      });

      this.events.emit('SUBSCRIPTION_EXPIRED', {
        subscriptionId: sub.id,
        profileId: sub.childProfileId,
        userId: sub.childProfile.userId,
      });

      await this.notifications.create({
        userId: sub.childProfile.userId,
        type: 'SUBSCRIPTION_EXPIRED',
        title: 'Subscription Expired',
        body: `Your subscription for profile ${sub.childProfile.name} has expired. Renew to continue being visible.`,
        meta: { profileId: sub.childProfileId, subscriptionId: sub.id },
      });

      this.logger.log(`EXPIRED: subscription=${sub.id} profile=${sub.childProfileId}`);
    }

    // ── 2. Send warning 7 days before expiry ─────────────────────────────
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const expiringSoon7 = await this.prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        endDate: { gte: now, lte: weekFromNow },
      },
      include: {
        childProfile: {
          include: { user: { select: { email: true, phone: true, whatsappNumber: true } } },
        },
      },
    });

    for (const sub of expiringSoon7) {
      // Skip ones within next 24h — handled by the 1-day check below
      const dayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      if (sub.endDate && sub.endDate <= dayFromNow) continue;

      await this.notifications.create({
        userId: sub.childProfile.userId,
        type: 'SUBSCRIPTION_EXPIRING_WEEK',
        title: 'Subscription Expiring Soon',
        body: `Your subscription for profile ${sub.childProfile.name} expires in about 7 days. Renew now to stay visible.`,
        meta: { profileId: sub.childProfileId, endDate: sub.endDate },
      });

      // Email reminder
      if (sub.childProfile.user?.email && sub.endDate) {
        this.mail.sendSubscriptionExpiring7Days(sub.childProfile.user.email, {
          profileName: sub.childProfile.name ?? 'Your Profile',
          planName: sub.planName ?? 'Membership Plan',
          endDate: sub.endDate,
        }).catch(() => {});
      }

      // SMS: 7-day reminder
      const smsPhone7 = sub.childProfile.user?.phone || sub.childProfile.user?.whatsappNumber;
      if (smsPhone7) {
        this.sms.sendSms(smsPhone7,
          `Hi ${sub.childProfile.name ?? 'there'}, your subscription will expire in 7 days. Renew now to continue connecting.`
        ).catch(() => {});
      }
    }

    // ── 3. Send warning 1 day before expiry ──────────────────────────────
    const dayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const expiringSoon1 = await this.prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        endDate: { gte: now, lte: dayFromNow },
      },
      include: {
        childProfile: {
          include: { user: { select: { email: true, phone: true, whatsappNumber: true } } },
        },
      },
    });

    for (const sub of expiringSoon1) {
      await this.notifications.create({
        userId: sub.childProfile.userId,
        type: 'SUBSCRIPTION_EXPIRING_DAY',
        title: 'Subscription Expires Tomorrow!',
        body: `Your subscription for profile ${sub.childProfile.name} expires tomorrow. Renew now to avoid interruption.`,
        meta: { profileId: sub.childProfileId, endDate: sub.endDate },
      });

      // Email reminder
      if (sub.childProfile.user?.email && sub.endDate) {
        this.mail.sendSubscriptionExpiring1Day(sub.childProfile.user.email, {
          profileName: sub.childProfile.name ?? 'Your Profile',
          planName: sub.planName ?? 'Membership Plan',
          endDate: sub.endDate,
        }).catch(() => {});
      }

      // SMS: 1-day urgent reminder
      const smsPhone1 = sub.childProfile.user?.phone || sub.childProfile.user?.whatsappNumber;
      if (smsPhone1) {
        this.sms.sendSms(smsPhone1,
          `\u26a0\ufe0f Reminder: Hi ${sub.childProfile.name ?? 'there'}, your subscription expires TOMORROW. Renew now to avoid interruption.`
        ).catch(() => {});
      }
    }

    // ── 4. Boost expiry warning (2 days before) ────────────────────────────
    const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const dayFromNowBoost = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const boostExpiring2 = await this.prisma.childProfile.findMany({
      where: {
        boostExpiresAt: { gte: dayFromNowBoost, lte: twoDaysFromNow },
        status: 'ACTIVE',
      },
      select: {
        id: true, name: true, userId: true, boostExpiresAt: true,
        user: { select: { email: true, phone: true, whatsappNumber: true } },
      },
    });

    for (const profile of boostExpiring2) {
      await this.notifications.create({
        userId: profile.userId,
        type: 'BOOST_EXPIRING_DAY',
        title: 'Boost Expiring in 2 Days',
        body: `Your profile boost for ${profile.name} expires in 2 days. Boost again to stay at the top.`,
        meta: { profileId: profile.id, boostExpiresAt: profile.boostExpiresAt },
      });

      // Email reminder
      if (profile.user?.email && profile.boostExpiresAt) {
        this.mail.sendBoostExpiring2Days(profile.user.email, {
          profileName: profile.name ?? 'Your Profile',
          endDate: profile.boostExpiresAt,
        }).catch(() => {});
      }

      // SMS: 2-day boost reminder
      const smsPhoneB2 = profile.user?.phone || profile.user?.whatsappNumber;
      if (smsPhoneB2) {
        this.sms.sendSms(smsPhoneB2,
          `Hi ${profile.name ?? 'there'}, your profile boost expires in 2 days. Renew to stay on top!`
        ).catch(() => {});
      }
    }

    // ── 5. Boost expiry warning (1 day before) ────────────────────────────
    const boostExpiring1 = await this.prisma.childProfile.findMany({
      where: {
        boostExpiresAt: { gte: now, lte: dayFromNowBoost },
        status: 'ACTIVE',
      },
      select: {
        id: true, name: true, userId: true, boostExpiresAt: true,
        user: { select: { phone: true, whatsappNumber: true } },
      },
    });

    for (const profile of boostExpiring1) {
      await this.notifications.create({
        userId: profile.userId,
        type: 'BOOST_EXPIRING_DAY',
        title: 'Boost Expiring Tomorrow',
        body: `Your profile boost for ${profile.name} expires tomorrow. Boost again to stay at the top.`,
        meta: { profileId: profile.id, boostExpiresAt: profile.boostExpiresAt },
      });

      // SMS: 1-day boost reminder
      const smsPhoneB1 = profile.user?.phone || profile.user?.whatsappNumber;
      if (smsPhoneB1) {
        this.sms.sendSms(smsPhoneB1,
          `\u26a0\ufe0f Hi ${profile.name ?? 'there'}, your profile boost expires TOMORROW. Renew to stay on top!`
        ).catch(() => {});
      }
    }

    this.logger.log('Subscription expiry cron complete.');
  }
}
