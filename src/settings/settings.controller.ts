import { Body, Controller, Get, Patch, Put, Delete, Param } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { Permissions } from '../auth/permissions.decorator';
import type { AuthenticatedUser } from '../auth/auth.service';
import { UpdateUploadLimitDto } from './dto/update-upload-limit.dto';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) { }

  // === YOUR EXISTING ENDPOINTS - UNCHANGED ===
  @Get('project-upload-limit')
  getProjectUploadLimit() {
    return this.settings.getProjectUploadLimit();
  }

  @Patch('project-upload-limit')
  @Permissions('settings:manage')
  updateProjectUploadLimit(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UpdateUploadLimitDto,
  ) {
    return this.settings.updateProjectUploadLimit(user, body.maximumMegabytes);
  }

  // === NEW TAB 1 ENDPOINTS - ADDITION ONLY ===
  @Get('public')
  @Permissions('settings:manage')
  getPublic() {
    return this.settings.getAllPublic();
  }

  @Get('effective/:key')
  @Permissions('settings:manage')
  getOne(@Param('key') key: string) {
    return this.settings.getEffective(key);
  }

  @Put(':key')
  @Permissions('settings:manage')
  setPublic(
    @Param('key') key: string,
    @Body() body: { value: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.settings.setPublic(key, body.value, user);
  }

  @Delete(':key')
  @Permissions('settings:manage')
  del(@Param('key') key: string) {
    return this.settings.deletePublic(key);
  }
}