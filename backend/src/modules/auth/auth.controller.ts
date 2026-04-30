import { Controller, Post, Get, Body, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

class CheckAvailabilityDto {
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() whatsappNumber?: string;
}

class ForgotPasswordDto {
  @IsEmail() email: string;
}

class ResetPasswordDto {
  @IsString() token: string;
  @IsString() @MinLength(8) newPassword: string;
}

/** Extract real client IP respecting proxies */
function getIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return (req as any).ip ?? req.socket?.remoteAddress ?? '';
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto, @Req() req: Request) {
    return this.authService.register(dto, getIp(req), req.headers['user-agent']);
  }

  @Post('login')
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, getIp(req), req.headers['user-agent']);
  }

  @Post('check-availability')
  checkAvailability(@Body() dto: CheckAvailabilityDto) {
    return this.authService.checkAvailability(dto);
  }

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  @Get('validate-reset-token')
  validateResetToken(@Query('token') token: string) {
    return this.authService.validateResetToken(token);
  }
}
