import { IsString, IsOptional, IsNumber, IsArray, IsBoolean, Min } from 'class-validator';

export class ApprovePaymentDto {
  @IsString() paymentId: string;
  @IsOptional() @IsString() adminNote?: string;
}

export class RejectPaymentDto {
  @IsString() paymentId: string;
  @IsString() reason: string;
}


export class CreatePackageDto {
  @IsString() name: string;
  @IsOptional() @IsString() description?: string;
  @IsNumber() @Min(0) price: number;
  @IsOptional() @IsString() currency?: string;
  @IsNumber() @Min(1) durationDays: number;
  @IsOptional() @IsArray() features?: string[];
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsNumber() sortOrder?: number;
  @IsOptional() @IsString() type?: string;
  @IsOptional() @IsNumber() @Min(0) discountPct?: number;
  @IsOptional() @IsNumber() @Min(0) originalPrice?: number;
  @IsOptional() @IsBoolean() isPopular?: boolean;
  @IsOptional() @IsNumber() @Min(0) usdPrice?: number;
  @IsOptional() @IsNumber() @Min(0) usdOriginalPrice?: number;
}

export class UpdateSiteSettingsDto {
  @IsOptional() @IsNumber() @Min(0) siteDiscountPct?: number;
  @IsOptional() @IsString() siteDiscountLabel?: string;
  @IsOptional() @IsBoolean() siteDiscountActive?: boolean;
  @IsOptional() @IsString() platformCurrency?: string;
  @IsOptional() @IsString() whatsappContact?: string;
  @IsOptional() @IsString() bank1AccName?: string;
  @IsOptional() @IsString() bank1AccNo?: string;
  @IsOptional() @IsString() bank1BankName?: string;
  @IsOptional() @IsString() bank1Branch?: string;
  @IsOptional() @IsString() bank2AccName?: string;
  @IsOptional() @IsString() bank2AccNo?: string;
  @IsOptional() @IsString() bank2BankName?: string;
  @IsOptional() @IsString() bank2Branch?: string;
}
