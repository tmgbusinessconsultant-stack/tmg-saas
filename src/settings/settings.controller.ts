import { Body, Controller, Get, Patch } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { Permissions } from '../auth/permissions.decorator';
import type { AuthenticatedUser } from '../auth/auth.service';
import { UpdateUploadLimitDto } from './dto/update-upload-limit.dto';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

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
}
