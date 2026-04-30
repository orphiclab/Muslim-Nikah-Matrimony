import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { MailService } from './mail.service';
import { SmsService } from './sms.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
    private readonly sms: SmsService,
    private readonly activityLog: ActivityLogService,
    private readonly notifications: NotificationService,
  ) {}

  async register(dto: RegisterDto, ipAddress?: string, userAgent?: string) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException({ success: false, message: 'Email already registered', error_code: 'EMAIL_EXISTS' });

    const hashed = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: { email: dto.email, password: hashed, phone: dto.phone, whatsappNumber: dto.whatsappNumber },
    });

    this.logger.log(`New user registered: ${user.email}`);
    this.activityLog.log({
      actorId: user.id, actorEmail: user.email, actorRole: user.role,
      action: 'USER_REGISTERED', category: 'AUTH',
      entityId: user.id, entityLabel: user.email,
      ipAddress, userAgent,
    });

    // Welcome email (fire and forget)
    this.mail.sendWelcome(user.email, user.email).catch(() => {});

    // Welcome SMS — sent to phone or whatsapp number if provided (fire and forget)
    const smsPhone = dto.phone || dto.whatsappNumber;
    if (smsPhone) {
      const displayName = user.email.split('@')[0];
      const welcomeMsg = `Hi ${displayName} welcome to Muslim Nikah \u2764\uFE0F`;
      this.sms.sendSms(smsPhone, welcomeMsg).catch(() => {});
    }

    // Notify all admins
    const adminIds = await this.notifications.getAdminIds();
    await this.notifications.createForMany(adminIds, {
      type: 'NEW_USER_REGISTERED',
      title: 'New User Registered',
      body: `A new user has registered: ${user.email}`,
      meta: { userId: user.id, email: user.email },
    });

    const token = this.signToken(user.id, user.email, user.role);
    return { success: true, token, user: { id: user.id, email: user.email, role: user.role } };
  }

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      // Log failed login attempt
      this.activityLog.log({
        action: 'LOGIN_FAILED', category: 'AUTH', level: 'WARNING',
        entityLabel: dto.email, ipAddress, userAgent,
        meta: { reason: 'User not found' },
      });
      throw new UnauthorizedException({ success: false, message: 'Invalid credentials', error_code: 'INVALID_CREDENTIALS' });
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      this.activityLog.log({
        actorId: user.id, actorEmail: user.email, actorRole: user.role,
        action: 'LOGIN_FAILED', category: 'AUTH', level: 'WARNING',
        entityId: user.id, entityLabel: user.email, ipAddress, userAgent,
        meta: { reason: 'Wrong password' },
      });
      throw new UnauthorizedException({ success: false, message: 'Invalid credentials', error_code: 'INVALID_CREDENTIALS' });
    }

    this.logger.log(`User logged in: ${user.email}`);
    this.activityLog.log({
      actorId: user.id, actorEmail: user.email, actorRole: user.role,
      action: 'USER_LOGIN', category: 'AUTH',
      entityId: user.id, entityLabel: user.email,
      ipAddress, userAgent,
    });

    // ── Login SMS notification (fire and forget) ──────────────────────────────
    const loginPhone = user.phone || user.whatsappNumber;
    if (loginPhone) {
      const now = new Date().toLocaleString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true,
      });

      let smsText: string;
      const adminRoles = ['ADMIN', 'MARKETING_MANAGER', 'STAFF'];

      if (adminRoles.includes(user.role)) {
        // Admin account login alert
        smsText = `Your ${user.role.replace('_', ' ')} account (${user.email}) just logged in at ${now}. If this wasn't you, contact support immediately.`;
      } else {
        // Regular user login alert
        smsText = `You have successfully logged in to your account at ${now}. If this wasn't you, please contact us immediately.`;
      }

      this.sms.sendSms(loginPhone, smsText).catch(() => {});
    }
    // ──────────────────────────────────────────────────────────────────────────

    const token = this.signToken(user.id, user.email, user.role);
    return { success: true, token, user: { id: user.id, email: user.email, role: user.role } };
  }

  private signToken(userId: string, email: string, role: string) {
    return this.jwt.sign({ sub: userId, email, role });
  }

  async checkAvailability(dto: { email?: string; phone?: string; whatsappNumber?: string }) {
    const taken: Record<string, string> = {};

    if (dto.email) {
      const u = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (u) taken.email = 'This email address is already registered.';
    }
    if (dto.phone) {
      const u = await this.prisma.user.findFirst({ where: { phone: dto.phone } });
      if (u) taken.phone = 'This phone number is already registered.';
    }
    if (dto.whatsappNumber) {
      const u = await this.prisma.user.findFirst({ where: { whatsappNumber: dto.whatsappNumber } });
      if (u) taken.whatsappNumber = 'This WhatsApp number is already registered.';
    }

    return { success: true, taken };
  }

  /** Step 1 — User submits their email */
  async forgotPassword(email: string) {
    // Always return success to avoid email enumeration
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { success: true, message: 'If that email exists, a reset link has been sent.' };
    }

    // Invalidate any existing unused tokens for this user
    await (this.prisma as any).passwordResetToken.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    // Generate a secure random token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await (this.prisma as any).passwordResetToken.create({
      data: { token: rawToken, userId: user.id, expiresAt },
    });

    const FRONTEND = process.env.FRONTEND_URL ?? 'http://localhost:3001';
    const resetUrl = `${FRONTEND}/reset-password?token=${rawToken}`;

    await this.mail.sendPasswordReset(user.email, resetUrl);

    this.logger.log(`Password reset requested for ${user.email}`);
    return { success: true, message: 'If that email exists, a reset link has been sent.' };
  }

  /** Step 2 — User clicks link and submits new password */
  async resetPassword(token: string, newPassword: string) {
    const record = await (this.prisma as any).passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!record) throw new BadRequestException('Invalid or expired reset link.');
    if (record.used) throw new BadRequestException('This reset link has already been used.');
    if (new Date() > record.expiresAt) throw new BadRequestException('This reset link has expired. Please request a new one.');

    const hashed = await bcrypt.hash(newPassword, 12);

    await this.prisma.user.update({
      where: { id: record.userId },
      data: { password: hashed },
    });

    // Mark token as used
    await (this.prisma as any).passwordResetToken.update({
      where: { token },
      data: { used: true },
    });

    this.logger.log(`Password reset successful for ${record.user.email}`);
    this.activityLog.log({
      actorId: record.userId, actorEmail: record.user.email, actorRole: record.user.role,
      action: 'PASSWORD_RESET', category: 'AUTH',
      entityId: record.userId, entityLabel: record.user.email,
    });
    return { success: true, message: 'Password updated successfully. You can now log in.' };
  }

  /** Validate a token without consuming it (for the reset page to verify upfront) */
  async validateResetToken(token: string) {
    const record = await (this.prisma as any).passwordResetToken.findUnique({
      where: { token },
    });
    const valid = record && !record.used && new Date() < record.expiresAt;
    return { valid: !!valid };
  }
}
