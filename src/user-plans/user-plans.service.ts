import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PlansService, PlanId, BillingCycle } from '../plans/plans.service';

@Injectable()
export class UserPlansService {
  constructor(private prisma: PrismaService, private plansService: PlansService) {}

  async getCurrentPlan(userId: string) {
    const plan = await this.prisma.userPlan.findFirst({
      where: { userId, status: 'ACTIVE' },
      orderBy: { endDate: 'desc' }
    });
    if (!plan) {
      const anyPlan = await this.prisma.userPlan.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } });
      if (!anyPlan) throw new NotFoundException('No plan found');
      return anyPlan;
    }
    return plan;
  }

  async checkToolAccess(userId: string, toolId: string) {
    const plan = await this.getCurrentPlan(userId);
    if (plan.status === 'BLOCKED') throw new ForbiddenException('Your account is blocked by admin');
    if (new Date(plan.endDate) < new Date()) throw new ForbiddenException(`Plan expired on ${plan.endDate}. Renew required.`);
    const canAccess = plan.allowedTools.includes(toolId);
    if (!canAccess) throw new ForbiddenException(`Your ${plan.planId} plan does not include ${toolId}. Upgrade to Pro/Business. Current tools: ${plan.allowedTools.join(', ')}`);
    if (plan.usageCount >= plan.usageLimit) throw new ForbiddenException(`Usage limit reached ${plan.usageCount}/${plan.usageLimit}. Renew or upgrade.`);
    return plan;
  }

  async incrementUsage(userId: string) {
    const plan = await this.getCurrentPlan(userId);
    return this.prisma.userPlan.update({ where: { id: plan.id }, data: { usageCount: { increment: 1 } } });
  }

  async createTrial(userId: string) {
    const existing = await this.prisma.userPlan.findFirst({ where: { userId, planId: 'trial' } });
    if (existing) throw new ForbiddenException('Trial already used');
    const planConfig = this.plansService.getPlan('trial');
    const endDate = new Date(); endDate.setDate(endDate.getDate() + 7);
    return this.prisma.userPlan.create({
      data: {
        userId, planId: 'trial', billingCycle: 'trial', status: 'ACTIVE',
        allowedTools: [...planConfig.tools], usageLimit: planConfig.limits.documents,
        usageCount: 0, startDate: new Date(), endDate, trialEndsAt: endDate, autoRenew: false
      }
    });
  }

  async assignPlan(userId: string, planId: string, billingCycle: string, paypalIds?: { orderId?: string, subscriptionId?: string }) {
    const normalizedId = (planId as string).toLowerCase().trim() as PlanId;
    const normalizedBilling = (billingCycle as string).toLowerCase().trim() as BillingCycle;
    const config = this.plansService.getPlan(normalizedId);
    if (!config) throw new NotFoundException(`Plan ${planId} (${normalizedId}) not found. Valid: trial, starter, pro, business`);
    
    const durationDays = normalizedBilling === 'annual' ? 365 : normalizedBilling === 'trial' ? 7 : 30;
    const endDate = new Date(); endDate.setDate(endDate.getDate() + durationDays);
    
    await this.prisma.userPlan.updateMany({ where: { userId, status: 'ACTIVE' }, data: { status: 'INACTIVE' } });
    
    return this.prisma.userPlan.create({
      data: {
        userId, planId: normalizedId, billingCycle: normalizedBilling, status: 'ACTIVE',
        allowedTools: [...config.tools], usageLimit: config.limits.documents,
        usageCount: 0, startDate: new Date(), endDate,
        autoRenew: normalizedBilling !== 'trial',
        paypalOrderId: paypalIds?.orderId,
        paypalSubscriptionId: paypalIds?.subscriptionId
      }
    });
  }

  async getAllPlans() {
    return this.prisma.userPlan.findMany({ include: { user: { select: { email: true, name: true, role: true } } }, orderBy: { createdAt: 'desc' } });
  }

  async renewPlan(planId: string) {
    const plan = await this.prisma.userPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException('Plan not found');
    const days = plan.billingCycle === 'annual' ? 365 : 30;
    const newEnd = new Date(plan.endDate); newEnd.setDate(newEnd.getDate() + days);
    return this.prisma.userPlan.update({ where: { id: planId }, data: { endDate: newEnd, usageCount: 0, status: 'ACTIVE' } });
  }

  async updateStatus(planId: string, status: string) {
    if (!['ACTIVE','BLOCKED','INACTIVE'].includes(status)) throw new ForbiddenException('Invalid status');
    return this.prisma.userPlan.update({ where: { id: planId }, data: { status } });
  }

  async updateAutoRenew(planId: string, autoRenew: boolean) {
    return this.prisma.userPlan.update({ where: { id: planId }, data: { autoRenew } });
  }

  async resetUsage(planId: string) {
    return this.prisma.userPlan.update({ where: { id: planId }, data: { usageCount: 0 } });
  }

  async updateTools(planId: string, allowedTools: string[]) {
    return this.prisma.userPlan.update({ where: { id: planId }, data: { allowedTools } });
  }
}
