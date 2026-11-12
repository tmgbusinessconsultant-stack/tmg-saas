"use client";
import { useState, useEffect } from "react";
export default function SecureFindStart() {
    const [form, setForm] = useState({ name: "", contact: "", brand: "iPhone", lostNumber: "", imei: "", proof: "Receipt / Box / iCloud", consent: false });
    const [paying, setPaying] = useState(false);
    const [cancelled, setCancelled] = useState(false);
    useEffect(() => { const t = setTimeout(() => { if (window.location.search.includes('cancelled=true')) setCancelled(true); }, 0); return () => clearTimeout(t); }, []);
    const update = (k: string, v: string | boolean) => setForm({ ...form, [k]: v });
    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.consent) { alert("Please confirm it's YOUR phone."); return; }
        try {
            setPaying(true);
            const apiBase = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "") || "http://localhost:4000";
            const base = apiBase.replace(/\/api$/i, "") + "/api";
            const res = await fetch(`${base}/payments/securefind/orders`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
            if (!res.ok) throw new Error("Order failed");
            const order = await res.json();
            if (order.approveUrl) {
                sessionStorage.setItem("tmg_securefind_order", JSON.stringify({ dbId: order.id, paypalOrderId: order.paypalOrderId }));
                window.location.href = order.approveUrl;
                return;
            }
            throw new Error("No approveUrl");
        } catch {
            const msg = `SECUREFIND - NEW REQUEST\nName: ${form.name}\nContact: ${form.contact}\nPhone: ${form.brand}\nLost Number: ${form.lostNumber}\nIMEI/Serial: ${form.imei}\nProof: ${form.proof}\nI confirm this is MY OWN phone.`;
            window.open(`https://wa.me/97470454450?text=${encodeURIComponent(msg)}`, "_blank");
        } finally { setPaying(false); }
    };
    return (
        <div className="min-h-screen bg-[#0A1628] text-white px-6 pt-32 pb-16">
            <div className="max-w-lg mx-auto bg-white text-slate-900 rounded-2xl p-6 md:p-8">
                <h1 className="text-2xl font-black text-center">Start Recovery - $29</h1>
                {cancelled && (<div className="mt-4 bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-sm text-center font-bold">Payment cancelled - No money was taken. You can try again.</div>)}
                <p className="text-center text-sm text-slate-500 mt-1">Proof required. We only help with YOUR OWN phone.</p>
                <form onSubmit={submit} className="mt-6 space-y-4">
                    <input required placeholder="Your Name" className="w-full border rounded-lg px-3 py-3" value={form.name} onChange={e => update("name", e.target.value)} />
                    <input required placeholder="Your WhatsApp Number (with country code)" className="w-full border rounded-lg px-3 py-3" value={form.contact} onChange={e => update("contact", e.target.value)} />
                    <select className="w-full border rounded-lg px-3 py-3" value={form.brand} onChange={e => update("brand", e.target.value)}><option>iPhone</option><option>Samsung</option><option>Huawei</option><option>Xiaomi / Redmi</option><option>Other Android</option></select>
                    <input required placeholder="Lost Phone Number" className="w-full border rounded-lg px-3 py-3" value={form.lostNumber} onChange={e => update("lostNumber", e.target.value)} />
                    <input placeholder="IMEI / Serial (if you have it - on box)" className="w-full border rounded-lg px-3 py-3" value={form.imei} onChange={e => update("imei", e.target.value)} />
                    <select className="w-full border rounded-lg px-3 py-3" value={form.proof} onChange={e => update("proof", e.target.value)}><option>Receipt / Box / iCloud</option><option>Google Account - I know password</option><option>Apple ID - I know password</option><option>Carrier / Ooredoo / Vodafone Bill</option></select>
                    <label className="flex gap-2 text-sm"><input type="checkbox" checked={form.consent} onChange={e => update("consent", e.target.checked)} /> I confirm this is MY OWN phone. I will NOT use this to track someone else.</label>
                    <button disabled={paying} className="w-full bg-[#FFC439] text-black font-bold py-3 rounded-full disabled:opacity-50">{paying ? "Creating secure payment..." : "Pay $29 & Start Recovery →"}</button>
                    <p className="text-xs text-center text-slate-500">You pay on PayPal next. No pay = no start.</p>
                </form>
            </div>
        </div>
    );
}

