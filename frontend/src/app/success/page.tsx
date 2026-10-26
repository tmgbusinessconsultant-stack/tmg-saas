"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
export const dynamic = "force-dynamic";
function SuccessContent() {
  const searchParams = useSearchParams();
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  useEffect(() => {
    const subId = searchParams.get("subscription_id") || searchParams.get("subscriptionId");
    if (subId) setSubscriptionId(subId);
    if (subId) localStorage.setItem("paypal_sub_id", subId);
  }, [searchParams]);
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold text-green-600 mb-4">Payment Successful!</h1>
      <p className="text-lg mb-2">Thank you for subscribing to TMG!</p>
      {subscriptionId && <p className="text-sm text-gray-500 mt-2 break-all">Subscription ID: {subscriptionId}</p>}
      <a href="/dashboard" className="mt-8 px-6 py-3 bg-black text-white rounded-lg">Go to Dashboard</a>
    </div>
  );
}
export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
