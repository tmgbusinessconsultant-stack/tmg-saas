import { BadRequestException, Injectable, ServiceUnavailableException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { PaypalService } from "../paypal/paypal.service";

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService, private paypal: PaypalService) {}

  private ensurePaypal() {
    if (!this.paypal) throw new ServiceUnavailableException("PayPal is not configured.");
  }

  private parseAmount(v: unknown): number {
    const n = typeof v === "string" ? parseFloat(v) : typeof v === "number" ? v : NaN;
    if (!Number.isFinite(n) || n <= 0 || n > 100000) throw new BadRequestException("Invalid amount.");
    return Math.round(n * 100) / 100;
  }

  private parseCurrency(v: unknown): string {
    const c = typeof v === "string" ? v.toUpperCase().trim() : "USD";
    if (!/^[A-Z]{3}$/.test(c)) throw new BadRequestException("Invalid currency.");
    return c;
  }

  // Generic one-time order (logged-in user)
  async createOrder(body: any, userId?: string) {
    this.ensurePaypal();
    const amount = this.parseAmount(body?.amount);
    const currency = this.parseCurrency(body?.currency);
    const order = await this.paypal.createCheckoutOrder(amount, currency);
    const saved = await this.prisma.payment.create({
      data: { userId: userId ?? null, provider: "PAYPAL", providerOrderId: order.id, planId: body?.planId ?? "shop", amount, currency, status: "PENDING" },
    });
    return { id: saved.id, paypalOrderId: order.id, approveUrl: order.links?.find((l: any) => l.rel === "approve")?.href, status: order.status };
  }

  async captureOrder(body: any) {
    this.ensurePaypal();
    const orderId = body?.orderId || body?.paypalOrderId;
    if (!orderId) throw new BadRequestException("Missing orderId.");
    return this.captureByPaypalId(orderId);
  }

  // Shop guest checkout - same flow, no userId
  async createShopOrder(body: any) {
    const product = body?.product ?? body;
    const amount = body?.amount ?? product?.price;
    const currency = body?.currency ?? product?.currency ?? "USD";
    const productId = product?.id ?? body?.productId ?? "shop";
    return this.createOrder({ amount, currency, planId: productId, productId });
  }
  async captureShopOrder(body: any) {
    let orderId = body?.orderID ?? body?.orderId ?? body?.paypalOrderId ?? body?.token;
    if (orderId) {
      const byDbId = await this.prisma.payment.findUnique({ where: { id: orderId } }).catch(() => null);
      if (byDbId) orderId = byDbId.providerOrderId;
    }
    const result: any = await this.captureOrder({ orderId, paypalOrderId: orderId });
    return { success: true, status: result?.status ?? "COMPLETED", downloadToken: result?.id ?? orderId, payment: result };
  }

  private async captureByPaypalId(orderId: string) {
    const existing = await this.prisma.payment.findUnique({ where: { providerOrderId: orderId } });
    if (!existing) throw new BadRequestException("Order not found. Create order first - never capture an unverified order.");
    if (existing.status === "COMPLETED") return existing;

    // Verify with PayPal FIRST - source of truth, not frontend
    const verified = await this.paypal.getCheckoutOrder(orderId);
    if (verified.status === "APPROVED") {
      const captured: any = await this.paypal.captureCheckoutOrder(orderId);
      const cap = captured?.purchase_units?.[0]?.payments?.captures?.[0];
      if (captured.status !== "COMPLETED" || !cap || cap.status !== "COMPLETED") throw new BadRequestException("PayPal capture not completed.");
      // Amount check - prevent tampering
      if (Number(cap.amount?.value) !== Number(existing.amount)) throw new BadRequestException("Amount mismatch - capture rejected.");
      return this.prisma.payment.update({
        where: { providerOrderId: orderId },
        data: { status: "COMPLETED", captureId: cap.id, completedAt: new Date() },
      });
    }
    if (verified.status === "COMPLETED") {
      return this.prisma.payment.update({ where: { providerOrderId: orderId }, data: { status: "COMPLETED", completedAt: new Date() } });
    }
    throw new BadRequestException(`Order not approved yet. PayPal status: ${verified.status}`);
  }

  async getPayments() { return this.prisma.payment.findMany({ orderBy: { createdAt: "desc" } }); }
  async getStats() {
    const total = await this.prisma.payment.count();
    const revenue = await this.prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "COMPLETED" } });
    return { total, revenue: Number(revenue._sum?.amount || 0) };
  }
}
