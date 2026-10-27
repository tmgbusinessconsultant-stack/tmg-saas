import { Body, Controller, Get, Param, Patch, UseGuards, BadRequestException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UpdateAccessDto } from './dto/update-access.dto';
import type { AuthenticatedUser } from '../auth/auth.service';
import { AdminManagementService } from './admin-management.service';

@Controller('admin')
@Roles(UserRole.SUPER_ADMIN) // Matches your custom roles mapping metadata engine rules
@UseGuards(JwtAuthGuard, RolesGuard) // FIXED: Enforces the complete verification sequence on system boundaries
export class AdminManagementController {
  constructor(private readonly management: AdminManagementService) { }

  @Get('users')
  async listUsers() {
    return this.management.listUsers();
  }

  @Patch('users/:id/access')
  async updateAccess(
    @Param('id') id: string,
    @Body() body: UpdateAccessDto, // FIXED: Replaced unsafe type parameters with static validation DTO mapping rules
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    // PREVENTS SELF-MUTATION: Blocks administrative locks from locking out the current session
    const actorId = actor.id || (actor as any).sub;
    if (id === actorId) {
      throw new BadRequestException('Security Constraint Error: Self-privilege modification is entirely unauthorized on this endpoint context.');
    }

    return this.management.updateAccess(id, body, actor);
  }

  @Get('activity')
  async listActivity() {
    return this.management.listActivity();
  }
}
