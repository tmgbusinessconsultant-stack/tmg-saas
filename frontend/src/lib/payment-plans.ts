export const paymentPlans = {
  starter: {
    id: "starter",
    name: "Starter",
    amount: "27.20",
    displayPrice: "$27.20",
    currency: "USD",
    description: "Starter business tools package",
    features: ["1 AI tool access", "Basic CV Builder", "Business Assistant"],
    highlight: false,
  },
  pro: {
    id: "pro",
    name: "Pro",
    amount: "82.14",
    displayPrice: "$82.14",
    currency: "USD",
    description: "Pro business tools package",
    features: ["All 6 AI tools", "CV and business plan tools", "Document review", "Priority support"],
    highlight: true,
  },
  business: {
    id: "business",
    name: "Business",
    amount: "274.45",
    displayPrice: "$274.45",
    currency: "USD",
    description: "Business consulting and AI tools package",
    features: ["Everything in Pro", "Human expert review", "SOP and policy pack", "1-on-1 consultation"],
    highlight: false,
  },
} as const;

export type PaymentPlanId = keyof typeof paymentPlans;

export function isPaymentPlanId(value: unknown): value is PaymentPlanId {
  return typeof value === "string" && Object.hasOwn(paymentPlans, value);
}
