"use client";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useRouter } from "next/navigation";

type PayPalApproval = { subscriptionID?: string | null; orderID?: string | null };

export default function PayPalSubscribe({ planId, onSuccess }: { planId: string; onSuccess?: (data: PayPalApproval) => void }) {
  const router = useRouter();
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const currency = process.env.NEXT_PUBLIC_PAYPAL_CURRENCY || "USD";
  const configuredApiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").trim().replace(/\/+$/, "");
  const apiUrl = configuredApiUrl.endsWith("/api") ? configuredApiUrl : `${configuredApiUrl}/api`;

  if (!clientId || !planId) {
    return <p role="status" className="text-sm text-red-600">PayPal is not configured for this plan.</p>;
  }

  return (
    <PayPalScriptProvider options={{
      clientId,
      vault: true,
      intent: "subscription",
      components: "buttons",
      currency
    }}>
      <PayPalButtons
        style={{ layout: "vertical" }}
        createSubscription={(data, actions) => {
          const token = sessionStorage.getItem("accessToken") || localStorage.getItem("accessToken") || localStorage.getItem("token");
          if (!token) {
            router.push("/login");
            throw new Error("Sign in before starting a PayPal subscription.");
          }
          const encodedPayload = token.split(".")[1];
          if (!encodedPayload) throw new Error("Your session is invalid. Sign in again.");
          const normalizedPayload = encodedPayload.replace(/-/g, "+").replace(/_/g, "/");
          const userId = (JSON.parse(atob(normalizedPayload)) as { sub?: unknown }).sub;
          if (typeof userId !== "string") throw new Error("Your session is invalid. Sign in again.");
          return actions.subscription.create({ plan_id: planId, custom_id: userId });
        }}
        onApprove={async (data) => {
          const token = sessionStorage.getItem("accessToken") || localStorage.getItem("accessToken") || localStorage.getItem("token");
          if (!token || !data.subscriptionID) {
            router.push("/login");
            return;
          }
          const response = await fetch(`${apiUrl}/paypal/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ subscriptionID: data.subscriptionID }),
          });
          if (!response.ok) throw new Error("PayPal subscription verification failed.");
          await onSuccess?.({ subscriptionID: data.subscriptionID, orderID: data.orderID });
        }}
      />
    </PayPalScriptProvider>
  );
}
