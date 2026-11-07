import { NextRequest, NextResponse } from "next/server";
import { isPaymentPlanId, type PaymentPlanId } from "@/lib/payment-plans";
import { getBackendApiBase } from "@/lib/backend-api";

type UserSession = { userId: string; email: string; planId?: PaymentPlanId | null };

async function getSession(req: NextRequest): Promise<UserSession | null> {
  const cookieToken = req.cookies.get("access_token")?.value || req.cookies.get("accessToken")?.value;
  const authorization = req.headers.get("authorization");
  const headerToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  const token = cookieToken || headerToken;
  if (!token) return null;

  const response = await fetch(`${getBackendApiBase()}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (response.status === 401 || response.status === 403) return null;
  if (!response.ok) throw new Error(`Account validation failed (${response.status}).`);

  const user: unknown = await response.json();
  if (
    typeof user !== "object"
    || user === null
    || !("id" in user)
    || typeof user.id !== "string"
    || !("email" in user)
    || typeof user.email !== "string"
  ) {
    return null;
  }
  const userRecord = user as { id: string; email: string; planId?: unknown; plan?: unknown };
  const planId = userRecord.planId || userRecord.plan;
  return {
    userId: userRecord.id,
    email: userRecord.email,
    planId: isPaymentPlanId(planId) ? planId : null,
  };
}

const PLAN_ACCESS: Record<string, PaymentPlanId[]> = {
  "cv-builder": ["starter", "pro", "business"],
  "cover-letter": ["starter", "pro", "business"],
  "productivity-planner": ["starter", "pro", "business"],
  "document-review": ["pro", "business"],
  "business-plan": ["pro", "business"],
  "sop-builder": ["pro", "business"],
  "proposal-packs": ["pro", "business"],
  "policy-generator": ["business"],
  "risk-assessment": ["business"],
  "business-contracts": ["business"],
};

// FREE - any signed-in user
const FREE_TOOLS = ["business-assistant", "business-advisory", "ai-advisory"];

async function validateSession(req: NextRequest) {
  try {
    return { session: await getSession(req), unavailable: false as const };
  } catch (error) {
    console.error("Account validation request failed:", error);
    return { session: null, unavailable: true as const };
  }
}

export async function requireAuthenticated(req: NextRequest) {
  const { session, unavailable } = await validateSession(req);
  if (unavailable) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { message: "Account service is temporarily unavailable." },
        { status: 503 },
      ),
    };
  }
  if (!session) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { message: "Please sign in to use this feature.", code: "UNAUTHENTICATED" },
        { status: 401 },
      ),
    };
  }
  return { ok: true as const, session };
}

export async function requireAuthAndPlan(req: NextRequest, tool: string) {
  const { session, unavailable } = await validateSession(req);
  if (unavailable) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { message: "Account service is temporarily unavailable." },
        { status: 503 },
      ),
    };
  }
  if (!session) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { message: "Please sign in to use AI tools.", code: "UNAUTHENTICATED" },
        { status: 401 },
      ),
    };
  }
  if (FREE_TOOLS.includes(tool)) {
    return { ok: true as const, session };
  }
  const allowed = PLAN_ACCESS[tool] || ["pro", "business"];
  if (!session.planId || !allowed.includes(session.planId)) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          message: `Upgrade required: ${tool} needs ${allowed.join(" or ")} plan.`,
          code: "PLAN_REQUIRED",
          required: allowed,
          current: session.planId,
          upgradeUrl: "/pricing",
        },
        { status: 403 },
      ),
    };
  }
  return { ok: true as const, session };
}