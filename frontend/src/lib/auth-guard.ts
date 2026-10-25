import { NextRequest, NextResponse } from "next/server";
import { isPaymentPlanId, type PaymentPlanId } from "@/lib/payment-plans";

type UserSession = { userId: string; email: string; planId?: PaymentPlanId | null };

async function getSession(req: NextRequest): Promise<UserSession | null> {
  // 1. Get token from cookie or Authorization header
  const token = req.cookies.get("access_token")?.value || 
                req.headers.get("authorization")?.replace("Bearer ", "") ||
                req.headers.get("x-user-id"); // fallback for testing

  if (!token) return null;

  try {
    // 2. Verify with your NestJS backend
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || "http://localhost:3001";
    const res = await fetch(`${backendUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store"
    });
    
    if (!res.ok) {
      // Fallback: try decode if backend /auth/me not ready
      const email = req.headers.get("x-user-email") || "user@tmg.com";
      const planId = req.headers.get("x-user-plan") as PaymentPlanId | null;
      if (req.headers.get("x-user-id")) {
        return { userId: req.headers.get("x-user-id")!, email, planId: isPaymentPlanId(planId) ? planId : null };
      }
      return null;
    }
    
    const user = await res.json();
    return { 
      userId: user.id || user.userId, 
      email: user.email, 
      planId: isPaymentPlanId(user.planId || user.plan) ? (user.planId || user.plan) : null 
    };
  } catch {
    return null;
  }
}

const PLAN_ACCESS: Record<string, PaymentPlanId[]> = {
  "cv-builder": ["starter", "pro", "business"],
  "cover-letter": ["starter", "pro", "business"],
  "productivity-planner": ["starter", "pro", "business"],
  "document-review": ["pro", "business"],
  "business-plan": ["pro", "business"],
  "sop-builder": ["pro", "business"],
  "business-assistant": ["pro", "business"],
  "proposal-packs": ["pro", "business"],
  "policy-generator": ["business"],
  "risk-assessment": ["business"],
  "business-contracts": ["business"],
};

export async function requireAuthAndPlan(req: NextRequest, tool: string) {
  const session = await getSession(req);
  if (!session) {
    return { ok: false as const, response: NextResponse.json({ message: "Please sign in to use AI tools.", code: "UNAUTHENTICATED" }, { status: 401 }) };
  }
  const allowed = PLAN_ACCESS[tool] || ["pro", "business"];
  if (!session.planId || !allowed.includes(session.planId)) {
    return { ok: false as const, response: NextResponse.json({ message: `Upgrade required: ${tool} needs ${allowed.join(" or ")} plan.`, code: "PLAN_REQUIRED", required: allowed, current: session.planId, upgradeUrl: "/pricing" }, { status: 403 }) };
  }
  return { ok: true as const, session };
}
