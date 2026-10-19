import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PaymentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CapturePaymentDto, type PaymentPlanId } from './dto/capture-payment.dto';

const plans = {
  starter: { name: 'Starter', amount: '27.20' },
  pro: { name: 'Pro', amount: '82.14' },
  business: { name: 'Business', amount: '274.45' },
} as const;

type PayPalEnvironment = 'sandbox' | 'live';

interface PayPalConfig {
  clientId: string;
  clientSecret: string;
  baseUrl: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrder(planId: PaymentPlanId) {
    const plan = plans[planId];
    if (!plan) {
      throw new BadRequestException('Choose a valid pricing plan.');
    }

    const config = this.getPayPalConfig();
    const accessToken = await this.getAccessToken(config);
    const result = await this.paypalRequest(config, accessToken, '/v2/checkout/orders', 'POST', {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: planId,
          custom_id: planId,
          description: `${plan.name} business tools package`,
          amount: { currency_code: 'USD', value: plan.amount },
        },
      ],
      application_context: {
        brand_name: 'TMG Business Consultant',
        user_action: 'PAY_NOW',
        shipping_preference: 'NO_SHIPPING',
      },
    });

    if (!isRecord(result) || typeof result.id !== 'string' || !/^[A-Z0-9-]{10,64}$/.test(result.id)) {
      throw new BadGatewayException('PayPal did not return a valid order.');
    }
    return { orderID: result.id };
  }

  async capture(dto: CapturePaymentDto) {
    const plan = plans[dto.planId];
    const existing = await this.prisma.payment.findUnique({
      where: { providerOrderId: dto.orderID },
    });
    if (existing) {
      if (existing.planId !== dto.planId) {
        throw new BadRequestException('This PayPal order is associated with a different plan.');
      }
      if (existing.status === PaymentStatus.COMPLETED) {
        return this.toResponse(existing);
      }
    }

    const config = this.getPayPalConfig();
    const accessToken = await this.getAccessToken(config);
    const order = await this.paypalRequest(
      config,
      accessToken,
      `/v2/checkout/orders/${encodeURIComponent(dto.orderID)}`,
      'GET',
    );

    if (!isRecord(order) || !this.matchesPlan(order, dto.planId, plan.amount)) {
      throw new BadRequestException('The PayPal order does not match the selected plan.');
    }

    let capturedOrder = order;
    if (order.status === 'APPROVED') {
      capturedOrder = await this.paypalRequest(
        config,
        accessToken,
        `/v2/checkout/orders/${encodeURIComponent(dto.orderID)}/capture`,
        'POST',
        {},
        dto.orderID,
      ) as Record<string, unknown>;
    } else if (order.status !== 'COMPLETED') {
      throw new BadRequestException('The PayPal order has not been approved for capture.');
    }

    if (!isRecord(capturedOrder) || capturedOrder.status !== 'COMPLETED' || !this.matchesPlan(capturedOrder, dto.planId, plan.amount)) {
      throw new BadGatewayException('PayPal did not confirm a completed payment for the expected amount.');
    }

    const capture = this.getCompletedCapture(capturedOrder, plan.amount);
    const paymentData = {
      captureId: capture.id,
      planId: dto.planId,
      amount: new Prisma.Decimal(plan.amount),
      currency: 'USD',
      status: PaymentStatus.COMPLETED,
      completedAt: new Date(),
    };

    try {
      const payment = await this.prisma.payment.upsert({
        where: { providerOrderId: dto.orderID },
        create: {
          provider: 'PAYPAL',
          providerOrderId: dto.orderID,
          ...paymentData,
        },
        update: paymentData,
      });
      return this.toResponse(payment);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const duplicateCapture = await this.prisma.payment.findUnique({
          where: { captureId: capture.id },
        });
        if (duplicateCapture?.providerOrderId === dto.orderID && duplicateCapture.status === PaymentStatus.COMPLETED) {
          return this.toResponse(duplicateCapture);
        }
      }
      throw error;
    }
  }

  async findAll() {
    const payments = await this.prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return payments.map((payment) => this.toResponse(payment));
  }

  async revenueStats() {
    const [aggregate, count] = await Promise.all([
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: PaymentStatus.COMPLETED, currency: 'USD' },
      }),
      this.prisma.payment.count({ where: { status: PaymentStatus.COMPLETED } }),
    ]);
    return {
      currency: 'USD',
      total: Number(aggregate._sum.amount ?? 0),
      completedPayments: count,
    };
  }

  private getPayPalConfig(): PayPalConfig {
    const environment = process.env.PAYPAL_ENV;
    const clientId = process.env.PAYPAL_CLIENT_ID?.trim();
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET?.trim();
    if (
      (environment !== 'sandbox' && environment !== 'live') ||
      !clientId ||
      !clientSecret
    ) {
      throw new ServiceUnavailableException('PayPal server credentials are not configured.');
    }
    return {
      clientId,
      clientSecret,
      baseUrl: environment === 'live'
        ? 'https://api-m.paypal.com'
        : 'https://api-m.sandbox.paypal.com',
    };
  }

  private async getAccessToken(config: PayPalConfig): Promise<string> {
    let response: Response;
    try {
      response = await fetch(`${config.baseUrl}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
        cache: 'no-store',
      });
    } catch {
      throw new BadGatewayException('Could not connect to PayPal authentication.');
    }

    if (!response.ok) {
      throw new ServiceUnavailableException('PayPal authentication failed. Check the API credentials and environment.');
    }
    const body: unknown = await response.json();
    if (!isRecord(body) || typeof body.access_token !== 'string') {
      throw new BadGatewayException('PayPal returned an invalid authentication response.');
    }
    return body.access_token;
  }

  private async paypalRequest(
    config: PayPalConfig,
    accessToken: string,
    path: string,
    method: 'GET' | 'POST',
    body?: unknown,
    requestId?: string,
  ): Promise<unknown> {
    let response: Response;
    try {
      response = await fetch(`${config.baseUrl}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
          ...(requestId ? { 'PayPal-Request-Id': `tmg-capture-${requestId}` } : {}),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        cache: 'no-store',
      });
    } catch {
      throw new BadGatewayException('Could not connect to PayPal.');
    }
    if (!response.ok) {
      throw new BadGatewayException(`PayPal request failed with HTTP ${response.status}.`);
    }
    return response.json();
  }

  private matchesPlan(order: Record<string, unknown>, planId: string, amount: string): boolean {
    if (!Array.isArray(order.purchase_units) || order.purchase_units.length !== 1) return false;
    const purchaseUnit: unknown = order.purchase_units[0];
    if (
      !isRecord(purchaseUnit) ||
      purchaseUnit.custom_id !== planId ||
      !isRecord(purchaseUnit.amount)
    ) {
      return false;
    }
    return purchaseUnit.amount.currency_code === 'USD' && purchaseUnit.amount.value === amount;
  }

  private getCompletedCapture(order: Record<string, unknown>, expectedAmount: string): { id: string } {
    const units = Array.isArray(order.purchase_units) ? order.purchase_units : [];
    const unit = units[0];
    const payments = isRecord(unit) && isRecord(unit.payments) ? unit.payments : null;
    const captures = payments && Array.isArray(payments.captures) ? payments.captures : [];
    const capture = captures[0];
    if (!isRecord(capture) || capture.status !== 'COMPLETED' || typeof capture.id !== 'string') {
      throw new BadGatewayException('PayPal did not return a completed payment capture.');
    }
    if (
      !isRecord(capture.amount) ||
      capture.amount.currency_code !== 'USD' ||
      capture.amount.value !== expectedAmount
    ) {
      throw new BadGatewayException('The captured payment amount does not match the selected plan.');
    }
    return { id: capture.id };
  }

  private toResponse(payment: {
    id: string;
    providerOrderId: string;
    captureId: string | null;
    planId: string;
    amount: Prisma.Decimal;
    currency: string;
    status: PaymentStatus;
    completedAt: Date | null;
    createdAt: Date;
  }) {
    return {
      id: payment.id,
      orderID: payment.providerOrderId,
      captureID: payment.captureId,
      planId: payment.planId,
      amount: Number(payment.amount),
      currency: payment.currency,
      status: payment.status,
      completedAt: payment.completedAt,
      createdAt: payment.createdAt,
    };
  }
}
