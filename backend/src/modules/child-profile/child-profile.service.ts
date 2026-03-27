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
    await this.prisma.childProfile.delete({ where: { id: profileId } });
    this.logger.log(`Profile DELETED: ${profileId}`);
    return { success: true, message: 'Profile deleted' };
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
