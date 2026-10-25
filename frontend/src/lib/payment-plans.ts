export const paymentPlans = {
  starter: {
    id: "starter",
    name: "Starter",
    amount: "27",
    displayPrice: "$27",
    qarPrice: "QAR 99",
    currency: "USD",
    interval: "month",
    description: "Essential tools to get started",
    features: ["1 AI tool access", "Basic CV Builder", "Business Assistant", "Email support"],
    highlight: false,
    cta: "Start with Starter",
  },
  pro: {
    id: "pro",
    name: "Pro",
    amount: "82",
    displayPrice: "$82",
    qarPrice: "QAR 299",
    currency: "USD",
    interval: "month",
    description: "Most popular for SMEs & founders worldwide",
    features: ["All 6 AI tools", "CV + Business Plan", "Document review", "Risk & SOP", "Priority support"],
    highlight: true,
    badge: "Most Popular",
    cta: "Get Pro Access",
  },
  business: {
    id: "business",
    name: "Business",
    amount: "274",
    displayPrice: "$274",
    qarPrice: "QAR 999",
    currency: "USD",
    interval: "month",
    description: "For teams needing expert + compliance review",
    features: ["Everything in Pro", "Human expert review", "SOP & Policy pack", "1-on-1 consultation", "Market-specific review (Qatar / US / UK)"],
    highlight: false,
    cta: "Get Business",
  },
} as const;

export type PaymentPlanId = keyof typeof paymentPlans;

export function isPaymentPlanId(value: unknown): value is PaymentPlanId {
  return typeof value === "string" && (value as string) in paymentPlans;
}

export function getPlanPrice(planId: PaymentPlanId, opts?: { country?: string }) {
  const plan = paymentPlans[planId];
  const country = opts?.country?.toLowerCase();
  // Auto QAR for Qatar, USD for rest of world
  if (country === "qatar" || country === "qa") return plan.qarPrice;
  return plan.displayPrice;
}