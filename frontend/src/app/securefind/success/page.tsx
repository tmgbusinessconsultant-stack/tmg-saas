"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
function SuccessInner() {
    const params = useSearchParams();
    const [state, setState] = useState<"loading"|"done"|"error">("loading");
    const [req, setReq] = useState<{ name?: string; brand?: string; lostNumber?: string } | null>(null);
    useEffect(() => {
        const run = async () => {
            const token = params.get("token");
            const stored = JSON.parse(sessionStorage.getItem("tmg_securefind_order") || "{}");
            const orderId = token || stored.paypalOrderId;
            if (!orderId) { setState("error"); return; }
            try {
                const apiBase = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "") || "http://localhost:4000";
                const base = apiBase.replace(/\/api$/i, "") + "/api";
                const res = await fetch(`${base}/payments/securefind/capture`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId }) });
                if (!res.ok) throw new Error("capture failed");
                const data = await res.json();
                setReq(data.request); setState("done");
            } catch { setState("error"); }
        };
        run();
    }, [params]);
    if (state === "loading") return <div className="min-h-screen flex items-center justify-center">Verifying payment with PayPal...</div>;
    if (state === "error") return <div className="min-h-screen flex items-center justify-center px-6 text-center"><div><h1 className="text-2xl font-black">Payment not confirmed</h1><p className="mt-2 text-slate-500">Send your PayPal receipt on WhatsApp: 974 7045 4450</p></div></div>;
    return (
        <div className="min-h-screen bg-[#0A1628] text-white flex items-center justify-center px-6 pt-28">
            <div className="max-w-lg text-center bg-white text-slate-900 rounded-2xl p-8">
                <h1 className="text-2xl font-black">Payment Confirmed! ✅</h1>
                <p className="mt-3 text-slate-600">We received $29. We start within 15-30 mins.</p>
                {req && <p className="mt-4 text-sm">Request for: <b>{req.name}</b> • {req.brand} • {req.lostNumber}</p>}
                <a href={`https://wa.me/97470454450?text=${encodeURIComponent("Hi TMG, I just paid $29 for SecureFind. Please start.")}`} target="_blank" className="mt-6 inline-block bg-green-500 text-white font-bold px-6 py-3 rounded-full">Message us on WhatsApp →</a>
            </div>
        </div>
    );
}
export default function SecureFindSuccess() { return <Suspense><SuccessInner /></Suspense>; }
