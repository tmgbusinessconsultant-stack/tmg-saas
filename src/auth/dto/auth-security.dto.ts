import { IsEmail, IsOptional, IsString, Length, MinLength } from 'class-validator';

export class VerifyEmailDto {
  @IsString()
  token!: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @IsString()
  token!: string;

  @IsString()
  @MinLength(12)
  password!: string;
}

export class MfaVerifyDto {
  @IsString()
  challengeToken!: string;

  @IsString()
  @Length(6, 8)
  code!: string;
}

export class MfaEnableDto {
  @IsString()
  @Length(6, 8)
  code!: string;
}

export class ResendVerificationDto {
  @IsEmail()
  email!: string;
}
