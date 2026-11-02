import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getPayPalApiBase, resolvePayPalMode } from './paypal-config';

const PLAN_MAP: Record<string, { id: string; billing: 'monthly' | 'annual' }> = {
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

type PayPalHeaders = Record<string, string | string[] | undefined>;
type PayPalSubscription = {
  id: string;
  status: string;
  plan_id: string;
  custom_id?: string;
  billing_info?: { next_billing_time?: string };
};

@Injectable()
export class PaypalService {
  private readonly logger = new Logger(PaypalService.name);

  constructor(private prisma: PrismaService) {}

  private getApiBase(): string {
    try {
      return getPayPalApiBase(resolvePayPalMode());
    } catch (error) {
      throw new ServiceUnavailableException(error instanceof Error ? error.message : 'PayPal configuration is invalid.');
    }
  }

  private async getPayPalToken(): Promise<{ token: string; base: string }> {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const secret = process.env.PAYPAL_CLIENT_SECRET;
    const base = this.getApiBase();
    if (!clientId || !secret) {
      throw new ServiceUnavailableException('PayPal API credentials are not configured.');
    }

    const response = await fetch(`${base}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
    if (!response.ok) throw new BadGatewayException('PayPal authentication failed.');

    const data = (await response.json()) as { access_token?: unknown };
    if (typeof data.access_token !== 'string' || !data.access_token) {
      throw new BadGatewayException('PayPal returned an invalid access token response.');
    }
    return { token: data.access_token, base };
  }

  private async getSubscription(subscriptionId: string): Promise<PayPalSubscription> {
    const { token, base } = await this.getPayPalToken();
    const response = await fetch(
      `${base}/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!response.ok) throw new BadGatewayException('Could not verify the PayPal subscription.');
    return (await response.json()) as PayPalSubscription;
  }

  async verifyAndActivate(body: unknown, userId: string) {
    if (!body || typeof body !== 'object' || !('subscriptionID' in body)) {
      throw new BadRequestException('Missing subscriptionID.');
    }
    const subscriptionID = (body as { subscriptionID?: unknown }).subscriptionID;
    if (typeof subscriptionID !== 'string' || !subscriptionID) {
      throw new BadRequestException('Missing subscriptionID.');
    }
    if (!userId) throw new UnauthorizedException();

    const subscription = await this.getSubscription(subscriptionID);
    if (subscription.status !== 'ACTIVE') {
      throw new BadRequestException('The PayPal subscription is not active.');
    }
    if (subscription.custom_id !== userId) {
      throw new UnauthorizedException('This PayPal subscription is not assigned to this account.');
    }

    const mapped = PLAN_MAP[subscription.plan_id];
    if (!mapped || !PLAN_TOOLS[mapped.id]) {
      throw new BadRequestException('Unknown PayPal plan.');
    }

    const existing = await this.prisma.userPlan.findUnique({
      where: { paypalSubscriptionId: subscriptionID },
    });
    if (existing && existing.userId !== userId) {
      throw new UnauthorizedException('This PayPal subscription is already assigned to another account.');
    }

    const nextBillingTime = subscription.billing_info?.next_billing_time;
    const parsedNextBillingTime = nextBillingTime ? new Date(nextBillingTime) : undefined;
    const endDate =
      parsedNextBillingTime && !Number.isNaN(parsedNextBillingTime.getTime())
        ? parsedNextBillingTime
        : this.nextPeriodDate(mapped.billing);

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
    this.logger.log(`Verified active PayPal subscription for user ${userId}.`);
    return { success: true, plan: result };
  }

  async handleWebhookEvent(event: unknown, headers: PayPalHeaders) {
    await this.verifyWebhookSignature(event, headers);
    if (!event || typeof event !== 'object') {
      throw new BadRequestException('Invalid PayPal webhook event.');
    }

    const payload = event as {
      event_type?: unknown;
      resource?: Record<string, unknown>;
    };
    if (typeof payload.event_type !== 'string' || !payload.resource) {
      throw new BadRequestException('Invalid PayPal webhook event.');
    }
    const type = payload.event_type;
    const resource = payload.resource;
    const subscriptionId =
      this.stringValue(resource.billing_agreement_id) ||
      this.stringValue(resource.subscription_id) ||
      this.stringValue(resource.id);

    if (
      type === 'BILLING.SUBSCRIPTION.ACTIVATED' ||
      type === 'PAYMENT.SALE.COMPLETED' ||
      type === 'BILLING.SUBSCRIPTION.PAYMENT.COMPLETED' ||
      type === 'PAYMENT.CAPTURE.COMPLETED'
    ) {
      if (!subscriptionId) return { ok: true, ignored: true };
      return this.refreshSubscriptionFromPayPal(subscriptionId);
    }

    if (
      type === 'BILLING.SUBSCRIPTION.CANCELLED' ||
      type === 'BILLING.SUBSCRIPTION.SUSPENDED' ||
      type === 'BILLING.SUBSCRIPTION.EXPIRED'
    ) {
      if (!subscriptionId) return { ok: true, ignored: true };
      const existing = await this.prisma.userPlan.findUnique({
        where: { paypalSubscriptionId: subscriptionId },
      });
      if (!existing) return { ok: true, ignored: true };

      const status = type === 'BILLING.SUBSCRIPTION.CANCELLED' ? 'CANCELLED' : 'EXPIRED';
      await this.prisma.userPlan.update({
        where: { id: existing.id },
        data: { status, autoRenew: false },
      });
      return { ok: true, deactivated: subscriptionId };
    }

    return { ok: true, ignored: type };
  }

  private async verifyWebhookSignature(event: unknown, headers: PayPalHeaders): Promise<void> {
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    if (!webhookId) {
      throw new ServiceUnavailableException('PayPal webhook verification is not configured.');
    }
    if (!event || typeof event !== 'object') {
      throw new BadRequestException('Invalid PayPal webhook event.');
    }

    const normalizedHeaders = new Map(
      Object.entries(headers).map(([name, value]) => [
        name.toLowerCase(),
        Array.isArray(value) ? value[0] : value,
      ]),
    );
    const requiredHeaders = {
      auth_algo: normalizedHeaders.get('paypal-auth-algo'),
      cert_url: normalizedHeaders.get('paypal-cert-url'),
      transmission_id: normalizedHeaders.get('paypal-transmission-id'),
      transmission_sig: normalizedHeaders.get('paypal-transmission-sig'),
      transmission_time: normalizedHeaders.get('paypal-transmission-time'),
    };
    if (Object.values(requiredHeaders).some(value => !value)) {
      throw new UnauthorizedException('PayPal signature headers are incomplete.');
    }

    const { token, base } = await this.getPayPalToken();
    const response = await fetch(`${base}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...requiredHeaders,
        webhook_id: webhookId,
        webhook_event: event,
      }),
    });
    if (!response.ok) throw new BadGatewayException('PayPal webhook signature verification failed.');

    const result = (await response.json()) as { verification_status?: unknown };
    if (result.verification_status !== 'SUCCESS') {
      throw new UnauthorizedException('PayPal webhook signature is invalid.');
    }
  }

  private async refreshSubscriptionFromPayPal(subscriptionId: string) {
    const subscription = await this.getSubscription(subscriptionId);
    const existing = await this.prisma.userPlan.findUnique({
      where: { paypalSubscriptionId: subscriptionId },
    });
    if (!existing) return { ok: true, pendingVerify: true };

    const mapped = PLAN_MAP[subscription.plan_id];
    if (!mapped || existing.planId !== mapped.id) {
      throw new BadRequestException('PayPal subscription plan does not match the stored plan.');
    }
    if (subscription.status !== 'ACTIVE') {
      return { ok: true, ignored: 'subscription_not_active' };
    }

    const nextBillingTime = subscription.billing_info?.next_billing_time;
    const parsedNextBillingTime = nextBillingTime ? new Date(nextBillingTime) : undefined;
    if (!parsedNextBillingTime || Number.isNaN(parsedNextBillingTime.getTime())) {
      throw new BadGatewayException('PayPal subscription has no valid next billing time.');
    }

    await this.prisma.userPlan.update({
      where: { id: existing.id },
      data: {
        status: 'ACTIVE',
        autoRenew: true,
        endDate: parsedNextBillingTime,
        allowedTools: PLAN_TOOLS[mapped.id],
      },
    });
    return { ok: true, renewed: subscriptionId };
  }

  private nextPeriodDate(billing: 'monthly' | 'annual'): Date {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + (billing === 'annual' ? 365 : 30));
    return endDate;
  }

  private stringValue(value: unknown): string | undefined {
    return typeof value === 'string' && value.length ? value : undefined;
  }
}
