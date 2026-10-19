import { isPaymentPlanId } from "@/lib/payment-plans";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ message: "Invalid JSON request." }, { status: 400 });
  }

  if (!isRecord(body) || !isPaymentPlanId(body.planId)) {
    return Response.json({ message: "Choose a valid pricing plan." }, { status: 400 });
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "");
  if (!apiUrl) {
    return Response.json({ message: "The payment API is not configured." }, { status: 503 });
  }

  try {
    const response = await fetch(`${apiUrl}/payments/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId: body.planId }),
      cache: "no-store",
    });
    const result: unknown = await response.json();
    return Response.json(result, { status: response.status });
  } catch (error) {
    console.error("Could not reach the payment API", error);
    return Response.json({ message: "Could not reach the payment service. Please try again." }, { status: 502 });
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
