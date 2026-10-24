import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserPlansService } from '../user-plans/user-plans.service';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService, private userPlans: UserPlansService) {}

  async createOrder(planId: string, userId: string) { 
    return { id: 'ORDER_'+Date.now() };
  }

  async captureOrder(orderID: string, userId: string, planId: string, billingCycle: string) {
    const plan = await this.userPlans.assignPlan(userId, planId as any, billingCycle as any, { orderId: orderID });
    try {
      await this.prisma.payment.create({ 
        data: { 
          userId, 
          planId, 
          providerOrderId: orderID, 
          amount: 0, 
          currency: 'USD', 
          status: 'COMPLETED' as any,
          provider: 'PAYPAL'
        } 
      });
    } catch(e) { console.log('payment save error', e.message); }
    return plan;
  }

  async handlePaypalWebhook(event: any) {
    console.log('🔔 PayPal Webhook:', event.event_type);
    const type = event.event_type;
    const resource = event.resource;

    if (type === 'BILLING.SUBSCRIPTION.ACTIVATED' || type === 'PAYMENT.SALE.COMPLETED' || type === 'BILLING.SUBSCRIPTION.PAYMENT.COMPLETED' || type === 'PAYMENT.CAPTURE.COMPLETED') {
      const subscriptionId = resource.billing_agreement_id || resource.supplementary_data?.related_ids?.order_id || resource.id;
      if (!subscriptionId) return { ok: true, msg: 'no sub id' };
      
      // Try find by providerOrderId or paypalSubscriptionId
      let existingPlan = await this.prisma.userPlan.findFirst({ where: { paypalSubscriptionId: subscriptionId } });
      if (!existingPlan) {
        existingPlan = await this.prisma.userPlan.findFirst({ where: { paypalOrderId: subscriptionId } });
      }
      if (!existingPlan) return { ok: true, msg: 'plan not found '+subscriptionId };

      const renewed = await this.userPlans.renewPlan(existingPlan.id);
      console.log(`✅ Auto-renewed ${existingPlan.id} for user ${existingPlan.userId}`);
      return { ok: true, renewed: existingPlan.id };
    }

    if (type === 'BILLING.SUBSCRIPTION.CANCELLED' || type === 'BILLING.SUBSCRIPTION.SUSPENDED') {
      const subscriptionId = resource.id;
      const plan = await this.prisma.userPlan.findFirst({ where: { paypalSubscriptionId: subscriptionId } });
      if (plan) await this.prisma.userPlan.update({ where: { id: plan.id }, data: { autoRenew: false } });
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
