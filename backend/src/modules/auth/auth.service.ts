import { Injectable, ConflictException, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException({ success: false, message: 'Email already registered', error_code: 'EMAIL_EXISTS' });

    const hashed = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: { email: dto.email, password: hashed, phone: dto.phone, whatsappNumber: dto.whatsappNumber },
    });

    this.logger.log(`New user registered: ${user.email}`);

    const token = this.signToken(user.id, user.email, user.role);
    return { success: true, token, user: { id: user.id, email: user.email, role: user.role } };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException({ success: false, message: 'Invalid credentials', error_code: 'INVALID_CREDENTIALS' });

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException({ success: false, message: 'Invalid credentials', error_code: 'INVALID_CREDENTIALS' });

    this.logger.log(`User logged in: ${user.email}`);

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
}
