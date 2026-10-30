import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserPlansService } from '../user-plans/user-plans.service';
import { PLANS_CONFIG } from '../plans/plans.service';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService, private userPlans: UserPlansService) {}

  // Existing plan flow
  async createOrder(planId: string, userId: string) {
    const plan = PLANS_CONFIG[planId as keyof typeof PLANS_CONFIG];
    const hasPaypalPlan = !!(plan as any)?.paypalMonthlyPlanId;
    if (!hasPaypalPlan || process.env.PAYPAL_ENV === 'mock') {
      return { id: 'ORDER_'+Date.now(), mock: true, planId };
    }
    return {
      id: 'SUB_'+Date.now(),
      planId,
      approvalUrl: `https://www.sandbox.paypal.com/webapps/billing/agreements?plan_id=${(plan as any).paypalMonthlyPlanId}`,
      isSubscription: true
    };
  }

  async captureOrder(orderID: string, userId: string, planId: string, billingCycle: string) {
    const plan = await this.userPlans.assignPlan(userId, planId as any, billingCycle as any, {orderId: orderID });
    try {
      await this.prisma.payment.create({
        data: {
          userId,
          planId,
          providerOrderId: orderID,
          amount: PLANS_CONFIG[planId as keyof typeof PLANS_CONFIG]?.monthlyPrice || 0,
          currency: 'USD',
          status: 'COMPLETED' as any,
          provider: 'PAYPAL'
        }
      });
    } catch(e) { console.log('payment save error', (e as any).message); }
    return plan;
  }

  // NEW — SHOP PRODUCTS flow
  async createShopOrder(product: any, userId?: string) {
    // In mock mode or no PayPal creds, return mock order
    if (process.env.PAYPAL_ENV === 'mock' || !process.env.PAYPAL_CLIENT_ID) {
      return { id: 'SHOP_ORDER_'+Date.now(), mock: true, product, amount: product.price, currency: product.currency || 'USD' };
    }
    // Real PayPal v2 orders API would go here — for now mock + log
    return { id: 'SHOP_ORDER_'+Date.now(), productId: product.id, amount: product.price, currency: product.currency || 'USD' };
  }

  async captureShopOrder(orderID: string, product: any, userId?: string) {
    // Save payment record for shop product
    try {
      const payment = await this.prisma.payment.create({
        data: {
          userId: userId || null,
          planId: product.id, // reuse planId field to store productId
          providerOrderId: orderID,
          amount: product.price || 0,
          currency: product.currency || 'USD',
          status: 'COMPLETED' as any,
          provider: 'PAYPAL',
          captureId: `shop_${product.id}_${Date.now()}`,
        }
      });
      return { success: true, payment, downloadToken: payment.captureId, product };
    } catch (e) {
      console.log('shop payment error', (e as any).message);
      return { success: true, mock: true, downloadToken: `shop_${product.id}_${Date.now()}`, product };
    }
  }

  async handlePaypalWebhook(event: any) {
    console.log('PayPal Webhook:', event.event_type);
    const type = event.event_type;
    const resource = event.resource;
    if (type.includes('SUBSCRIPTION.ACTIVATED') || type.includes('PAYMENT.SALE.COMPLETED') || type.includes('SUBSCRIPTION.PAYMENT.COMPLETED') || type.includes('CAPTURE.COMPLETED')) {
      const subscriptionId = resource.billing_agreement_id || resource.supplementary_data?.related_ids?.order_id || resource.id;
      if (!subscriptionId) return { ok: true, msg: 'no sub id' };
      let existingPlan = await this.prisma.userPlan.findFirst({ where: { paypalSubscriptionId:subscriptionId } });
      if (!existingPlan) existingPlan = await this.prisma.userPlan.findFirst({ where: { paypalOrderId: subscriptionId } });
      if (!existingPlan) return { ok: true, msg: 'plan not found '+subscriptionId };
      await this.userPlans.renewPlan(existingPlan.id);
      return { ok: true, renewed: existingPlan.id };
    }
    if (type.includes('SUBSCRIPTION.CANCELLED') || type.includes('SUBSCRIPTION.SUSPENDED')) {
      const plan = await this.prisma.userPlan.findFirst({ where: { paypalSubscriptionId: resource.id } });
      if (plan) await this.prisma.userPlan.update({ where: { id: plan.id }, data: { autoRenew:false } });
      return { ok: true };
    }
    return { ok: true, ignored: type };
  }

  async getPayments() { return this.prisma.payment.findMany({ orderBy: { createdAt: 'desc' } }); }
  async getStats() {
    const total = await this.prisma.payment.count();
    const rev = await this.prisma.payment.aggregate({ _sum: { amount: true } });
    return { total, revenue: Number((rev as any)._sum?.amount || 0) };
  }
}
