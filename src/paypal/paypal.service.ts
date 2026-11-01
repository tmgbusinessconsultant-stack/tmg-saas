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
    if (sub.status !== 'ACTIVE') {
      throw new BadRequestException('The PayPal subscription is not active.');
    }
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + (mapped.billing === 'annual' ? 365 : 30));
    const result = await this.prisma.userPlan.upsert({
      where: { paypalSubscriptionId: subscriptionID },
      update: {
        planId: mapped.id,
        billingCycle: mapped.billing,
        status: 'ACTIVE',
        allowedTools: PLAN_TOOLS[mapped.id],
        endDate,
      },
      create: {
        userId,
        planId: mapped.id,
        billingCycle: mapped.billing,
        status: 'ACTIVE',
        paypalSubscriptionId: subscriptionID,
        allowedTools: PLAN_TOOLS[mapped.id],
        startDate: new Date(),
        endDate,
      },
    });
    this.logger.log(`PayPal ACTIVE ${subscriptionID} -> ${mapped.id} for user ${userId}`);
    return { success: true, plan: result };
  }

  async handleWebhookEvent(event: any) {
    const type = event?.event_type;
    const resource = event?.resource;
    this.logger.log(`Webhook ${type} ${resource?.id || resource?.billing_agreement_id || ''}`);

    try {
      const subId = resource?.id || resource?.billing_agreement_id || resource?.subscription_id || event?.resource?.id;
      
      if (type === 'BILLING.SUBSCRIPTION.ACTIVATED' || type === 'PAYMENT.SALE.COMPLETED') {
        const planId = resource?.plan_id || resource?.plan?.id;
        const mapped = PLAN_MAP[planId];
        if (!mapped || !subId) return { ok: true, ignored: true };
        
        // Try to find existing userPlan
        const existing = await this.prisma.userPlan.findFirst({ where: { paypalSubscriptionId: subId } });
        if (!existing) {
          this.logger.warn(`Webhook ${type} for unknown sub ${subId} - waiting for /verify`);
          return { ok: true, pendingVerify: true };
        }
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + (mapped.billing === 'annual' ? 365 : 30));
        await this.prisma.userPlan.update({
          where: { id: existing.id },
          data: { status: 'ACTIVE', endDate, allowedTools: PLAN_TOOLS[mapped.id] },
        });
        return { ok: true, renewed: subId };
      }

      if (type === 'BILLING.SUBSCRIPTION.CANCELLED' || type === 'BILLING.SUBSCRIPTION.SUSPENDED' || type === 'BILLING.SUBSCRIPTION.EXPIRED') {
        if (!subId) return { ok: true };
        const existing = await this.prisma.userPlan.findFirst({ where: { paypalSubscriptionId: subId } });
        if (existing) {
          await this.prisma.userPlan.update({
            where: { id: existing.id },
            data: { status: type.includes('CANCELLED') ? 'CANCELLED' : 'EXPIRED', autoRenew: false },
          });
        }
        return { ok: true, deactivated: subId };
      }

      return { ok: true, received: type };
    } catch (e) {
      this.logger.error(`Webhook error ${type}: ${e}`);
      return { ok: true, error: String(e) }; // return 200 so PayPal doesn't retry endlessly
    }
  }
}
