"use client";

import Script from "next/script";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { paymentPlans, type PaymentPlanId } from "@/lib/payment-plans";

interface PayPalButtonsInstance {
  render(container: HTMLElement): Promise<void>;
  close?(): Promise<void>;
}

interface PayPalNamespace {
  Buttons(options: {
    createOrder(): Promise<string>;
    onApprove(data: { orderID: string }): Promise<void>;
    onError(error: unknown): void;
  }): PayPalButtonsInstance;
}

declare global {
  interface Window {
    paypal?: PayPalNamespace;
  }
}

function PayPalPlanButton({
  planId,
  sdkReady,
}: {
  planId: PaymentPlanId;
  sdkReady: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!sdkReady || !container || !window.paypal) return;

    let active = true;
    let buttons: PayPalButtonsInstance;
    const reportLoadFailure = (error: unknown) => {
      window.setTimeout(() => {
        if (active) {
          setIsError(true);
          setMessage(error instanceof Error ? error.message : "PayPal buttons could not be loaded.");
        }
      }, 0);
    };
    try {
      buttons = window.paypal.Buttons({
        async createOrder() {
          setMessage("");
          setIsError(false);
          const response = await fetch("/api/paypal/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ planId }),
          });
          const result: unknown = await response.json();
          if (!response.ok || typeof result !== "object" || result === null || !("orderID" in result) || typeof result.orderID !== "string") {
            const errorMessage = typeof result === "object" && result !== null && "message" in result && typeof result.message === "string"
              ? result.message
              : "Could not start PayPal checkout.";
            throw new Error(errorMessage);
          }
          return result.orderID;
        },
        async onApprove(data) {
          const response = await fetch("/api/paypal/orders/capture", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderID: data.orderID, planId }),
          });
          const result: unknown = await response.json();
          if (!response.ok) {
            const errorMessage = typeof result === "object" && result !== null && "message" in result && typeof result.message === "string"
              ? result.message
              : "PayPal could not confirm your payment.";
            throw new Error(errorMessage);
          }

          if (active) {
            setIsError(false);
            setMessage(`Payment completed for the ${paymentPlans[planId].name} plan. Your order is ${data.orderID}.`);
          }
        },
        onError(error) {
          if (active) {
            setIsError(true);
            setMessage(error instanceof Error ? error.message : "PayPal checkout failed. Please try again.");
          }
        },
      });

      buttons.render(container).catch((error: unknown) => {
        reportLoadFailure(error);
      });
    } catch (error) {
      reportLoadFailure(error);
    }

    return () => {
      active = false;
      if (buttons) void buttons.close?.();
    };
  }, [planId, sdkReady]);

  return (
    <div className="mt-8">
      <div ref={containerRef} />
      {message && (
        <p role={isError ? "alert" : "status"} className={`mt-3 text-sm ${isError ? "text-red-700" : "text-green-700"}`}>
          {message}
        </p>
      )}
    </div>
  );
}

export default function PricingCheckout() {
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState("");
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const plans = Object.values(paymentPlans);
  const scriptUrl = clientId
    ? `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=USD&intent=capture&components=buttons`
    : "";

  return (
    <>
      {clientId && (
        <Script
          id="paypal-checkout-sdk"
          src={scriptUrl}
          strategy="afterInteractive"
          onReady={() => setSdkReady(true)}
          onError={() => setSdkError("PayPal checkout could not load. Check the PayPal client ID and try again.")}
        />
      )}

      {!clientId && (
        <p role="alert" className="mt-8 text-center text-sm text-red-700">
          PayPal checkout is not configured. Set NEXT_PUBLIC_PAYPAL_CLIENT_ID in the frontend environment.
        </p>
      )}
      {sdkError && <p role="alert" className="mt-8 text-center text-sm text-red-700">{sdkError}</p>}

      <div className="mt-12 grid md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div key={plan.id} className={`rounded-2xl border p-8 ${plan.highlight ? "border-[#D4AF37] bg-[#FFF9E5] shadow-lg md:scale-105" : "border-slate-200 bg-white"}`}>
            {plan.highlight && <span className="bg-[#D4AF37] text-black text-xs px-2 py-1 rounded font-semibold">MOST POPULAR</span>}
            <h2 className="text-2xl font-bold mt-2">{plan.name}</h2>
            <div className="mt-4 text-4xl font-bold text-[#0F172A]">{plan.displayPrice}</div>
            <p className="mt-4 text-slate-600">{plan.description}</p>
            <ul className="mt-6 space-y-3 text-slate-700">
              {plan.features.map((feature) => (
                <li key={feature} className="flex gap-2"><span className="text-[#D4AF37] font-bold">✓</span> {feature}</li>
              ))}
            </ul>
            {clientId && !sdkError && (
              <PayPalPlanButton planId={plan.id} sdkReady={sdkReady} />
            )}
          </div>
        ))}
      </div>
      <p className="mt-12 text-center text-xs text-slate-500">
        One-time payments in USD. Prices are converted from the listed QAR packages at QAR 3.64 per USD. PayPal Sandbox is for testing only; use sandbox buyer credentials to test checkout.
      </p>
      <p className="mt-3 text-center text-xs leading-5 text-slate-500">
        Checkout is processed by PayPal. By continuing, you acknowledge our <Link href="/privacy" className="underline">Privacy Notice</Link> and agree to our <Link href="/terms" className="underline">Terms</Link>. Confirm any delivery or refund details not shown with us before purchasing.
      </p>
    </>
  );
}
