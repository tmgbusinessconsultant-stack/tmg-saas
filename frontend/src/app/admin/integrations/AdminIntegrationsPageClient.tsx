"use client";
import Link from "next/link";

const ADMIN_EMAIL = "info@tmgbusinessconsulting.com";

export default function AdminIntegrationsPage() {
  const cards: Array<{ name: string; status: string; note: string; href?: string }> = [
    {
      name: "Email (admin inbox)",
      status: "Email notification via SMTP",
      note: `Admin notification inbox: ${ADMIN_EMAIL} (forwarding configured separately). The app sends notifications to this address via SMTP (Resend/SMTP env on server). It does NOT read Gmail automatically and does NOT claim Microsoft Graph is connected.`,
      href: `mailto:${ADMIN_EMAIL}`,
    },
    {
      name: "TikTok",
      status: "Link only",
      note: "No API connection. Clients can submit TikTok video links in Upload Hub; links are stored and shown in the project. Example profile: https://www.tiktok.com/@tmgbusinessconsultant",
      href: "https://www.tiktok.com/@tmgbusinessconsultant",
    },
    {
      name: "YouTube",
      status: "Link only",
      note: "No API connection. Clients can submit YouTube links in Upload Hub; links are stored and shown in the project (embedded). No video storage/upload.",
      href: "https://www.youtube.com",
    },
    {
      name: "Adobe (Acrobat/Creative tools)",
      status: "Link only / manual workflow",
      note: "No API connection. Manual flow: admin downloads the client file from the project (CLEAN only), edits in Adobe on their own computer, then uploads the edited version back as a Deliverable. Project flow: Original → Edited → Delivered.",
      href: "https://acrobat.adobe.com",
    },
    {
      name: "Outlook / Microsoft 365",
      status: "Not connected",
      note: "No Microsoft Graph credentials are connected by this page. Do not assume Outlook/Graph integration. Use SMTP email notifications and manual email handling.",
    },
  ];

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8A6A00]">Administration</p>
          <h1 className="mt-2 text-4xl font-bold">Integrations</h1>
          <p className="mt-3 max-w-3xl text-slate-600">
            Honest status only — no fake &quot;connected&quot; claims. SMTP email notifications are server-configured (env). TikTok/YouTube/Adobe are link/manual workflows unless real credentials and code are added.
          </p>
        </div>
        <Link href="/admin" className="rounded-md border border-slate-300 px-4 py-2 font-semibold">Admin dashboard</Link>
      </header>

      <div className="mt-8 grid gap-5">
        {cards.map((c) => (
          <article key={c.name} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">{c.name}</h2>
                <p className="mt-1 inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
                  {c.status}
                </p>
              </div>
              {c.href && <a href={c.href} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold underline">Open</a>}
            </div>
            <p className="mt-3 text-sm text-slate-600">{c.note}</p>
          </article>
        ))}
      </div>

      <section className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950">
        <p className="font-semibold">Configuration (server env)</p>
        <ul className="mt-2 list-disc pl-5 space-y-1">
          <li><code>ADMIN_NOTIFICATION_EMAIL=&quot;info@tmgbusinessconsulting.com&quot;</code></li>
          <li><code>SMTP_HOST</code>, <code>SMTP_PORT</code>, <code>SMTP_SECURE</code>, <code>SMTP_USER</code>, <code>SMTP_PASS</code>, <code>MAIL_FROM</code> (e.g. Resend SMTP) — used to send upload/verification/reset notifications.</li>
          <li>No Microsoft Graph / OneDrive / Outlook / Power BI / Adobe API credentials are required or claimed connected here.</li>
        </ul>
      </section>
    </main>
  );
}
