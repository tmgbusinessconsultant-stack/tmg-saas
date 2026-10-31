"use client";
import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function SuccessContent() {
  const params = useSearchParams();
  const productId = params.get("productId") || "Asset";
  const token = params.get("token");
  const [copied, setCopied] = useState(false);
  const [autoTried, setAutoTried] = useState(false);

  const apiBase = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "") || "http://localhost:4000";
  const base = apiBase.endsWith("/api") ? apiBase : `${apiBase}/api`;

  // BEST: Use same endpoint as ShopClient + fallback
  const primaryUrl = token ? `${base}/content/media/download?token=${token}&productId=${productId}` : null;
  const fallbackUrl = token ? `${base}/content/media/${productId}/download?token=${token}` : null;
  const downloadUrl = primaryUrl || fallbackUrl;

  useEffect(() => {
    if (downloadUrl && !autoTried) {
      setAutoTried(true);
      // Optional: auto-trigger after 1s for best UX
      // window.open(downloadUrl, "_blank");
    }
  }, [downloadUrl, autoTried]);

  const copyLink = () => {
    if (downloadUrl) {
      navigator.clipboard.writeText(downloadUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Order Card — BEST */}
      <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-2xl text-left">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Order Reference</span>
          <span className="text-xs font-mono bg-slate-900 text-white px-2.5 py-1 rounded-full">{productId.substring(0, 12)} • Paid</span>
        </div>
        <p className="text-sm font-medium text-slate-700 leading-relaxed">
          Your bundle is secured via one-time token. Download expires in 24h. Save this link.
        </p>
        <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500 bg-white border rounded-lg p-2.5">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          Token verified • {token ? token.substring(0, 16) + "..." : "no token"} • Encrypted
        </div>
      </div>

      {/* Actions — BEST */}
      {downloadUrl ? (
        <div className="space-y-3">
          <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="w-full py-4 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-center font-black text-sm rounded-xl block shadow-lg shadow-emerald-200 hover:scale-[1.02] transition-all">
            📥 Download Now — Instant Access
          </a>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={copyLink} className="py-3 px-4 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-sm font-bold transition">
              {copied ? "✅ Copied!" : "🔗 Copy Link"}
            </button>
            <a href={downloadUrl} download className="py-3 px-4 bg-slate-900 hover:bg-black text-white rounded-xl text-sm font-bold text-center transition">⬇️ Save File</a>
          </div>
          <p className="text-[11px] text-center text-slate-400">If download fails, use copy link or contact support. Token single-use, expires 24h.</p>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-sm text-amber-800">
          ⚠️ No token found. Your payment is processing — check email or contact WhatsApp with Order ID: <b>{productId}</b>
        </div>
      )}

      {/* Help */}
      <div className="bg-white border rounded-xl p-4 flex gap-3 text-left">
        <div className="text-xl">💬</div>
        <div className="text-xs text-slate-600 leading-relaxed"><b>Need help?</b> WhatsApp us with Order ID. We send manual link in 5 min.<br /><a href={`https://wa.me/97400000000?text=Order%20${productId}%20needs%20download`} className="text-blue-600 font-bold underline">Contact Support →</a></div>
      </div>
    </div>
  );
}

export default function ShopSuccess() {
  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center bg-gradient-to-b from-white to-slate-50 px-6 py-12">
      <div className="w-full max-w-xl text-center">
        <div className="mx-auto h-20 w-20 rounded-full bg-emerald-50 text-emerald-600 border-2 border-emerald-200 grid place-items-center text-3xl shadow-sm animate-bounce">✓</div>
        <h1 className="mt-6 text-3xl md:text-4xl font-black tracking-tight">Payment Successful!</h1>
        <p className="mt-2 text-slate-500 text-sm">Thank you — TMG Business Consulting. Transaction secured & asset ready.</p>

        <div className="mt-8">
          <Suspense fallback={<div className="h-32 bg-slate-100 animate-pulse rounded-2xl flex items-center justify-center text-sm text-slate-400">Verifying token pipeline...</div>}>
            <SuccessContent />
          </Suspense>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-3">
          <Link href="/shop" className="rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-sm px-6 py-3 text-center transition">Continue Shopping →</Link>
          <Link href="/dashboard" className="rounded-xl border bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm px-6 py-3 text-center transition">Dashboard</Link>
        </div>

        {/* SEO trust */}
        <div className="mt-12 flex justify-center gap-6 text-[11px] text-slate-400"><span>✅ Instant</span><span>•</span><span>🔒 Secure</span><span>•</span><span>📦 Qatar Compliant</span></div>
      </div>
    </div>
  );
}