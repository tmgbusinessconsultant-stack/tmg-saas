"use client";
import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";
import { apiRequest } from "@/lib/project-delivery";

type IntegrationStatus = {
  microsoft365: { state: string; drive: string; outlook: string };
  powerBi: { state: string };
  adobe: { state: string; message: string };
};

type DriveItem = {
  id: string;
  name: string;
  webUrl: string | null;
  size: number | null;
  lastModifiedDateTime: string | null;
  type: "file" | "folder";
};

type PowerBiReport = {
  id: string;
  name: string;
  webUrl: string | null;
  embedUrl: string | null;
  datasetId: string | null;
};

const microsoftApps = [
  ["Word", "https://www.office.com/launch/word"],
  ["Excel", "https://www.office.com/launch/excel"],
  ["PowerPoint", "https://www.office.com/launch/powerpoint"],
  ["Outlook", "https://outlook.office.com"],
  ["OneDrive", "https://www.office.com/launch/onedrive"],
  ["Teams", "https://teams.microsoft.com"],
  ["SharePoint", "https://www.office.com/launch/sharepoint"],
  ["Power BI", "https://app.powerbi.com"],
  ["Adobe Acrobat", "https://acrobat.adobe.com"],
];

function externalUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function configuredLabel(value: string): string {
  return value === "credentials-configured" || value === "configured"
    ? "Credentials configured"
    : "Not configured";
}

