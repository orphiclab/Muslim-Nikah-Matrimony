import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SmsService } from '../auth/sms.service';
import { CreateCampaignDto, CreateTemplateDto, SendIndividualSmsDto } from './dto/sms-campaign.dto';

@Injectable()
export class SmsCampaignService {
  private readonly logger = new Logger(SmsCampaignService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sms: SmsService,
  ) {}

  // ─── Dashboard Stats ──────────────────────────────────────────────────────
  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalUsers,
      sentToday,
      sentThisMonth,
      activeCampaigns,
      failedCount,
      totalCampaigns,
      totalTemplates,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.smsCampaignLog.count({ where: { status: 'SENT', sentAt: { gte: today } } }),
      this.prisma.smsCampaignLog.count({ where: { status: 'SENT', sentAt: { gte: monthStart } } }),
      this.prisma.smsCampaign.count({ where: { status: { in: ['SENDING', 'SCHEDULED'] } } }),
      this.prisma.smsCampaignLog.count({ where: { status: 'FAILED' } }),
      this.prisma.smsCampaign.count(),
      this.prisma.smsTemplate.count(),
    ]);

    return {
      success: true,
      data: { totalUsers, sentToday, sentThisMonth, activeCampaigns, failedCount, totalCampaigns, totalTemplates },
    };
  }

  // ─── User Targeting ────────────────────────────────────────────────────────
  async getTargetableUsers(filters: {
    packageStatus?: string; // ALL | ACTIVE | EXPIRED | NOT_PURCHASED
    gender?: string;
    country?: string;
    lastActiveDays?: number;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 50;
    const skip = (page - 1) * limit;

    const now = new Date();

    // Build user-level where
    const userWhere: any = { role: 'PARENT' };

    // Last active filter (updatedAt as proxy)
    if (filters.lastActiveDays) {
      const cutoff = new Date(now.getTime() - filters.lastActiveDays * 86400000);
      userWhere.updatedAt = { gte: cutoff };
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: userWhere,
        select: {
          id: true,
          email: true,
          phone: true,
          whatsappNumber: true,
          createdAt: true,
          updatedAt: true,
          childProfiles: {
            select: {
              memberId: true,
              name: true,
              gender: true,
              country: true,
              subscription: { select: { status: true, endDate: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where: userWhere }),
    ]);

    // Map and apply post-query filters
    let mapped = users.map((u) => {
      const profile = u.childProfiles[0];
      const sub = profile?.subscription;
      let packageStatus = 'NOT_PURCHASED';
      if (sub) {
        if (sub.status === 'ACTIVE') packageStatus = 'ACTIVE';
        else packageStatus = 'EXPIRED';
      }
      return {
        id: u.id,
        email: u.email,
        phone: u.phone || u.whatsappNumber || null,
        memberId: profile?.memberId ?? '—',
        name: profile?.name ?? '—',
        gender: profile?.gender ?? '—',
        country: profile?.country ?? '—',
        packageStatus,
        subscriptionEndDate: sub?.endDate ?? null,
        registeredAt: u.createdAt,
        lastActive: u.updatedAt,
      };
    });

    // Post-filter
    if (filters.packageStatus && filters.packageStatus !== 'ALL') {
      mapped = mapped.filter((u) => u.packageStatus === filters.packageStatus);
    }
    if (filters.gender) {
      mapped = mapped.filter((u) => u.gender === filters.gender);
    }
    if (filters.country) {
      mapped = mapped.filter((u) => u.country.toLowerCase().includes(filters.country!.toLowerCase()));
    }

    return { success: true, data: mapped, total: mapped.length, page, limit };
  }

  // ─── Campaigns ────────────────────────────────────────────────────────────
  async getCampaigns() {
    const campaigns = await this.prisma.smsCampaign.findMany({
      include: { template: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: campaigns };
  }

  async getCampaign(id: string) {
    const campaign = await this.prisma.smsCampaign.findUnique({
      where: { id },
      include: {
        template: { select: { name: true } },
        logs: { orderBy: { createdAt: 'desc' }, take: 200 },
      },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');
    return { success: true, data: campaign };
  }

  async createCampaign(adminId: string, dto: CreateCampaignDto) {
    const campaign = await this.prisma.smsCampaign.create({
      data: {
        name: dto.name,
        message: dto.message,
        recipientType: dto.recipientType ?? 'ALL',
        recipientFilter: dto.recipientFilter ?? undefined,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
        templateId: dto.templateId ?? undefined,
        createdBy: adminId,
        status: dto.scheduledAt ? 'SCHEDULED' : 'DRAFT',
      },
    });
    return { success: true, data: campaign };
  }

  /** Core bulk-send logic — resolves recipients, deduplicates, sends, logs. */
  async sendCampaign(
    adminId: string,
    campaignId: string,
    opts: { recipientType?: string; recipientFilter?: any; selectedUserIds?: string[] },
  ) {
    const campaign = await this.prisma.smsCampaign.findUnique({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');

    // Mark as SENDING
    await this.prisma.smsCampaign.update({ where: { id: campaignId }, data: { status: 'SENDING' } });

    // Resolve recipients
    const recipients = await this.resolveRecipients(opts);
    if (recipients.length === 0) {
      await this.prisma.smsCampaign.update({ where: { id: campaignId }, data: { status: 'FAILED', totalRecipients: 0 } });
      throw new BadRequestException('No valid recipients found with phone numbers');
    }

    await this.prisma.smsCampaign.update({ where: { id: campaignId }, data: { totalRecipients: recipients.length } });

    let sentCount = 0;
    let failedCount = 0;

    // Send in batches of 10 to avoid overwhelming the API
    const BATCH = 10;
    for (let i = 0; i < recipients.length; i += BATCH) {
      const batch = recipients.slice(i, i + BATCH);
      await Promise.all(
        batch.map(async (r) => {
          const ok = await this.sms.sendSms(r.phone, campaign.message);
          const now = new Date();
          if (ok) sentCount++;
          else failedCount++;
          await this.prisma.smsCampaignLog.create({
            data: {
              campaignId,
              userId: r.userId,
              phone: r.phone,
              status: ok ? 'SENT' : 'FAILED',
              sentAt: ok ? now : undefined,
              errorMsg: ok ? undefined : 'API returned failure',
            },
          });
        }),
      );
    }

    await this.prisma.smsCampaign.update({
      where: { id: campaignId },
      data: { status: 'COMPLETED', sentAt: new Date(), sentCount, failedCount },
    });

    this.logger.log(`Campaign ${campaignId} completed — sent: ${sentCount}, failed: ${failedCount}`);
    return { success: true, data: { sentCount, failedCount, totalRecipients: recipients.length } };
  }

  /** Create and immediately send */
  async createAndSendCampaign(
    adminId: string,
    dto: CreateCampaignDto & { selectedUserIds?: string[] },
  ) {
    const campaign = await this.prisma.smsCampaign.create({
      data: {
        name: dto.name,
        message: dto.message,
        recipientType: dto.recipientType ?? 'ALL',
        recipientFilter: dto.recipientFilter ?? undefined,
        templateId: dto.templateId ?? undefined,
        createdBy: adminId,
        status: 'SENDING',
      },
    });

    return this.sendCampaign(adminId, campaign.id, {
      recipientType: dto.recipientType,
      recipientFilter: dto.recipientFilter,
      selectedUserIds: dto.selectedUserIds,
    });
  }

  // ─── Individual SMS ────────────────────────────────────────────────────────
  async sendIndividualSms(adminId: string, dto: SendIndividualSmsDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      select: { id: true, phone: true, whatsappNumber: true },
    });
    if (!user) throw new NotFoundException('User not found');
    const phone = user.phone || user.whatsappNumber;
    if (!phone) throw new BadRequestException('User has no phone number');

    const ok = await this.sms.sendSms(phone, dto.message);

    // Log as a standalone campaign
    const campaign = await this.prisma.smsCampaign.create({
      data: {
        name: `Individual SMS — ${user.id.slice(0, 8)}`,
        message: dto.message,
        recipientType: 'SELECTED',
        createdBy: adminId,
        status: ok ? 'COMPLETED' : 'FAILED',
        totalRecipients: 1,
        sentCount: ok ? 1 : 0,
        failedCount: ok ? 0 : 1,
        sentAt: new Date(),
      },
    });
    await this.prisma.smsCampaignLog.create({
      data: { campaignId: campaign.id, userId: user.id, phone, status: ok ? 'SENT' : 'FAILED', sentAt: ok ? new Date() : undefined },
    });

    return { success: ok, message: ok ? 'SMS sent successfully' : 'SMS failed to send' };
  }

  // ─── Templates ─────────────────────────────────────────────────────────────
  async getTemplates() {
    const templates = await this.prisma.smsTemplate.findMany({ orderBy: { createdAt: 'desc' } });
    return { success: true, data: templates };
  }

  async createTemplate(dto: CreateTemplateDto) {
    const template = await this.prisma.smsTemplate.create({
      data: { name: dto.name, message: dto.message, category: dto.category ?? 'GENERAL' },
    });
    return { success: true, data: template };
  }

  async updateTemplate(id: string, dto: Partial<CreateTemplateDto>) {
    const existing = await this.prisma.smsTemplate.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Template not found');
    const updated = await this.prisma.smsTemplate.update({ where: { id }, data: dto });
    return { success: true, data: updated };
  }

  async deleteTemplate(id: string) {
    const existing = await this.prisma.smsTemplate.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Template not found');
    await this.prisma.smsTemplate.delete({ where: { id } });
    return { success: true, message: 'Template deleted' };
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────
  private async resolveRecipients(opts: {
    recipientType?: string;
    recipientFilter?: any;
    selectedUserIds?: string[];
  }): Promise<{ userId: string; phone: string }[]> {
    const type = opts.recipientType ?? 'ALL';
    let userWhere: any = { role: 'PARENT' };

    if (type === 'SELECTED' && opts.selectedUserIds?.length) {
      userWhere.id = { in: opts.selectedUserIds };
    }

    const users = await this.prisma.user.findMany({
      where: userWhere,
      select: { id: true, phone: true, whatsappNumber: true, childProfiles: { select: { subscription: { select: { status: true } } }, take: 1 } },
    });

    const seen = new Set<string>();
    const result: { userId: string; phone: string }[] = [];

    for (const u of users) {
      const phone = u.phone || u.whatsappNumber;
      if (!phone || seen.has(phone)) continue;

      // Apply package status filter
      if (opts.recipientFilter?.packageStatus && opts.recipientFilter.packageStatus !== 'ALL') {
        const sub = u.childProfiles[0]?.subscription;
        let ps = 'NOT_PURCHASED';
        if (sub?.status === 'ACTIVE') ps = 'ACTIVE';
        else if (sub) ps = 'EXPIRED';
        if (ps !== opts.recipientFilter.packageStatus) continue;
      }

      seen.add(phone);
      result.push({ userId: u.id, phone });
    }
    return result;
  }
}
