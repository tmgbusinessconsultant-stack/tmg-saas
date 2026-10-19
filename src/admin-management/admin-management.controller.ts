import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.service';
import { Roles } from '../auth/roles.decorator';
import { AdminManagementService } from './admin-management.service';

@Controller('admin')
@Roles(UserRole.SUPER_ADMIN)
export class AdminManagementController {
  constructor(private readonly management: AdminManagementService) {}

  @Get('users')
  listUsers() {
    return this.management.listUsers();
  }

  @Patch('users/:id/access')
  updateAccess(
    @Param('id') id: string,
    @Body() body: { role?: unknown; permissions?: unknown },
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.management.updateAccess(id, body, actor);
  }

  @Get('activity')
  listActivity() {
    return this.management.listActivity();
  }
}
