import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService, type AuthenticatedUser } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Public } from './public.decorator';
import {
  ForgotPasswordDto,
  MfaEnableDto,
  MfaVerifyDto,
  ResendVerificationDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './dto/auth-security.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @HttpCode(HttpStatus.ACCEPTED)
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Public()
  @Post('mfa/verify')
  verifyMfa(@Body() dto: MfaVerifyDto) {
    return this.auth.verifyMfaLogin(dto.challengeToken, dto.code);
  }

  @Public()
  @Post('verify-email')
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.auth.verifyEmail(dto.token);
  }

  @Public()
  @HttpCode(HttpStatus.ACCEPTED)
  @Post('resend-verification')
  resendVerification(@Body() dto: ResendVerificationDto) {
    return this.auth.resendVerification(dto.email);
  }

  @Public()
  @HttpCode(HttpStatus.ACCEPTED)
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto.email);
  }

  @Public()
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto.token, dto.password);
  }

  @Post('mfa/setup')
  startMfa(@CurrentUser() user: AuthenticatedUser) {
    return this.auth.startMfaSetup(user.id);
  }

  @Post('mfa/enable')
  enableMfa(@CurrentUser() user: AuthenticatedUser, @Body() dto: MfaEnableDto) {
    return this.auth.confirmMfaSetup(user.id, dto.code);
  }

  @Post('mfa/disable')
  disableMfa(@CurrentUser() user: AuthenticatedUser) {
    return this.auth.disableMfa(user.id);
  }

  @Get('me')
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }

  @Post('logout')
  logout(@CurrentUser() user: AuthenticatedUser) {
    return this.auth.logout(user.id);
  }
}
