import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InitiatePaymentDto, VerifyPaymentDto } from './dto/payment.dto';

export { InitiatePaymentDto, VerifyPaymentDto };

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  async initiate(userId: string, dto: InitiatePaymentDto) {
    const profile = await this.prisma.childProfile.findUnique({
      where: { id: dto.childProfileId },
    });
    if (!profile || profile.userId !== userId) {
      throw new BadRequestException({ success: false, message: 'Profile not found or not owned', error_code: 'FORBIDDEN' });
    }

    // ── One profile, one membership plan ──────────────────────────────────
    const isSubscription = !dto.purpose || dto.purpose === 'SUBSCRIPTION';
    if (isSubscription) {
      const existing = await this.prisma.payment.findFirst({
        where: {
          childProfileId: dto.childProfileId,
          purpose: 'SUBSCRIPTION',
          status: { in: ['PENDING', 'SUCCESS'] },
        },
      });
      if (existing) {
        throw new BadRequestException({
          success: false,
          message:
            existing.status === 'PENDING'
              ? 'This profile already has a pending membership payment awaiting admin approval.'
              : 'This profile already has an active membership plan.',
          error_code: 'PLAN_ALREADY_EXISTS',
        });
      }
    }

    const payment = await this.prisma.payment.create({
      data: {
        userId,
        childProfileId: dto.childProfileId,
        amount: dto.amount,
        method: dto.method,
        status: dto.method === 'BANK_TRANSFER' ? 'PENDING' : 'PENDING',
        purpose: dto.purpose || 'SUBSCRIPTION',
        bankRef: dto.bankRef,
        bankSlipUrl: dto.bankSlipUrl,
        gatewayPayload: dto.purpose === 'BOOST' && dto.days
          ? { days: dto.days, currency: dto.currency ?? 'LKR' }
          : undefined,
        packageId: dto.packageId ?? null,
        packageDurationDays: dto.packageDurationDays ?? 30,
      },
    });

    // Move profile to PAYMENT_PENDING only if it's a new subscription purchase
    if (dto.purpose !== 'BOOST') {
      await this.prisma.childProfile.update({
        where: { id: dto.childProfileId },
        data: { status: 'PAYMENT_PENDING' },
      });
    }

    if (dto.method === 'BANK_TRANSFER') {
      this.events.emit('PAYMENT_PENDING', { paymentId: payment.id, profileId: profile.id });
      this.logger.log(`BANK_TRANSFER payment initiated: ${payment.id}`);
    }

    return { success: true, data: payment };
  }

  async verifyGateway(userId: string, dto: VerifyPaymentDto) {
    const payment = await this.prisma.payment.findUnique({ where: { id: dto.paymentId } });
    if (!payment || payment.userId !== userId) {
      throw new BadRequestException({ success: false, message: 'Payment not found', error_code: 'NOT_FOUND' });
    }

    // Use transaction: mark payment SUCCESS + activate subscription
    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: 'SUCCESS', gatewayRef: dto.gatewayRef },
      });

      if (payment.purpose === 'BOOST') {
        const days = (payment.gatewayPayload as { days?: number })?.days || 7;
        await this.activateBoost(tx, payment.childProfileId, days);
      } else {
        await this.activateSubscription(tx, payment.childProfileId);
      }
    });

    this.events.emit('PAYMENT_SUCCESS', { paymentId: payment.id, profileId: payment.childProfileId });
    this.logger.log(`Gateway payment VERIFIED: ${payment.id}`);

    return { success: true, message: 'Payment verified and profile activated' };
  }

  async activateSubscription(tx: any, childProfileId: string, durationDays = 30, planName = 'standard') {
    const now = new Date();
    const end = new Date(now);
    end.setDate(end.getDate() + durationDays);

    // Upsert subscription with actual duration from the package
    await tx.subscription.upsert({
      where: { childProfileId },
      update: {
        status: 'ACTIVE',
        startDate: now,
        endDate: end,
        planDurationDays: durationDays,
        planName,
      },
      create: {
        childProfileId,
        status: 'ACTIVE',
        startDate: now,
        endDate: end,
        planDurationDays: durationDays,
        planName,
      },
    });

    // Activate profile
    await tx.childProfile.update({
      where: { id: childProfileId },
      data: { status: 'ACTIVE' },
    });

    this.events.emit('PROFILE_ACTIVATED', { profileId: childProfileId });
    this.logger.log(`Profile ACTIVATED: ${childProfileId} for ${durationDays} days (until ${end.toISOString()})`);
  }

  async activateBoost(tx: any, childProfileId: string, days: number = 7) {
    const profile = await tx.childProfile.findUnique({ where: { id: childProfileId } });
    if (!profile) return;
    const now = new Date();
    // Extend from current expiry if already boosted
    const base = profile.boostExpiresAt && profile.boostExpiresAt > now ? profile.boostExpiresAt : now;
    const end = new Date(base);
    end.setDate(end.getDate() + days);

    await tx.childProfile.update({
      where: { id: childProfileId },
      data: { boostExpiresAt: end },
    });

    this.events.emit('PROFILE_BOOSTED', { profileId: childProfileId });
    this.logger.log(`Profile BOOSTED logic: ${childProfileId} for ${days} days`);
  }

  async getMyPayments(userId: string) {
    const payments = await this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        childProfile: { select: { id: true, name: true, memberId: true } },
      },
    });
    return { success: true, data: payments };
  }
}
