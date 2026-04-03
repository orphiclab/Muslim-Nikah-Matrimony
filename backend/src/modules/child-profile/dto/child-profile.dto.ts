import { IsString, IsEnum, IsDateString, IsOptional, IsInt, IsBoolean, Min, Max, IsEmail } from 'class-validator';
import { Gender, FieldVisibility } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateChildProfileDto {
  @IsString()
  name: string;

  @IsEnum(Gender)
  gender: Gender;

  @IsDateString()
  dateOfBirth: string;

  @IsOptional() @IsInt() @Min(100) @Max(250)
  height?: number;

  @IsOptional() @IsInt() @Min(30) @Max(300)
  weight?: number;

  @IsOptional() @IsString()
  complexion?: string;

  @IsOptional() @IsString()
  appearance?: string;

  @IsOptional() @IsString()
  dressCode?: string;

  @IsOptional() @IsString()
  ethnicity?: string;

  @IsOptional() @IsString()
  civilStatus?: string;

  @IsOptional() @IsString()
  children?: string;

  @IsOptional() @IsString()
  country?: string;

  @IsOptional() @IsString()
  city?: string;

  @IsOptional() @IsString()
  state?: string;

  @IsOptional() @IsString()
  residencyStatus?: string;

  @IsOptional() @IsString()
  education?: string;

  @IsOptional() @IsString()
  occupation?: string;

  @IsOptional() @IsString()
  fieldOfStudy?: string;

  @IsOptional() @IsString()
  profession?: string;

  @IsOptional() @IsString()
  annualIncome?: string;

  @IsOptional() @IsString()
  familyStatus?: string;

  @IsOptional() @IsString()
  fatherEthnicity?: string;

  @IsOptional() @IsString()
  fatherCountry?: string;

  @IsOptional() @IsString()
  fatherOccupation?: string;

  @IsOptional() @IsString()
  fatherCity?: string;

  @IsOptional() @IsString()
  motherEthnicity?: string;

  @IsOptional() @IsString()
  motherCountry?: string;

  @IsOptional() @IsString()
  motherOccupation?: string;

  @IsOptional() @IsString()
  motherCity?: string;

  @IsOptional() @IsInt() @Min(0)
  siblings?: number;

  @IsOptional() @IsString()
  createdBy?: string;

  @IsOptional() @IsInt()
  minAgePreference?: number;

  @IsOptional() @IsInt()
  maxAgePreference?: number;

  @IsOptional() @IsInt()
  minHeightPreference?: number;

  @IsOptional() @IsString()
  countryPreference?: string;

  @IsOptional() @IsString()
  aboutUs?: string;

  @IsOptional() @IsString()
  expectations?: string;

  @IsOptional() @IsBoolean()
  contactVisible?: boolean;

  @IsOptional() @IsEnum(FieldVisibility)
  phoneVisibility?: FieldVisibility;

  @IsOptional() @IsEnum(FieldVisibility)
  emailVisibility?: FieldVisibility;

  @IsOptional() @IsString()
  phone?: string;

  @IsOptional() @IsEmail()
  contactEmail?: string;

  @IsOptional() @IsString()
  nickname?: string;

  @IsOptional() @IsBoolean()
  showRealName?: boolean;
}

export class UpdateChildProfileDto extends CreateChildProfileDto {}
