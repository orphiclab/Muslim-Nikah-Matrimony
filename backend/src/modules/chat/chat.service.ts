import { Injectable, ForbiddenException, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SendMessageDto } from './dto/chat.dto';
import { RuleEngineService } from '../rule-engine/rule-engine.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
    private readonly ruleEngine: RuleEngineService,
    private readonly notifications: NotificationService,
  ) {}

  async send(userId: string, dto: SendMessageDto) {
    const [senderProfile, receiverProfile] = await Promise.all([
      this.prisma.childProfile.findUnique({ where: { id: dto.senderProfileId }, include: { subscription: true } }),
      this.prisma.childProfile.findUnique({ where: { id: dto.receiverProfileId }, include: { subscription: true } }),
    ]);

    if (!senderProfile || !receiverProfile) {
      throw new BadRequestException({ success: false, message: 'Profile not found', error_code: 'NOT_FOUND' });
    }
    // ── Security: sender must own the profile ──────────────────────────────
    if (senderProfile.userId !== userId) {
      throw new ForbiddenException({ success: false, message: 'You do not own this profile', error_code: 'FORBIDDEN' });
    }
    if (senderProfile.status !== 'ACTIVE') {
      throw new ForbiddenException({ success: false, message: 'Sender profile is not active', error_code: 'PROFILE_INACTIVE' });
    }
    if (senderProfile.subscription?.status !== 'ACTIVE') {
      throw new ForbiddenException({ success: false, message: 'You need an active subscription to send messages', error_code: 'NO_SUBSCRIPTION' });
    }
    if (receiverProfile.status !== 'ACTIVE') {
      throw new ForbiddenException({ success: false, message: 'Receiver profile is not active', error_code: 'RECEIVER_INACTIVE' });
    }

    // ── Matchmaking eligibility check (RuleEngine) ─────────────────────────
    // Both profiles must satisfy the full visibility rules:
    // gender, age, and bidirectional country preference.
    const eligibility = this.ruleEngine.canViewProfile({
      viewer: senderProfile as any,
      target: receiverProfile as any,
    });
    if (!eligibility.allowed) {
      this.logger.warn(
        `Chat BLOCKED: ${senderProfile.memberId} → ${receiverProfile.memberId} — ${eligibility.reason}`,
      );
      throw new ForbiddenException({
        success: false,
        message: 'You are not eligible to chat with this profile based on matchmaking rules.',
        detail: eligibility.reason,
        error_code: 'NO_MATCH',
      });
    }

    const message = await this.prisma.chatMessage.create({
      data: {
        senderId: userId,
        senderProfileId: dto.senderProfileId,
        receiverProfileId: dto.receiverProfileId,
        content: dto.content,
        imageUrl: dto.imageUrl,
      },
    });

    this.events.emit('MESSAGE_SENT', { messageId: message.id, sender: dto.senderProfileId, receiver: dto.receiverProfileId });
    this.logger.log(`Message SENT: ${message.id}`);

    // Notify the receiver (in-app notification)
    const senderName = senderProfile.showRealName ? senderProfile.name : (senderProfile.nickname ?? senderProfile.name);
    await this.notifications.create({
      userId: receiverProfile.userId,
      type: 'NEW_MESSAGE',
      title: `New message from ${senderName}`,
      body: dto.content.length > 60 ? dto.content.slice(0, 60) + '…' : dto.content,
      meta: { messageId: message.id, senderProfileId: dto.senderProfileId, senderName },
    });

    return { success: true, data: message };
  }

  async getHistory(viewerProfileId: string, otherProfileId: string) {
    const messages = await this.prisma.chatMessage.findMany({
      where: {
        OR: [
          { senderProfileId: viewerProfileId, receiverProfileId: otherProfileId },
          { senderProfileId: otherProfileId, receiverProfileId: viewerProfileId },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });
    return { success: true, data: messages };
  }

  async getConversations(profileId: string) {
    // Load viewer profile for matchmaking checks
    const viewer = await this.prisma.childProfile.findUnique({
      where: { id: profileId },
      include: { subscription: true },
    });

    // ── Get latest message timestamp per unique partner (both directions) ──
    const [sentGroups, receivedGroups] = await Promise.all([
      // messages I sent: group by receiverProfileId, pick max createdAt
      this.prisma.chatMessage.groupBy({
        by: ['receiverProfileId'],
        where: { senderProfileId: profileId },
        _max: { createdAt: true },
      }),
      // messages I received: group by senderProfileId, pick max createdAt
      this.prisma.chatMessage.groupBy({
        by: ['senderProfileId'],
        where: { receiverProfileId: profileId },
        _max: { createdAt: true },
      }),
    ]);

    // Build a map of partnerId → latest timestamp (merge both directions)
    const latestByPartner = new Map<string, Date>();
    for (const row of sentGroups) {
      const ts = row._max.createdAt;
      if (ts) latestByPartner.set(row.receiverProfileId, ts);
    }
    for (const row of receivedGroups) {
      const ts = row._max.createdAt;
      if (!ts) continue;
      const existing = latestByPartner.get(row.senderProfileId);
      if (!existing || ts > existing) {
        latestByPartner.set(row.senderProfileId, ts);
      }
    }

    if (latestByPartner.size === 0) {
      return { success: true, data: { sent: [], received: [], conversations: [] } };
    }

    // If we can't load viewer, skip eligibility filter
    let eligibleIds: Set<string>;
    if (!viewer) {
      eligibleIds = new Set(latestByPartner.keys());
    } else {
      // ── Eligibility filter (RuleEngine) ────────────────────────────────
      const partnerProfiles = await this.prisma.childProfile.findMany({
        where: { id: { in: [...latestByPartner.keys()] } },
        include: { subscription: true },
      });

      eligibleIds = new Set(
        partnerProfiles
          .filter(partner => this.ruleEngine.canViewProfile({ viewer: viewer as any, target: partner as any }).allowed)
          .map(p => p.id),
      );
    }

    // Fetch partner names for eligible IDs
    const partnerNames = await this.prisma.childProfile.findMany({
      where: { id: { in: [...eligibleIds] } },
      select: { id: true, name: true },
    });
    const nameMap = new Map(partnerNames.map(p => [p.id, p.name]));

    // Build sorted flat conversation list (newest first)
    const conversations = [...eligibleIds]
      .map(id => ({ id, name: nameMap.get(id) ?? 'Unknown', lastMessageAt: latestByPartner.get(id)! }))
      .sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());

    // Keep legacy sent/received shape for backward-compat (frontend uses it too)
    const sent     = conversations.map(c => ({ receiverProfileId: c.id, receiverProfile: { id: c.id, name: c.name }, createdAt: c.lastMessageAt }));
    const received = [] as any[];

    return { success: true, data: { sent, received, conversations } };
  }

  /** Returns per-sender unread counts for myProfileId (for badge polling) */
  async getUnreadCounts(myProfileId: string): Promise<Record<string, number>> {
    const rows = await this.prisma.chatMessage.groupBy({
      by: ['senderProfileId'],
      where: { receiverProfileId: myProfileId, readAt: null },
      _count: { id: true },
    });
    const counts: Record<string, number> = {};
    for (const row of rows) {
      counts[row.senderProfileId] = row._count.id;
    }
    return counts;
  }

  /** Mark all messages FROM otherProfileId TO myProfileId as read */
  async markRead(myProfileId: string, otherProfileId: string): Promise<string[]> {
    const now = new Date();
    const unread = await this.prisma.chatMessage.findMany({
      where: { senderProfileId: otherProfileId, receiverProfileId: myProfileId, readAt: null },
      select: { id: true },
    });
    if (unread.length === 0) return [];
    const ids = unread.map(m => m.id);
    await this.prisma.chatMessage.updateMany({
      where: { id: { in: ids } },
      data: { readAt: now },
    });
    this.logger.log(`Marked ${ids.length} messages as read: ${myProfileId} ← ${otherProfileId}`);
    return ids;
  }
}
