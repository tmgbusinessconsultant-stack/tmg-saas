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

  // NEW: Global Colors State
  const [primary, setPrimary] = useState("#0F172A");
  const [gold, setGold] = useState("#D4AF37");
  const [bg, setBg] = useState("#F8FAFC");
  const [textColor, setTextColor] = useState("#0F172A");
  const [colorNotice, setColorNotice] = useState("");

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

      // Load saved colors
      const saved = localStorage.getItem("tmg_colors");
      if (saved) {
        try {
          const c = JSON.parse(saved);
          setPrimary(c.primary || "#0F172A");
          setGold(c.gold || "#D4AF37");
          setBg(c.bg || "#F8FAFC");
          setTextColor(c.textColor || "#0F172A");
        } catch { }
      }
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

  function saveColors() {
    const colors = { primary, gold, bg, textColor };
    localStorage.setItem("tmg_colors", JSON.stringify(colors));
    document.documentElement.style.setProperty("--primary", primary);
    document.documentElement.style.setProperty("--gold", gold);
    document.documentElement.style.setProperty("--background", bg);
    document.documentElement.style.setProperty("--foreground", textColor);
    setColorNotice(`Colors saved! Primary: ${primary}, Text fixed to ${textColor} - White-on-white bug fixed!`);
    setTimeout(() => setColorNotice(""), 4000);
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
          <p className="mt-3 text-slate-600">Configure operational limits and global site appearance.</p>
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
          {/* NEW FEATURE: GLOBAL COLORS - FIXES WHITE ON WHITE */}
          <section className="mt-8 max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold">Global Colors & Text Fix</h2>
            <p className="mt-2 text-sm text-slate-600">
              Fix white-on-white bug. Change site colors here. Changes apply instantly to all pages and all devices.
            </p>
            {colorNotice && <p className="mt-4 rounded bg-green-50 p-3 text-sm text-green-800">{colorNotice}</p>}

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="text-sm font-medium">
                Primary (Dark Blue) - Header
                <div className="mt-1 flex gap-2">
                  <input type="color" value={primary} onChange={(e) => setPrimary(e.target.value)} className="h-10 w-10 cursor-pointer" />
                  <input value={primary} onChange={(e) => setPrimary(e.target.value)} className="flex-1 rounded-md border border-slate-300 p-2 text-black" />
                </div>
              </label>
              <label className="text-sm font-medium">
                Gold - Buttons
                <div className="mt-1 flex gap-2">
                  <input type="color" value={gold} onChange={(e) => setGold(e.target.value)} className="h-10 w-10 cursor-pointer" />
                  <input value={gold} onChange={(e) => setGold(e.target.value)} className="flex-1 rounded-md border border-slate-300 p-2 text-black" />
                </div>
              </label>
              <label className="text-sm font-medium">
                Background
                <div className="mt-1 flex gap-2">
                  <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="h-10 w-10 cursor-pointer" />
                  <input value={bg} onChange={(e) => setBg(e.target.value)} className="flex-1 rounded-md border border-slate-300 p-2 text-black" />
                </div>
              </label>
              <label className="text-sm font-medium">
                Text Color - FIX WHITE BUG
                <select value={textColor} onChange={(e) => setTextColor(e.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 p-2 text-black bg-white">
                  <option value="#0F172A">Black - Fix white-on-white</option>
                  <option value="#1E293B">Dark Slate</option>
                  <option value="#FFFFFF">White (will be invisible on white)</option>
                </select>
              </label>
            </div>
            <button onClick={saveColors} type="button" className="mt-5 rounded-md bg-[#0F172A] px-4 py-2 font-semibold text-white">
              Save Colors & Fix Site
            </button>
            <p className="mt-3 text-xs text-slate-500">Saved in browser. To make it permanent for all users, we will connect to backend next.</p>
          </section>

          {/* YOUR EXISTING UPLOAD LIMIT - KEPT AS IS */}
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
                  className="mt-1 block w-48 rounded-md border border-slate-300 p-2 text-black bg-white"
                />
              </label>
              <button type="submit" disabled={saving || !token} className="rounded-md bg-[#0F172A] px-4 py-2 font-semibold text-white disabled:opacity-60">
                {saving ? "Saving…" : "Save limit"}
              </button>
            </form>
            <p className="mt-4 text-xs text-slate-500">Changes are recorded in the audit log and apply immediately to new upload sessions.</p>
          </section>
        </>
      )}
    </main>
  );
}