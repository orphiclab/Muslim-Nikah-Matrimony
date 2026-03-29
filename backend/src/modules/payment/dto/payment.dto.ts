import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { PaymentMethod, PaymentPurpose } from '@prisma/client';

export class InitiatePaymentDto {
  @IsString()
  childProfileId: string;

  @IsNumber()
  amount: number;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsOptional() @IsEnum(PaymentPurpose)
  purpose?: PaymentPurpose;

  @IsOptional() @IsString()
  bankRef?: string;

  @IsOptional() @IsString()
  bankSlipUrl?: string;

  @IsOptional() @IsNumber()
  days?: number;

  @IsOptional() @IsString()
  packageId?: string;

  @IsOptional() @IsNumber()
  packageDurationDays?: number;
}

export class VerifyPaymentDto {
  @IsString()
  paymentId: string;

  @IsString()
  gatewayRef: string;
}
