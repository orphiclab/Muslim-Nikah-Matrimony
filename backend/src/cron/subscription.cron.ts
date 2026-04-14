import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationService } from '../modules/notification/notification.service';

@Injectable()
export class SubscriptionCron {
  private readonly logger = new Logger(SubscriptionCron.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
    private readonly notifications: NotificationService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async expireSubscriptions() {
    const now = new Date();
    this.logger.log('Running daily subscription expiry cron...');

    // ── 1. Expire overdue subscriptions ──────────────────────────────────
    const expired = await this.prisma.subscription.findMany({
      where: { status: 'ACTIVE', endDate: { lte: now } },
      include: { childProfile: true },
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
      include: { childProfile: true },
    });

    for (const sub of expiringSoon7) {
      // Skip ones already notified (endDate within next 24h — handled below)
      const dayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      if (sub.endDate && sub.endDate <= dayFromNow) continue;

      await this.notifications.create({
        userId: sub.childProfile.userId,
        type: 'SUBSCRIPTION_EXPIRING_WEEK',
        title: 'Subscription Expiring Soon',
        body: `Your subscription for profile ${sub.childProfile.name} expires in about 7 days. Renew now to stay visible.`,
        meta: { profileId: sub.childProfileId, endDate: sub.endDate },
      });
    }

    // ── 3. Send warning 1 day before expiry ──────────────────────────────
    const dayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const expiringSoon1 = await this.prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        endDate: { gte: now, lte: dayFromNow },
      },
      include: { childProfile: true },
    });

    for (const sub of expiringSoon1) {
      await this.notifications.create({
        userId: sub.childProfile.userId,
        type: 'SUBSCRIPTION_EXPIRING_DAY',
        title: 'Subscription Expires Tomorrow!',
        body: `Your subscription for profile ${sub.childProfile.name} expires tomorrow. Renew now to avoid interruption.`,
        meta: { profileId: sub.childProfileId, endDate: sub.endDate },
      });
    }

    // ── 4. Boost expiry warning (1 day before) ────────────────────────────
    const boostDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const boostExpiring = await this.prisma.childProfile.findMany({
      where: {
        boostExpiresAt: { gte: now, lte: boostDayFromNow },
        status: 'ACTIVE',
      },
      select: { id: true, name: true, userId: true, boostExpiresAt: true },
    });

    for (const profile of boostExpiring) {
      await this.notifications.create({
        userId: profile.userId,
        type: 'BOOST_EXPIRING_DAY',
        title: 'Boost Expiring Tomorrow',
        body: `Your profile boost for ${profile.name} expires tomorrow. Boost again to stay at the top.`,
        meta: { profileId: profile.id, boostExpiresAt: profile.boostExpiresAt },
      });
    }

    this.logger.log('Subscription expiry cron complete.');
  }
}

