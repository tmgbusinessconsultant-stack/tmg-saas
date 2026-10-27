import { Body, Controller, Get, Patch, Put, Delete, Param, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { Permissions } from '../auth/permissions.decorator';
import { Roles } from '../auth/roles.decorator';
import { Public } from '../auth/public.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import type { AuthenticatedUser } from '../auth/auth.service';
import { UpdateUploadLimitDto } from './dto/update-upload-limit.dto';
import { SetPublicConfigDto } from './dto/set-public-config.dto';
import { SettingsService } from './settings.service';

@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard) // Enforces rigid passport validation across system properties boundaries
export class SettingsController {
  constructor(private readonly settings: SettingsService) { }

  // === SYSTEM UPLOAD OVERHEAD LIMIT MANAGEMENT ===
  @Get('project-upload-limit')
  async getProjectUploadLimit() {
    return this.settings.getProjectUploadLimit();
  }

  @Patch('project-upload-limit')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Permissions('settings:manage')
  async updateProjectUploadLimit(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UpdateUploadLimitDto,
  ) {
    return this.settings.updateProjectUploadLimit(user, body.maximumMegabytes);
  }

  // === DYNAMIC CONFIGURATION WORKSPACE MATRICES ===

  /**
   * EXEMPT VECTOR: Marked open so GlobalStyles theme loops can pull client keys on boot
   */
  @Public()
  @Get('public')
  async getPublic() {
    return this.settings.getAllPublic();
  }

  @Get('effective/:key')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Permissions('settings:manage')
  async getOne(@Param('key') key: string) {
    return this.settings.getEffective(key);
  }

  @Put(':key')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Permissions('settings:manage')
  async setPublic(
    @Param('key') key: string,
    @Body() body: SetPublicConfigDto, // FIXED: Replaced unsafe type bindings with rigid validation rules
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.settings.setPublic(key, body.value, user);
  }

  @Delete(':key')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Permissions('settings:manage')
  async del(@Param('key') key: string) {
    return this.settings.deletePublic(key);
  }
}
