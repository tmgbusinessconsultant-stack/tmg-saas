"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";
import { apiRequest } from "@/lib/project-delivery";

export default function AdminSettingsPage() {
  const [token, setToken] = useState("");
  const [maximumMegabytes, setMaximumMegabytes] = useState("100");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const accessToken = sessionStorage.getItem("accessToken");
      if (!accessToken) {
        setError("Sign in with an administrator account to change system settings.");
        setLoading(false);
        return;
      }
      setToken(accessToken);
      void apiRequest<{ maximumMegabytes: number }>("/settings/project-upload-limit", accessToken)
        .then((settings) => setMaximumMegabytes(String(settings.maximumMegabytes)))
        .catch((loadError: unknown) => {
          setError(loadError instanceof Error ? loadError.message : "Could not load system settings.");
        })
        .finally(() => setLoading(false));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const result = await apiRequest<{ maximumMegabytes: number }>("/settings/project-upload-limit", token, {
        method: "PATCH",
        body: JSON.stringify({ maximumMegabytes: Number(maximumMegabytes) }),
      });
      setMaximumMegabytes(String(result.maximumMegabytes));
      setNotice("Project upload limit saved. The new limit applies to subsequent uploads.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save system settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <main className="mx-auto max-w-7xl px-6 py-16" role="status">Loading system settings…</main>;
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8A6A00]">Administration</p>
          <h1 className="mt-2 text-4xl font-bold">System settings</h1>
          <p className="mt-3 text-slate-600">Configure operational limits for client projects.</p>
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
        <section className="mt-8 max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">Client project upload limit</h2>
          <p className="mt-2 text-sm text-slate-600">
            Allowed file extensions are DOC, DOCX, PDF, XLS, XLSX, CSV, PPTX, TXT, JSON, XML, ZIP, PNG, JPG, JPEG, and WEBP.
            The limit applies to each uploaded file and can be set from 1 MB to 2048 MB.
          </p>
          <form className="mt-5 flex flex-wrap items-end gap-3" onSubmit={(event) => void saveSettings(event)}>
            <label className="text-sm font-medium">
              Maximum file size (MB)
              <input
                type="number"
                name="maximumMegabytes"
                required
                min={1}
                max={2048}
                step={1}
                value={maximumMegabytes}
                onChange={(event) => setMaximumMegabytes(event.target.value)}
                className="mt-1 block w-48 rounded-md border border-slate-300 p-2"
              />
            </label>
            <button type="submit" disabled={saving || !token} className="rounded-md bg-[#0F172A] px-4 py-2 font-semibold text-white disabled:opacity-60">
              {saving ? "Saving…" : "Save limit"}
            </button>
          </form>
          <p className="mt-4 text-xs text-slate-500">Changes are recorded in the audit log and apply immediately to new upload sessions.</p>
        </section>
      )}
    </main>
  );
}
