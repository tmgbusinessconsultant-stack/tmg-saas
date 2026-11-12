"use client";
import Link from "next/link";

export default function SecureFind() {
    return (
        <div className="w-full bg-white text-black">
            <section className="text-white" style={{ background: "#0F172A" }}>
                <div className="mx-auto px-6 pt-32 pb-16 md:pt-36 md:pb-20 text-center" style={{ maxWidth: "900px" }}>
                    <span className="inline-block px-4 py-1.5 rounded-full text-[11px] font-black tracking-widest border border-white/30 bg-white/10 text-white">
                        TMG SECUREFIND • 100% LEGAL • OWNER ONLY
                    </span>
                    <h1 className="font-black leading-[0.95] tracking-tight text-[42px] md:text-[60px] mt-6 text-white">
                        Lost Your Phone?<br />
                        <span style={{ color: "#D4AF37" }}>Find YOUR Own Phone</span><br />in 5 Minutes.
                    </h1>
                    <p className="mt-6 text-[18px] leading-8 text-white font-semibold max-w-xl mx-auto" style={{ color: "#FFFFFF", textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}>
                        We guide you live on WhatsApp to find, lock or erase YOUR OWN iPhone or Samsung using YOUR OWN Apple ID / Google account. No hack. No password stealing. Official Apple & Google way.
                    </p>
                    <div className="mt-8 flex flex-wrap justify-center gap-4">
                        <Link href="/securefind/start" className="px-8 py-4 rounded-full font-black text-sm bg-[#D4AF37] text-black hover:opacity-90" style={{ color: "#000000", background: "#D4AF37" }}>
                            Recover My Phone - $29 →
                        </Link>
                        <a href="https://wa.me/97477000000?text=Hi%20TMG%20SecureFind,%20I%20lost%20my%20phone" target="_blank" className="px-8 py-4 rounded-full font-bold text-sm bg-white text-black" style={{ color: "#000000", background: "#FFFFFF" }}>
                            WhatsApp Us Now
                        </a>
                    </div>
                    <p className="mt-4 text-[12px] text-white uppercase tracking-widest font-bold" style={{ color: "#FFFFFF" }}>
                        Pay First • Proof Required • Refund If No Proof
                    </p>
                </div>
            </section>
            <section className="mx-auto px-6 py-14" style={{ maxWidth: "1000px" }}>
                <h2 className="text-3xl md:text-4xl font-black text-center text-black">How It Works - $29 One-Time</h2>
                <div className="mt-10 grid md:grid-cols-4 gap-4">
                    {[
                        { n: "1", t: "Pay $29", d: "Card, Apple Pay or WhatsApp + Bank Transfer." },
                        { n: "2", t: "Prove It's Yours", d: "Receipt / Box / iCloud screenshot. No proof = Full refund." },
                        { n: "3", t: "WhatsApp Live Session", d: "15-30 min. We guide you on icloud.com/find or google.com/android/find." },
                        { n: "4", t: "Done - PDF Report", d: "Phone found / locked / erased. You get PDF proof." },
                    ].map((s) => (
                        <div key={s.n} className="rounded-[20px] border p-6 bg-white">
                            <div className="h-10 w-10 rounded-full bg-black text-white grid place-items-center font-black">{s.n}</div>
                            <h3 className="mt-4 font-black text-black">{s.t}</h3>
                            <p className="mt-2 text-sm text-black font-medium leading-6">{s.d}</p>
                        </div>
                    ))}
                </div>
                <div className="mt-8 rounded-[24px] border p-8 text-center bg-white">
                    <h3 className="text-2xl font-black text-black">One-Time Recovery - $29</h3>
                    <p className="mt-2 text-black font-medium">1 phone, 1 time, live WhatsApp help until done.</p>
                    <Link href="/securefind/start" className="mt-6 inline-block px-10 py-4 rounded-full font-black text-sm bg-[#D4AF37] text-black">
                        Start Recovery - Pay $29 →
                    </Link>
                </div>
            </section>
        </div>
    );
}

