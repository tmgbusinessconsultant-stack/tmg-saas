"use client";
import Link from "next/link";

const ADMIN_EMAIL = "info@tmgbusinessconsulting.com";

type StatusKind = "NOT_CONNECTED" | "LINK_ONLY" | "MANUAL" | "NOT_CONFIGURED";

function StatusBadge({ kind, label }: { kind: StatusKind; label: string }) {
  const styles: Record<StatusKind, string> = {
    NOT_CONNECTED: "border-red-200 bg-red-50 text-red-700",
    NOT_CONFIGURED: "border-amber-200 bg-amber-50 text-amber-800",
    LINK_ONLY: "border-slate-200 bg-slate-100 text-slate-700",
    MANUAL: "border-slate-200 bg-slate-100 text-slate-700",
  };
  const dot: Record<StatusKind, string> = {
    NOT_CONNECTED: "bg-red-500",
    NOT_CONFIGURED: "bg-amber-500",
    LINK_ONLY: "bg-slate-400",
    MANUAL: "bg-slate-400",
  };
  return (
    <p className={`mt-1 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${styles[kind]}`}>
      <span className={`h-2 w-2 rounded-full ${dot[kind]}`} />
      {label}
    </p>
  );
}

export default function AdminIntegrationsPage() {
  const cards: Array<{ name: string; kind: StatusKind; status: string; note: string; href?: string; hrefLabel?: string }> = [
    {
      name: "Email (admin inbox)",
      kind: "NOT_CONFIGURED",
      status: "NOT CONFIGURED - SMTP NOT VERIFIED",
      note: `Admin notification inbox: ${ADMIN_EMAIL}. The app is supposed to send notifications via SMTP (Resend/SMTP env on server), but SMTP has NOT been verified in this environment. It does NOT read Gmail automatically and does NOT claim Microsoft Graph is connected. Verify SMTP in Step 2 before claiming it works.`,
      href: `mailto:${ADMIN_EMAIL}`,
      hrefLabel: "Email Admin ->",
    },
    {
      name: "TikTok",
      kind: "NOT_CONNECTED",
      status: "NOT CONNECTED - LINK ONLY",
      note: "No API connection. Clients can submit TikTok video links in Upload Hub; links are stored and shown in the project. Example profile: https://www.tiktok.com/@tmgbusinessconsultant",
      href: "https://www.tiktok.com/@tmgbusinessconsultant",
      hrefLabel: "Visit Profile ->",
    },
    {
      name: "YouTube",
      kind: "NOT_CONNECTED",
      status: "NOT CONNECTED - LINK ONLY",
      note: "No API connection. Clients can submit YouTube links in Upload Hub; links are stored and shown in the project (embedded). No video storage/upload.",
      href: "https://www.youtube.com",
      hrefLabel: "Visit YouTube ->",
    },
    {
      name: "Adobe (Acrobat/Creative tools)",
      kind: "MANUAL",
      status: "MANUAL WORKFLOW - NO API",
      note: "No API connection. Manual flow: admin downloads the client file from the project (CLEAN only), edits in Adobe on their own computer, then uploads the edited version back as a Deliverable. Project flow: Original -> Edited -> Delivered.",
      href: "https://acrobat.adobe.com",
      hrefLabel: "Open Adobe ->",
    },
    {
      name: "Outlook / Microsoft 365",
      kind: "NOT_CONNECTED",
      status: "NOT CONNECTED",
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
            Honest status only - no fake &quot;connected&quot; claims. SMTP email notifications are server-configured (env) but NOT verified. TikTok/YouTube/Adobe are link/manual workflows unless real credentials and code are added.
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
                <StatusBadge kind={c.kind} label={c.status} />
              </div>
              {c.href && <a href={c.href} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-[#0F172A] underline underline-offset-4">{c.hrefLabel || "Visit ->"}</a>}
            </div>
            <p className="mt-3 text-sm text-slate-600">{c.note}</p>
          </article>
        ))}
      </div>

      <section className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950">
        <p className="font-semibold">Configuration (server env) - NOT VERIFIED</p>
        <ul className="mt-2 list-disc pl-5 space-y-1">
          <li><code>ADMIN_NOTIFICATION_EMAIL=&quot;info@tmgbusinessconsulting.com&quot;</code></li>
          <li><code>SMTP_HOST</code>, <code>SMTP_PORT</code>, <code>SMTP_SECURE</code>, <code>SMTP_USER</code>, <code>SMTP_PASS</code>, <code>MAIL_FROM</code> (e.g. Resend SMTP) - used to send upload/verification/reset notifications.</li>
          <li>No Microsoft Graph / OneDrive / Outlook / Power BI / Adobe API credentials are required or claimed connected here.</li>
          <li>Do NOT mark Email as Connected until a test email is successfully sent from the backend.</li>
        </ul>
      </section>
    </main>
  );
}
