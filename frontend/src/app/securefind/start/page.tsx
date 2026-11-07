"use client";
import { useState } from "react";

export default function SecureFindStart() {
    const [form, setForm] = useState({
        name: "", contact: "", brand: "iPhone",
        lostNumber: "", imei: "", proof: "Receipt / Box / iCloud",
        consent: false,
    });
    const [done, setDone] = useState(false);

    const update = (k: string, v: string | boolean) => setForm({ ...form, [k]: v });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.consent) { alert("Please confirm it's YOUR phone."); return; }
        const msg = `SECUREFIND - NEW REQUEST\nName: ${form.name}\nContact: ${form.contact}\nPhone: ${form.brand}\nLost Number: ${form.lostNumber}\nIMEI/Serial: ${form.imei}\nProof: ${form.proof}\nI confirm this is MY OWN phone.`;
        window.open(`https://wa.me/97470454450?text=${encodeURIComponent(msg)}`, "_blank");
        setDone(true);
    };

    if (done) return (
        <div className="min-h-screen bg-[#0A1628] text-white flex items-center justify-center px-6 pt-28">
            <div className="max-w-lg text-center bg-white text-slate-900 rounded-2xl p-8">
                <h1 className="text-2xl font-black">Request Sent! ✅</h1>
                <p className="mt-3 text-slate-600">WhatsApp opened. Send the message to us.</p>
                <p className="mt-4 font-bold">Step 2: Pay $29 to start</p>
                <a href="https://paypal.me/tmgconsultant/29" target="_blank" className="mt-4 inline-block bg-[#FFC439] text-black font-bold px-6 py-3 rounded-full">Pay $29 with PayPal</a>
                <p className="mt-3 text-xs text-slate-500">After payment, send us screenshot on WhatsApp. We start within 15-30 mins.</p>
                <a href="/securefind" className="mt-4 inline-block text-sm underline">← Back</a>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0A1628] text-white px-6 pt-32 pb-16">
            <div className="max-w-lg mx-auto bg-white text-slate-900 rounded-2xl p-6 md:p-8">
                <h1 className="text-2xl font-black text-center">Start Recovery - $29</h1>
                <p className="text-center text-sm text-slate-500 mt-1">Proof required. We only help with YOUR OWN phone.</p>
                <form onSubmit={submit} className="mt-6 space-y-4">
                    <input required placeholder="Your Name" className="w-full border rounded-lg px-3 py-3" value={form.name} onChange={e => update("name", e.target.value)} />
                    <input required placeholder="Your WhatsApp Number (with country code)" className="w-full border rounded-lg px-3 py-3" value={form.contact} onChange={e => update("contact", e.target.value)} />
                    <select className="w-full border rounded-lg px-3 py-3" value={form.brand} onChange={e => update("brand", e.target.value)}>
                        <option>iPhone</option><option>Samsung</option><option>Huawei</option><option>Xiaomi / Redmi</option><option>Other Android</option>
                    </select>
                    <input required placeholder="Lost Phone Number" className="w-full border rounded-lg px-3 py-3" value={form.lostNumber} onChange={e => update("lostNumber", e.target.value)} />
                    <input placeholder="IMEI / Serial (if you have it - on box)" className="w-full border rounded-lg px-3 py-3" value={form.imei} onChange={e => update("imei", e.target.value)} />
                    <select className="w-full border rounded-lg px-3 py-3" value={form.proof} onChange={e => update("proof", e.target.value)}>
                        <option>Receipt / Box / iCloud</option><option>Google Account - I know password</option><option>Apple ID - I know password</option><option>Carrier / Ooredoo / Vodafone Bill</option>
                    </select>
                    <label className="flex gap-2 text-sm"><input type="checkbox" checked={form.consent} onChange={e => update("consent", e.target.checked)} /> I confirm this is MY OWN phone. I will NOT use this to track someone else.</label>
                    <button className="w-full bg-[#FFC439] text-black font-bold py-3 rounded-full">Send Request on WhatsApp →</button>
                    <p className="text-xs text-center text-slate-500">After this, you pay $29 on next screen. No pay = no start.</p>
                </form>
            </div>
        </div>
    );
}