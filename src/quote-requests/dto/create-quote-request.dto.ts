import { IsString, IsEmail, IsOptional } from 'class-validator';

export class CreateQuoteRequestDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsString()
  serviceType!: string;

  @IsOptional()
  @IsString()
  details?: string;

  @IsString()
  turnstileToken!: string;
}
