import { Transform } from 'class-transformer';
import { IsEmail, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

const serviceTypes = ['company-formation', 'pro-services', 'consulting', 'ai-tools', 'training', 'other'];

export class CreateQuoteRequestDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name: string;

  @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @IsEmail()
  @MaxLength(160)
  email: string;

  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @MaxLength(120)
  company?: string;

  @IsString()
  @IsIn(serviceTypes)
  serviceType: string;

  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @MaxLength(5000)
  message?: string;

  @IsOptional()
  @IsString()
  @IsIn(['booking', 'quote', 'contact', 'whatsapp', 'website'])
  source?: string;

  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value) // FIX: trim token (prevents " token " fail)
  @IsString()
  @MinLength(20) // Turnstile tokens are always > 100 chars, catches empty string
  @MaxLength(4096)
  turnstileToken: string;
}