import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getStatus(childProfileId: string) {
    const sub = await this.prisma.subscription.findUnique({
      where: { childProfileId },
    });

    if (!sub) {
      return { success: true, data: { status: 'INACTIVE', subscription: null } };
    }

    return { success: true, data: { status: sub.status, subscription: sub } };
  }

  async getMySubscriptions(userId: string) {
    const profiles = await this.prisma.childProfile.findMany({
      where: { userId },
      include: { subscription: true },
    });
    const data = profiles.map((p) => ({ id: p.id, name: p.name, memberId: p.memberId, subscription: p.subscription }));
    return { success: true, data };
  }
}
