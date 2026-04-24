import { IsString, IsOptional, IsArray, IsDateString, IsObject } from 'class-validator';

export class CreateCampaignDto {
  @IsString() name: string;
  @IsString() message: string;
  @IsOptional() @IsString() recipientType?: string; // ALL | FILTERED | SELECTED
  @IsOptional() @IsObject() recipientFilter?: Record<string, any>;
  @IsOptional() @IsArray() selectedUserIds?: string[];
  @IsOptional() @IsDateString() scheduledAt?: string;
  @IsOptional() @IsString() templateId?: string;
}

export class SendCampaignDto {
  @IsString() message: string;
  @IsOptional() @IsString() recipientType?: string;
  @IsOptional() @IsObject() recipientFilter?: Record<string, any>;
  @IsOptional() @IsArray() selectedUserIds?: string[];
  @IsOptional() @IsString() campaignName?: string;
  @IsOptional() @IsString() templateId?: string;
}

export class CreateTemplateDto {
  @IsString() name: string;
  @IsString() message: string;
  @IsOptional() @IsString() category?: string;
}

export class SendIndividualSmsDto {
  @IsString() userId: string;
  @IsString() message: string;
}
