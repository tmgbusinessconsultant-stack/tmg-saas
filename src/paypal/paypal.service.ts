import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const PLAN_MAP: Record<string, { id: string, billing: string }> = {
  'P-6JD50850NE6749845NLPPESI': { id: 'starter', billing: 'monthly' },
  'P-6JD50850NE4749845NLPPESI': { id: 'starter', billing: 'monthly' },
  'P-75J29224C3625300JNLPPPSI': { id: 'starter', billing: 'annual' },
  'P-75J29224C3623300JNLPPPSI': { id: 'starter', billing: 'annual' },
  'P-6JB47037J1H7198935NLPP4AI': { id: 'pro', billing: 'monthly' },
  'P-4KL53403RN578542RNLPQA5Q': { id: 'pro', billing: 'annual' },
  'P-01J52058YU3S05116NLPQF6Q': { id: 'business', billing: 'monthly' },
  'P-01J32058YU35O5116NLPQF6Q': { id: 'business', billing: 'monthly' },
  'P-48A98289TE6078010NLPQJSQ': { id: 'business', billing: 'annual' },
};

const PLAN_TOOLS: Record<string, string[]> = {
  starter: ['business-assistant'],
  pro: ['business-assistant', 'cv-builder', 'business-plan', 'document-review', 'cover-letter', 'risk-assessment'],
  business: ['business-assistant', 'cv-builder', 'business-plan', 'document-review', 'cover-letter', 'risk-assessment', 'sop-builder', 'policy-generator', 'expert-review'],
};

@Injectable()
export class PaypalService {
  private readonly logger = new Logger(PaypalService.name);
  constructor(private prisma: PrismaService) {}

  private async getPayPalToken() {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const secret = process.env.PAYPAL_SECRET || process.env.PAYPAL_CLIENT_SECRET;
    if (!clientId || !secret) throw new Error('PAYPAL_CLIENT_ID/SECRET missing');
    const base = process.env.PAYPAL_ENV === 'sandbox' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';
    const auth = Buffer.from(`${clientId}:${secret}`).toString('base64');
    const res = await fetch(`${base}/v1/oauth2/token`, {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'grant_type=client_credentials',
    });
    if (!res.ok) throw new Error(`PayPal auth failed: ${await res.text()}`);
    const data = await res.json();
    return { token: data.access_token as string, base };
  }

  async verifyAndActivate(body: any, userId: string) {
    const { subscriptionID } = body;
    if (!subscriptionID) throw new BadRequestException('Missing subscriptionID');
    const { token, base } = await this.getPayPalToken();
    const res = await fetch(`${base}/v1/billing/subscriptions/${subscriptionID}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new BadRequestException(`Verify failed: ${await res.text()}`);
    const sub = await res.json();
    if (!['ACTIVE','APPROVED','APPROVAL_PENDING'].includes(sub.status)) throw new BadRequestException(`Status ${sub.status}`);
    const mapped = PLAN_MAP[sub.plan_id];
    if (!mapped) throw new BadRequestException(`Unknown plan_id ${sub.plan_id}`);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (mapped.billing === 'annual' ? 365 : 30));
    const result = await this.prisma.userPlan.upsert({
      where: { userId },
      update: { planId: mapped.id, billingCycle: mapped.billing, status: 'ACTIVE', paypalSubscriptionId: subscriptionID, paypalPlanId: sub.plan_id, allowedTools: PLAN_TOOLS[mapped.id], expiresAt },
      create: { userId, planId: mapped.id, billingCycle: mapped.billing, status: 'ACTIVE', paypalSubscriptionId: subscriptionID, paypalPlanId: sub.plan_id, allowedTools: PLAN_TOOLS[mapped.id], expiresAt },
    });
    return { success: true, plan: result };
  }

  async handleWebhookEvent(event: any) {
    return { ok: true, received: event.event_type };
  }
}
