"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function SuccessContent() {
  const params = useSearchParams();
  const productId = params.get("productId");
  const token = params.get("token");
  return (
    <>
      <p className="mt-3 text-zinc-600">Product: {productId}</p>
      <p className="mt-1 text-xs text-zinc-400">Token: {token}</p>
    </>
  );
}

export default function ShopSuccess() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-20 text-center">
      <div className="mx-auto h-16 w-16 rounded-full bg-green-500 text-white grid place-items-center text-2xl">✓</div>
      <h1 className="mt-6 text-3xl font-black">Payment Successful</h1>
      <Suspense fallback={<p className="mt-3 text-zinc-500">Loading...</p>}>
        <SuccessContent />
      </Suspense>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/shop" className="rounded-full bg-zinc-900 px-6 py-2.5 text-white font-bold">Back to Shop</Link>
        <Link href="/dashboard" className="rounded-full border px-6 py-2.5 font-bold">Dashboard</Link>
      </div>
    </div>
  );
}
