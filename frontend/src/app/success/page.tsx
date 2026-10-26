"use client";
import { useSearchParams } from "next/navigation";
export default function SuccessPage() {
  const params = useSearchParams();
  const sub = params.get("sub");
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FCFCF9]">
      <div className="bg-white p-10 rounded-2xl shadow text-center max-w-md">
        <h1 className="text-3xl font-bold">✅ Subscribed!</h1>
        <p className="mt-3 text-zinc-600">ID: {sub}</p>
        <p className="mt-2 text-sm">Your plan is now active. Check email for PayPal receipt.</p>
        <a href="/ai-tools" className="mt-6 inline-block bg-zinc-900 text-white px-6 py-3 rounded-full">Go to AI Tools</a>
      </div>
    </div>
  );
}