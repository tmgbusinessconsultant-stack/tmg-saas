import { Injectable } from '@nestjs/common';
import { UserPlansService } from '../user-plans/user-plans.service';

const PLAN_MAP: any = {
  'P-6JD50850NE6749845NLPPESI': { id: 'starter', billing: 'monthly' },
  'P-75J29224C3625300JNLPPPSI': { id: 'starter', billing: 'annual' },
  'P-6JB47037J1H7198935NLPP4AI': { id: 'pro', billing: 'monthly' },
  'P-4KL53403RN578542RNLPQA5Q': { id: 'pro', billing: 'annual' },
  'P-01J52058YU3S05116NLPQF6Q': { id: 'business', billing: 'monthly' },
  'P-48A98289TE6078010NLPQJSQ': { id: 'business', billing: 'annual' },
};

@Injectable()
export class PaypalService {
  constructor(private userPlansService: UserPlansService) {}

  async verifyAndActivate(body: any, userId: string) {
    const { subscriptionID, planId, billingCycle } = body;
    console.log(`✅ PayPal Verify: user=${userId} sub=${subscriptionID} plan=${planId} billing=${billingCycle}`);
    
    // Assign plan to user - this activates it immediately
    const result = await this.userPlansService.assignPlan(
      userId,
      planId,
      billingCycle,
      { subscriptionId: subscriptionID }
    );
    
    return { success: true, plan: result };
  }

  async handleWebhookEvent(event: any) {
    console.log('PayPal Webhook Event:', event.event_type);
    // Webhook is backup - frontend verify is primary
  }
}