export default function AdminIntegrationsPage() {
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [driveItems, setDriveItems] = useState<DriveItem[] | null>(null);
  const [reports, setReports] = useState<PowerBiReport[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const accessToken = sessionStorage.getItem("accessToken");
      if (!accessToken) {
        setError("Sign in with an administrator account to use integrations.");
        setLoading(false);
        return;
      }
      setToken(accessToken);
      void apiRequest<IntegrationStatus>("/integrations/status", accessToken)
        .then(setStatus)
        .catch((loadError: unknown) => {
          setError(loadError instanceof Error ? loadError.message : "Could not load integration status.");
        })
        .finally(() => setLoading(false));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function loadDrive() {
    setBusy("drive");
    setError("");
    try {
      setDriveItems(await apiRequest<DriveItem[]>("/integrations/microsoft365/drive", token));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load OneDrive files.");
    } finally {
      setBusy("");
    }
  }

  async function loadReports() {
    setBusy("reports");
    setError("");
    try {
      setReports(await apiRequest<PowerBiReport[]>("/integrations/powerbi/reports", token));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load Power BI reports.");
    } finally {
      setBusy("");
    }
  }

  async function sendEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("email");
    setError("");
    setNotice("");
    const formData = new FormData(event.currentTarget);
    try {
      const result = await apiRequest<{ message: string }>("/integrations/microsoft365/email", token, {
        method: "POST",
        body: JSON.stringify({
          to: formData.get("to"),
          subject: formData.get("subject"),
          body: formData.get("body"),
        }),
      });
      event.currentTarget.reset();
      setNotice(result.message);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Email could not be sent.");
    } finally {
      setBusy("");
    }
  }

  if (loading) {
    return <main className="mx-auto max-w-7xl px-6 py-16" role="status">Loading integration status…</main>;
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8A6A00]">Administration</p>
          <h1 className="mt-2 text-4xl font-bold">Business integrations</h1>
          <p className="mt-3 max-w-3xl text-slate-600">
            Microsoft 365 and Power BI are accessed through server-side APIs. Configuration status confirms environment values only; it does not verify tenant permissions.
          </p>
        </div>
        <Link href="/admin" className="rounded-md border border-slate-300 px-4 py-2 font-semibold">Admin dashboard</Link>
      </header>

      {(error || notice) && (
        <p role={error ? "alert" : "status"} className={`mt-6 rounded-lg p-4 text-sm ${error ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"}`}>
          {error || notice}
        </p>
      )}

      {!token ? (
        <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
          <p>{error}</p>
          <Link href="/login" className="mt-4 inline-block font-semibold underline">Sign in</Link>
        </section>
      ) : (
        <>
          <section className="mt-8 grid gap-5 lg:grid-cols-3">
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold">Microsoft 365</h2>
              <p className="mt-2 text-sm text-slate-600">Graph app credentials: {configuredLabel(status?.microsoft365.state ?? "")}</p>
              <p className="mt-1 text-sm text-slate-600">OneDrive: {configuredLabel(status?.microsoft365.drive ?? "")}</p>
              <p className="mt-1 text-sm text-slate-600">Outlook: {configuredLabel(status?.microsoft365.outlook ?? "")}</p>
              <button type="button" disabled={busy !== ""} onClick={() => void loadDrive()} className="mt-4 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold disabled:opacity-60">
                {busy === "drive" ? "Loading…" : "Browse OneDrive root"}
              </button>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold">Power BI</h2>
              <p className="mt-2 text-sm text-slate-600">{configuredLabel(status?.powerBi.state ?? "")}</p>
              <p className="mt-1 text-sm text-slate-600">Lists reports from the configured workspace using the service principal.</p>
              <button type="button" disabled={busy !== ""} onClick={() => void loadReports()} className="mt-4 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold disabled:opacity-60">
                {busy === "reports" ? "Loading…" : "Load workspace reports"}
              </button>
            </article>
            <article className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <h2 className="text-xl font-bold">Adobe Acrobat</h2>
              <p className="mt-2 text-sm text-amber-950">{status?.adobe.message ?? "Adobe PDF Services operations are not implemented yet."}</p>
              <p className="mt-3 text-sm text-amber-950">Use Acrobat manually for PDF editing, merging, splitting, and signatures.</p>
            </article>
          </section>

          <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold">Open Microsoft 365 apps</h2>
            <nav aria-label="Microsoft and Adobe applications" className="mt-4 flex flex-wrap gap-3">
              {microsoftApps.map(([name, href]) => (
                <a key={name} href={href} target="_blank" rel="noopener noreferrer" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50">
                  Open {name}
                </a>
              ))}
            </nav>
          </section>

          {status?.microsoft365.outlook === "configured" && (
            <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold">Send an Outlook email</h2>
              <p className="mt-1 text-sm text-slate-600">Sends plain-text email from the configured mailbox. Each send request is recorded in the audit log.</p>
              <form className="mt-4 grid gap-4 md:max-w-2xl" onSubmit={(event) => void sendEmail(event)}>
                <label className="text-sm font-medium">
                  Recipient
                  <input name="to" required type="email" maxLength={254} className="mt-1 w-full rounded-md border border-slate-300 p-2" />
                </label>
                <label className="text-sm font-medium">
                  Subject
                  <input name="subject" required maxLength={200} className="mt-1 w-full rounded-md border border-slate-300 p-2" />
                </label>
                <label className="text-sm font-medium">
                  Message
                  <textarea name="body" required maxLength={10000} rows={5} className="mt-1 w-full rounded-md border border-slate-300 p-2" />
                </label>
                <button type="submit" disabled={busy !== ""} className="justify-self-start rounded-md bg-[#0F172A] px-4 py-2 font-semibold text-white disabled:opacity-60">
                  {busy === "email" ? "Sending…" : "Send email"}
                </button>
              </form>
            </section>
          )}

          {driveItems && (
            <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold">OneDrive root</h2>
              {driveItems.length === 0 ? <p className="mt-3 text-slate-600">No items found.</p> : (
                <ul className="mt-3 divide-y divide-slate-100">
                  {driveItems.map((item) => {
                    const url = externalUrl(item.webUrl);
                    return (
                      <li key={item.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm">
                        {url ? <a href={url} target="_blank" rel="noopener noreferrer" className="font-semibold underline">{item.name}</a> : <span className="font-semibold">{item.name}</span>}
                        <span className="text-slate-500">{item.type}{item.size === null ? "" : ` · ${(item.size / (1024 * 1024)).toFixed(2)} MB`}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          )}

          {reports && (
            <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold">Power BI workspace reports</h2>
              {reports.length === 0 ? <p className="mt-3 text-slate-600">No reports found in the configured workspace.</p> : (
                <ul className="mt-3 divide-y divide-slate-100">
                  {reports.map((report) => {
                    const url = externalUrl(report.webUrl);
                    return (
                      <li key={report.id} className="py-3 text-sm">
                        {url ? <a href={url} target="_blank" rel="noopener noreferrer" className="font-semibold underline">{report.name}</a> : <span className="font-semibold">{report.name}</span>}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          )}
        </>
      )}
    </main>
  );
}




