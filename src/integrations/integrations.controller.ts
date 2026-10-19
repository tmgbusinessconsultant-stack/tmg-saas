import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { Permissions } from '../auth/permissions.decorator';
import type { AuthenticatedUser } from '../auth/auth.service';
import { SendEmailDto } from './dto/send-email.dto';
import { IntegrationsService } from './integrations.service';

@Controller('integrations')
@Permissions('integrations:manage')
export class IntegrationsController {
  constructor(private readonly integrations: IntegrationsService) {}

  @Get('status')
  status() {
    return this.integrations.status();
  }

  @Get('microsoft365/drive')
  listDriveItems() {
    return this.integrations.listDriveItems();
  }

  @Post('microsoft365/email')
  sendEmail(@CurrentUser() user: AuthenticatedUser, @Body() body: SendEmailDto) {
    return this.integrations.sendEmail(user, body);
  }

  @Get('powerbi/reports')
  listPowerBiReports() {
    return this.integrations.listPowerBiReports();
  }

  @Get('powerbi/reports/:reportId/embed-token')
  createPowerBiEmbedToken(@Param('reportId') reportId: string) {
    return this.integrations.createPowerBiEmbedToken(reportId);
  }
}
