import { Injectable, Logger, BadRequestException, UnauthorizedException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { success: false, message: 'Not found', error_code: 'NOT_FOUND' };
    const { password: _, ...safe } = user;
    return { success: true, data: safe };
  }

  async updateMe(userId: string, data: { phone?: string; whatsappNumber?: string; phoneVisible?: boolean; whatsappVisible?: boolean }) {
    // ── Phone number uniqueness check ──────────────────────────────────────
    const orConditions: any[] = [];
    if (data.phone)          orConditions.push({ phone: data.phone });
    if (data.whatsappNumber) orConditions.push({ whatsappNumber: data.whatsappNumber });

    if (orConditions.length > 0) {
      const conflict = await this.prisma.user.findFirst({
        where: { OR: orConditions, NOT: { id: userId } },
        select: { id: true, phone: true, whatsappNumber: true },
      });
      if (conflict) {
        const takenFields: string[] = [];
        if (data.phone && conflict.phone === data.phone) takenFields.push('Phone number');
        if (data.whatsappNumber && conflict.whatsappNumber === data.whatsappNumber) takenFields.push('WhatsApp number');
        throw new ConflictException({
          success: false,
          message: `${takenFields.join(' and ')} is already registered to another account.`,
          error_code: 'PHONE_TAKEN',
        });
      }
    }

    const updated = await this.prisma.user.update({ where: { id: userId }, data });
    const { password: _, ...safe } = updated;
    return { success: true, data: safe };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found.');

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) throw new BadRequestException('Current password is incorrect.');

    if (currentPassword === newPassword) {
      throw new BadRequestException('New password must be different from current password.');
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({ where: { id: userId }, data: { password: hashed } });

    this.logger.log(`Password changed for user ${userId}`);
    return { success: true, message: 'Password updated successfully.' };
  }
}
