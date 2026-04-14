import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type NotificationType =
  | 'PAYMENT_PENDING_ADMIN'
  | 'PAYMENT_APPROVED'
  | 'PAYMENT_REJECTED'
  | 'SUBSCRIPTION_ACTIVATED'
  | 'SUBSCRIPTION_EXPIRING_WEEK'
  | 'SUBSCRIPTION_EXPIRING_DAY'
  | 'SUBSCRIPTION_EXPIRED'
  | 'BOOST_ACTIVATED'
  | 'BOOST_EXPIRING_DAY'
  | 'BOOST_EXPIRED'
  | 'NEW_MESSAGE'
  | 'PROFILE_VISIBILITY_CHANGED'
  | 'NEW_USER_REGISTERED'
  | 'NEW_SUBSCRIPTION_PAYMENT'
  | 'NEW_BOOST_PAYMENT';

export interface CreateNotificationDto {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  meta?: Record<string, any>;
}

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  /** Create a single notification — no dedup (each event is intentional) */
  async create(dto: CreateNotificationDto) {
    return (this.prisma as any).notification.create({
      data: {
        userId: dto.userId,
        type: dto.type,
        title: dto.title,
        body: dto.body,
        meta: dto.meta ?? undefined,
      },
    });
  }

  /** Create the same notification for multiple users — deduplicates userIds only */
  async createForMany(userIds: string[], dto: Omit<CreateNotificationDto, 'userId'>) {
    // Deduplicate admin IDs (guard against duplicate entries in the array)
    const uniqueIds = [...new Set(userIds)];
    if (!uniqueIds.length) return;

    // 5-second double-click guard: skip users who already got same type in last 5s
    const since = new Date(Date.now() - 5_000);
    const recent = await (this.prisma as any).notification.findMany({
      where: { userId: { in: uniqueIds }, type: dto.type, createdAt: { gte: since } },
      select: { userId: true },
    });
    const alreadyNotified = new Set(recent.map((n: any) => n.userId));
    const toNotify = uniqueIds.filter((id) => !alreadyNotified.has(id));
    if (!toNotify.length) return;

    await (this.prisma as any).notification.createMany({
      data: toNotify.map((uid) => ({
        userId: uid,
        type: dto.type,
        title: dto.title,
        body: dto.body,
        meta: dto.meta ?? undefined,
      })),
    });
  }


  /** Fetch all notifications for a user, newest first */
  async findForUser(userId: string) {
    const notifications = await (this.prisma as any).notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 60,
    });
    return { success: true, data: notifications };
  }

  /** Unread count for badge */
  async unreadCount(userId: string): Promise<number> {
    return (this.prisma as any).notification.count({
      where: { userId, isRead: false },
    });
  }

  /** Mark a single notification as read */
  async markRead(id: string, userId: string) {
    await (this.prisma as any).notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
    return { success: true };
  }

  /** Mark all notifications for a user as read */
  async markAllRead(userId: string) {
    await (this.prisma as any).notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { success: true };
  }

  /** Helper: get all admin user IDs */
  async getAdminIds(): Promise<string[]> {
    const admins = await this.prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    });
    return admins.map((a) => a.id);
  }
}
