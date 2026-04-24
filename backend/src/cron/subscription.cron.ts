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

  // ─────────────────────────────────────────────────────────────────────────
  // 7-Day Recurring SMS Reminders
  //  • Case 1 — Registered but never purchased any package
  //  • Case 2 — Subscription expired
  //
  // Runs every day at 09:00. Uses ActivityLog to track last-sent timestamp
  // so each user receives at most one reminder per 7-day window.
  // Retries once on failure (after a 5-second delay).
  // ─────────────────────────────────────────────────────────────────────────
  @Cron('0 9 * * *') // 09:00 every day
  async sendWeeklyReminders() {
    const now = new Date();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const reminderWindow = new Date(now.getTime() - sevenDaysMs);

    this.logger.log('Running 7-day SMS reminder cron...');

    // ── Helper: check if we sent this reminder in the last 7 days ──────────
    const wasRecentlySent = async (userId: string, action: string): Promise<boolean> => {
      const last = await this.prisma.activityLog.findFirst({
        where: { actorId: userId, action, category: 'SMS_REMINDER' },
        orderBy: { createdAt: 'desc' },
      });
      return !!last && last.createdAt >= reminderWindow;
    };

    // ── Helper: record that we sent the reminder ───────────────────────────
    const recordSent = (userId: string, action: string, phone: string) =>
      this.prisma.activityLog.create({
        data: {
          actorId: userId,
          actorRole: 'SYSTEM',
          action,
          category: 'SMS_REMINDER',
          level: 'INFO',
          entityId: userId,
          entityLabel: phone,
          meta: { sentAt: now.toISOString() },
        },
      }).catch(() => {});

    // ── Helper: send with 1 retry on failure ──────────────────────────────
    const sendWithRetry = async (phone: string, message: string): Promise<boolean> => {
      const ok = await this.sms.sendSms(phone, message);
      if (ok) return true;
      await new Promise((r) => setTimeout(r, 5000));
      return this.sms.sendSms(phone, message);
    };

    // ── Case 1: Registered but NEVER purchased any package ─────────────────
    const noPurchaseUsers = await this.prisma.user.findMany({
      where: {
        role: 'PARENT',
        // Has at least one profile (registered)
        childProfiles: { some: {} },
        // Has ZERO successful payments
        payments: { none: { status: 'SUCCESS' } },
      },
      select: {
        id: true,
        phone: true,
        whatsappNumber: true,
        createdAt: true,
        childProfiles: {
          select: { name: true },
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
    });

    let case1Sent = 0;
    let case1Skipped = 0;

    for (const user of noPurchaseUsers) {
      const phone = user.phone || user.whatsappNumber;
      if (!phone) { case1Skipped++; continue; }

      // Only start sending reminders after 7 days from registration
      const daysSinceRegistration = (now.getTime() - new Date(user.createdAt).getTime()) / sevenDaysMs;
      if (daysSinceRegistration < 1) { case1Skipped++; continue; }

      // Skip if already sent within the last 7 days
      if (await wasRecentlySent(user.id, 'SMS_REMINDER_NO_PACKAGE')) { case1Skipped++; continue; }

      const profileName = user.childProfiles[0]?.name ?? 'there';
      const message = `Hi ${profileName}, complete your profile and activate your package to find your perfect match. Visit now!`;

      const ok = await sendWithRetry(phone, message);
      if (ok) {
        await recordSent(user.id, 'SMS_REMINDER_NO_PACKAGE', phone);
        case1Sent++;
        this.logger.log(`SMS_REMINDER_NO_PACKAGE sent → ${phone} (user ${user.id})`);
      } else {
        this.logger.warn(`SMS_REMINDER_NO_PACKAGE FAILED → ${phone} (user ${user.id})`);
      }
    }

    // ── Case 2: Subscription expired ──────────────────────────────────────
    const expiredSubUsers = await this.prisma.user.findMany({
      where: {
        role: 'PARENT',
        childProfiles: {
          some: {
            subscription: { status: 'EXPIRED' },
          },
        },
      },
      select: {
        id: true,
        phone: true,
        whatsappNumber: true,
        childProfiles: {
          where: { subscription: { status: 'EXPIRED' } },
          select: {
            name: true,
            subscription: { select: { endDate: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    let case2Sent = 0;
    let case2Skipped = 0;

    for (const user of expiredSubUsers) {
      const phone = user.phone || user.whatsappNumber;
      if (!phone) { case2Skipped++; continue; }

      const profile = user.childProfiles[0];
      const endDate = profile?.subscription?.endDate;

      // Only send reminders after the package has been expired for at least 7 days
      if (endDate) {
        const daysSinceExpiry = (now.getTime() - new Date(endDate).getTime()) / sevenDaysMs;
        if (daysSinceExpiry < 1) { case2Skipped++; continue; }
      }

      // Skip if already sent within the last 7 days
      if (await wasRecentlySent(user.id, 'SMS_REMINDER_EXPIRED')) { case2Skipped++; continue; }

      const profileName = profile?.name ?? 'there';
      const message = `Hi ${profileName}, your subscription has expired. Renew now to continue finding your perfect match!`;

      const ok = await sendWithRetry(phone, message);
      if (ok) {
        await recordSent(user.id, 'SMS_REMINDER_EXPIRED', phone);
        case2Sent++;
        this.logger.log(`SMS_REMINDER_EXPIRED sent → ${phone} (user ${user.id})`);
      } else {
        this.logger.warn(`SMS_REMINDER_EXPIRED FAILED → ${phone} (user ${user.id})`);
      }
    }

    this.logger.log(
      `7-day reminder cron complete. ` +
      `No-Package: ${case1Sent} sent, ${case1Skipped} skipped. ` +
      `Expired: ${case2Sent} sent, ${case2Skipped} skipped.`,
    );
  }
}

