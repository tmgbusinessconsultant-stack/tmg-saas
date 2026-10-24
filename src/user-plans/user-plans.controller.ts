import { Controller, Get, UseGuards, Req, Param, Post, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserPlansService } from './user-plans.service';
import { PlansService } from '../plans/plans.service';

@Controller('user-plans')
@UseGuards(JwtAuthGuard)
export class UserPlansController {
  constructor(private userPlans: UserPlansService, private plans: PlansService) {}

  @Get('current')
  async getCurrent(@Req() req: any) {
    const userId = req.user.id || req.user.sub;
    try {
      const plan = await this.userPlans.getCurrentPlan(userId);
      const config = this.plans.getPlan(plan.planId);
      const daysLeft = Math.ceil((new Date(plan.endDate).getTime() - Date.now()) / (1000*60*60*24));
      return { ...plan, planConfig: config, daysLeft, isExpiringSoon: daysLeft <= 3, isExpired: daysLeft < 0 };
    } catch (e) {
      return { planId: null, status: 'NO_PLAN', message: 'No active plan, trial available' };
    }
  }

  @Get('check/:toolId')
  async checkAccess(@Req() req: any, @Param('toolId') toolId: string) {
    const userId = req.user.id || req.user.sub;
    try {
      const plan = await this.userPlans.checkToolAccess(userId, toolId);
      return { allowed: true, plan };
    } catch (e: any) {
      return { allowed: false, message: e.message };
    }
  }

  @Post('start-trial')
  async startTrial(@Req() req: any) {
    const userId = req.user.id || req.user.sub;
    return this.userPlans.createTrial(userId);
  }

  // ===== ADMIN ROUTES — SUPER_ADMIN ONLY =====
  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async getAll(@Req() req: any) {
    return this.userPlans.getAllPlans();
  }

  @Post('admin/assign')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async assign(@Body() body: { userId: string, planId: any, billingCycle: any }) {
    return this.userPlans.assignPlan(body.userId, body.planId, body.billingCycle);
  }

  @Post('admin/renew/:id')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async renew(@Param('id') id: string) {
    return this.userPlans.renewPlan(id);
  }

  @Post('admin/status/:id')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.userPlans.updateStatus(id, body.status);
  }

  @Post('admin/autorenew/:id')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async updateAutoRenew(@Param('id') id: string, @Body() body: { autoRenew: boolean }) {
    return this.userPlans.updateAutoRenew(id, body.autoRenew);
  }

  @Post('admin/reset-usage/:id')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async resetUsage(@Param('id') id: string) {
    return this.userPlans.resetUsage(id);
  }

  @Post('admin/tools/:id')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async updateTools(@Param('id') id: string, @Body() body: { allowedTools: string[] }) {
    return this.userPlans.updateTools(id, body.allowedTools);
  }
}
