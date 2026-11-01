"use client";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

type PayPalApproval = { subscriptionID?: string | null; orderID?: string | null };

export default function PayPalSubscribe({ planId, onSuccess }: { planId: string; onSuccess?: (data: PayPalApproval) => void }) {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "sb";
  const currency = process.env.NEXT_PUBLIC_PAYPAL_CURRENCY || "USD";

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
          return actions.subscription.create({ plan_id: planId });
        }}
        onApprove={async (data) => {
          if (onSuccess) {
            await onSuccess({ subscriptionID: data.subscriptionID, orderID: data.orderID });
          }
        }}
      />
    </PayPalScriptProvider>
  );
}
