import { Injectable } from '@nestjs/common';

export type PlanId = 'trial' | 'starter' | 'pro' | 'business';
export type BillingCycle = 'monthly' | 'annual' | 'trial';

export const PLANS_CONFIG = {
  trial: {
    id: 'trial',
    name: 'Free Trial',
    monthlyPrice: 0,
    annualPrice: 0,
    durationDays: 7,
    tools: ['cv-builder', 'business-assistant'], // 1 tool + assistant
    limits: { documents: 3, cv: 3, businessPlan: 0, coverLetter: 1 },
    description: '7-day free trial - No credit card',
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 27.2,
    annualPrice: 272, // 2 months free
    durationDays: 30, // monthly
    tools: ['cv-builder', 'business-assistant', 'cover-letter'], // 1-2 tools
    limits: { documents: 10, cv: 10, businessPlan: 1, coverLetter: 5 },
    description: '1 AI tool + Basic CV + Business Assistant',
    paypalMonthlyPlanId: process.env.PAYPAL_STARTER_MONTHLY_ID,
    paypalAnnualPlanId: process.env.PAYPAL_STARTER_ANNUAL_ID,
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 82.14,
    annualPrice: 821.4,
    durationDays: 30,
    tools: ['cv-builder', 'cover-letter', 'business-plan', 'document-review', 'policy-generator', 'business-assistant'], // 6 tools
    limits: { documents: 100, cv: 50, businessPlan: 20, coverLetter: 50 },
    description: '6 AI tools + CV + Business Plan + Doc Review + Priority',
    paypalMonthlyPlanId: process.env.PAYPAL_PRO_MONTHLY_ID,
    paypalAnnualPlanId: process.env.PAYPAL_PRO_ANNUAL_ID,
    mostPopular: true,
  },
  business: {
    id: 'business',
    name: 'Business',
    monthlyPrice: 274.45,
    annualPrice: 2744.5,
    durationDays: 30,
    tools: ['cv-builder', 'cover-letter', 'business-plan', 'document-review', 'policy-generator', 'sop-builder', 'business-contracts', 'proposal-packs', 'business-assistant'], // All 9
    limits: { documents: 1000, cv: 500, businessPlan: 100, coverLetter: 500 },
    description: 'Everything + Human review + SOP/policy + 1-on-1',
    paypalMonthlyPlanId: process.env.PAYPAL_BUSINESS_MONTHLY_ID,
    paypalAnnualPlanId: process.env.PAYPAL_BUSINESS_ANNUAL_ID,
  },
} as const;

@Injectable()
export class PlansService {
  getAllPlans() {
    return Object.values(PLANS_CONFIG);
  }

  getPlan(planId: string) {
    return PLANS_CONFIG[planId as PlanId];
  }

  getAllowedTools(planId: string): string[] {
    return [...(this.getPlan(planId)?.tools || [])];
  }

  canAccessTool(planId: string, toolId: string): boolean {
    const tools = this.getAllowedTools(planId);
    return tools.includes(toolId) || tools.includes('all');
  }

  calculateEndDate(planId: PlanId, billingCycle: BillingCycle, startDate = new Date()): Date {
    const plan = PLANS_CONFIG[planId];
    if (planId === 'trial') {
      const d = new Date(startDate);
      d.setDate(d.getDate() + 7);
      return d;
    }
    if (billingCycle === 'annual') {
      const d = new Date(startDate);
      d.setFullYear(d.getFullYear() + 1);
      return d;
    }
    const d = new Date(startDate);
    d.setMonth(d.getMonth() + 1);
    return d;
  }
}


