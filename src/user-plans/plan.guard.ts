import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlanGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  // Map your 3 plans to allowed AI tools
  private readonly PLAN_TOOLS: Record<string, string[]> = {
    starter: ['business-assistant'], // 1 tool
    pro: ['business-assistant', 'cv-builder', 'business-plan', 'document-review', 'cover-letter', 'risk-assessment'],
    business: ['business-assistant', 'cv-builder', 'business-plan', 'document-review', 'cover-letter', 'risk-assessment', 'sop-builder', 'policy-generator', 'expert-review'],
    free: [],
  };

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) throw new ForbiddenException('Not authenticated - login first');
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') return true;

    const userId = user.userId || user.id || user.sub;
    const userPlan = await this.prisma.userPlan.findFirst({ 
      where: { userId },
      orderBy: { createdAt: 'desc' } // get latest plan
    });

    if (!userPlan) {
      throw new ForbiddenException('No active plan. Please subscribe at /pricing to unlock AI Tools.');
    }

    if (userPlan.status !== 'ACTIVE' && userPlan.status !== 'FREE') {
      throw new ForbiddenException(`Your ${userPlan.planId} plan is ${userPlan.status}. Please renew at /pricing.`);
    }

    if (userPlan.endDate && new Date(userPlan.endDate) < new Date() && userPlan.status !== 'FREE') {
      throw new ForbiddenException(`Your ${userPlan.planId} plan expired on ${userPlan.endDate}. Renew at /pricing.`);
    }

    // If allowedTools is empty in DB (old records), fill from PLAN_TOOLS mapping
    let allowedTools: string[] = (userPlan as any).allowedTools || [];
    if (allowedTools.length === 0) {
      allowedTools = this.PLAN_TOOLS[userPlan.planId] || this.PLAN_TOOLS['free'] || [];
    }

    // Attach for controller use
    request.userPlan = userPlan;
    request.allowedTools = allowedTools;

    const path: string = request.route?.path || request.url || '';

    // Check tool access
    if (path.includes('cv-documents') || path.includes('cv-builder')) {
      if (!allowedTools.includes('cv-builder') && !allowedTools.includes('business-assistant')) {
        throw new ForbiddenException('Your current plan does not include CV Builder. Upgrade to Pro at /pricing.');
      }
    }

    if (path.includes('business-assistant')) {
      if (!allowedTools.includes('business-assistant')) {
        throw new ForbiddenException('Business Assistant requires Starter plan or higher. Subscribe at /pricing.');
      }
    }

    return true;
  }
}

