import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateChildProfileDto, UpdateChildProfileDto } from './dto/child-profile.dto';
import { AutoFillService } from '../user/auto-fill.service';

@Injectable()
export class ChildProfileService {
  private readonly logger = new Logger(ChildProfileService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
    private readonly autoFill: AutoFillService,
  ) {}

  async create(userId: string, dto: CreateChildProfileDto) {
    // Auto-generate about_us / expectations if not provided
    const generated = this.autoFill.generate({
      gender: dto.gender,
      dateOfBirth: new Date(dto.dateOfBirth),
      height: dto.height,
      country: dto.country,
      city: dto.city,
    });

    // Generate unique memberId: MN-XXXXXX (6-digit zero-padded counter)
    const count = await this.prisma.childProfile.count();
    const memberId = `MN-${String(count + 1).padStart(6, '0')}`;

    const profile = await this.prisma.childProfile.create({
      data: {
        ...dto,
        dateOfBirth: new Date(dto.dateOfBirth),
        userId,
        memberId,
        aboutUs: dto.aboutUs ?? generated.aboutUs,
        expectations: dto.expectations ?? generated.expectations,
        status: 'DRAFT',
      },
      include: { subscription: true },
    });

    this.events.emit('PROFILE_CREATED', { profileId: profile.id, userId });
    this.logger.log(`Profile CREATED: ${profile.id} (${memberId}) by user ${userId}`);

    return { success: true, data: profile };
  }

  async update(userId: string, profileId: string, dto: UpdateChildProfileDto) {
    const profile = await this.findOwnedProfile(userId, profileId);

    const updated = await this.prisma.childProfile.update({
      where: { id: profile.id },
      data: { ...dto, dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined },
      include: { subscription: true },
    });

    this.logger.log(`Profile UPDATED: ${profileId}`);
    return { success: true, data: updated };
  }

  async updatePrivacy(userId: string, profileId: string, data: { showRealName?: boolean; nickname?: string }) {
    const profile = await this.findOwnedProfile(userId, profileId);

    const updated = await this.prisma.childProfile.update({
      where: { id: profile.id },
      data: {
        showRealName: data.showRealName,
        nickname: data.nickname,
      } as any,
      include: { subscription: true },
    });

    this.logger.log(`Profile PRIVACY UPDATED: ${profileId} showRealName=${data.showRealName}`);
    return { success: true, data: updated };
  }

  async boostProfile(userId: string, profileId: string, days: number) {
    if (![10, 15, 30].includes(days)) throw new Error('Invalid boost duration. Choose 10, 15 or 30 days.');
    const profile = await this.findOwnedProfile(userId, profileId);
    if (profile.status !== 'ACTIVE') throw new Error('Only active profiles can be boosted.');
    const boostExpiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    const updated = await this.prisma.childProfile.update({
      where: { id: profile.id },
      data: { boostExpiresAt } as any,
      include: { subscription: true },
    });
    this.logger.log(`Profile BOOSTED: ${profileId} for ${days} days until ${boostExpiresAt}`);
    return { success: true, data: updated, boostExpiresAt };
  }

  async getMyProfiles(userId: string) {
    const profiles = await this.prisma.childProfile.findMany({
      where: { userId },
      include: { subscription: true },
    });
    return { success: true, data: profiles };
  }

  async getOne(userId: string, profileId: string) {
    const profile = await this.findOwnedProfile(userId, profileId);
    return { success: true, data: profile };
  }

  async delete(userId: string, profileId: string) {
    await this.findOwnedProfile(userId, profileId);

    // Delete related records manually (belt-and-suspenders alongside DB cascade)
    await this.prisma.chatMessage.deleteMany({
      where: { OR: [{ senderProfileId: profileId }, { receiverProfileId: profileId }] },
    });
    await this.prisma.payment.deleteMany({ where: { childProfileId: profileId } });
    await this.prisma.subscription.deleteMany({ where: { childProfileId: profileId } });
    await this.prisma.childProfile.delete({ where: { id: profileId } });

    this.logger.log(`Profile DELETED: ${profileId}`);
    return { success: true, message: 'Profile deleted' };
  }

  async updateStatus(userId: string, profileId: string, status: string) {
    // Only allow user-controllable statuses
    const allowed = ['ACTIVE', 'PAUSED', 'INACTIVE'];
    if (!allowed.includes(status)) {
      throw new ForbiddenException({ success: false, message: 'Invalid status transition' });
    }
    const profile = await this.findOwnedProfile(userId, profileId);
    // Can only change status if profile has been activated at least once
    if (profile.status === 'DRAFT' || profile.status === 'PAYMENT_PENDING' || profile.status === 'EXPIRED') {
      throw new ForbiddenException({ success: false, message: 'Profile must be active before changing status' });
    }
    const updated = await this.prisma.childProfile.update({
      where: { id: profileId },
      data: { status: status as any },
      include: { subscription: true },
    });
    this.logger.log(`Profile STATUS changed to ${status}: ${profileId}`);
    return { success: true, data: updated };
  }

  private async findOwnedProfile(userId: string, profileId: string) {
    const profile = await this.prisma.childProfile.findUnique({
      where: { id: profileId },
      include: { subscription: true },
    });
    if (!profile) throw new NotFoundException({ success: false, message: 'Profile not found', error_code: 'NOT_FOUND' });
    if (profile.userId !== userId)
      throw new ForbiddenException({ success: false, message: 'You do not own this profile', error_code: 'FORBIDDEN' });
    return profile;
  }
}
