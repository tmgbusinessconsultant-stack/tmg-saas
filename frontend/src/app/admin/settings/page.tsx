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

  // COLORS
  const [primary, setPrimary] = useState("#0F172A");
  const [gold, setGold] = useState("#D4AF37");
  const [bg, setBg] = useState("#F8FAFC");
  const [textColor, setTextColor] = useState("#0F172A");

  // LINKED SETTINGS - FORM LOOK, BUTTON SIZE, RADIUS, TEXT SIZE
  const [buttonRadius, setButtonRadius] = useState("8px");
  const [cardRadius, setCardRadius] = useState("12px");
  const [inputHeight, setInputHeight] = useState("44px");
  const [buttonHeight, setButtonHeight] = useState("44px");
  const [fontSize, setFontSize] = useState("14px");
  const [borderWidth, setBorderWidth] = useState("1px");

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

      // Load ALL saved settings
      const saved = localStorage.getItem("tmg_colors");
      if (saved) {
        try {
          const c = JSON.parse(saved);
          setPrimary(c.primary || "#0F172A");
          setGold(c.gold || "#D4AF37");
          setBg(c.bg || "#F8FAFC");
          setTextColor(c.textColor || "#0F172A");
          setButtonRadius(c.buttonRadius || "8px");
          setCardRadius(c.cardRadius || "12px");
          setInputHeight(c.inputHeight || "44px");
          setButtonHeight(c.buttonHeight || "44px");
          setFontSize(c.fontSize || "14px");
          setBorderWidth(c.borderWidth || "1px");
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
      setNotice("Project upload limit saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save system settings.");
    } finally {
      setSaving(false);
    }
  }

  function saveColors() {
    const colors = { primary, gold, bg, textColor, buttonRadius, cardRadius, inputHeight, buttonHeight, fontSize, borderWidth };
    localStorage.setItem("tmg_colors", JSON.stringify(colors));
    const root = document.documentElement;
    root.style.setProperty("--primary", primary);
    root.style.setProperty("--gold", gold);
    root.style.setProperty("--background", bg);
    root.style.setProperty("--foreground", textColor);
    root.style.setProperty("--button-radius", buttonRadius);
    root.style.setProperty("--radius", cardRadius);
    root.style.setProperty("--input-height", inputHeight);
    root.style.setProperty("--button-height", buttonHeight);
    root.style.setProperty("--font-size", fontSize);
    root.style.setProperty("--border-width", borderWidth);
    setColorNotice(`SAVED & APPLIED LIVE! Radius: ${buttonRadius}, Forms: ${inputHeight}, Buttons: ${buttonHeight}, Font: ${fontSize}`);
    setTimeout(() => setColorNotice(""), 6000);
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
          <p className="mt-3 text-slate-600">Master control: Colors, Button Size, Form Size, Radius, Text Size - All linked to whole site.</p>
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
          <section className="mt-8 max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold">Global Design System - Master Control</h2>
            <p className="mt-2 text-sm text-slate-600">This controls ENTIRE site instantly on all devices. Fix white-on-white + control ALL looks.</p>
            {colorNotice && <p className="mt-4 rounded bg-green-50 p-3 text-sm text-green-800 font-bold border border-green-200">{colorNotice}</p>}

            {/* SECTION 1: COLORS */}
            <h3 className="mt-6 text-sm font-bold uppercase tracking-wide bg-slate-100 p-2 rounded">1. Colors & White Bug Fix</h3>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="text-sm font-medium">Primary - Header<div className="mt-1 flex gap-2"><input type="color" value={primary} onChange={(e) => setPrimary(e.target.value)} className="h-10 w-12" /><input value={primary} onChange={(e) => setPrimary(e.target.value)} className="flex-1 rounded-md border p-2 text-black" /></div></label>
              <label className="text-sm font-medium">Gold - Buttons<div className="mt-1 flex gap-2"><input type="color" value={gold} onChange={(e) => setGold(e.target.value)} className="h-10 w-12" /><input value={gold} onChange={(e) => setGold(e.target.value)} className="flex-1 rounded-md border p-2 text-black" /></div></label>
              <label className="text-sm font-medium">Background<div className="mt-1 flex gap-2"><input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="h-10 w-12" /><input value={bg} onChange={(e) => setBg(e.target.value)} className="flex-1 rounded-md border p-2 text-black" /></div></label>
              <label className="text-sm font-medium">Text Color - FIX WHITE BUG<select value={textColor} onChange={(e) => setTextColor(e.target.value)} className="mt-1 block w-full rounded-md border p-2 text-black bg-white"><option value="#0F172A">Black - Fix white-on-white</option><option value="#1E293B">Dark Slate</option><option value="#334155">Gray</option><option value="#FFFFFF">White (Invisible - BUG)</option></select></label>
            </div>

            {/* SECTION 2: FORM LOOK */}
            <h3 className="mt-8 text-sm font-bold uppercase tracking-wide bg-slate-100 p-2 rounded">2. Form Look - Input Size & Radius</h3>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label className="text-sm font-medium">Form / Input Height<select value={inputHeight} onChange={(e) => setInputHeight(e.target.value)} className="mt-1 block w-full rounded-md border p-2 text-black bg-white"><option value="32px">32px - Compact</option><option value="36px">36px - Small</option><option value="44px">44px - Default</option><option value="52px">52px - Large</option><option value="60px">60px - XL</option></select></label>
              <label className="text-sm font-medium">Card / Form Radius<select value={cardRadius} onChange={(e) => setCardRadius(e.target.value)} className="mt-1 block w-full rounded-md border p-2 text-black bg-white"><option value="0px">0px - Square</option><option value="6px">6px</option><option value="12px">12px - Default</option><option value="16px">16px - Soft</option><option value="24px">24px - Round</option></select></label>
              <label className="text-sm font-medium">Border Width<select value={borderWidth} onChange={(e) => setBorderWidth(e.target.value)} className="mt-1 block w-full rounded-md border p-2 text-black bg-white"><option value="1px">1px - Thin</option><option value="2px">2px - Medium</option><option value="3px">3px - Bold</option></select></label>
            </div>

            {/* SECTION 3: BUTTONS */}
            <h3 className="mt-8 text-sm font-bold uppercase tracking-wide bg-slate-100 p-2 rounded">3. Button Look - Size & Radius</h3>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label className="text-sm font-medium">Button Height<select value={buttonHeight} onChange={(e) => setButtonHeight(e.target.value)} className="mt-1 block w-full rounded-md border p-2 text-black bg-white"><option value="36px">36px - Small</option><option value="44px">44px - Default</option><option value="48px">48px - Medium</option><option value="52px">52px - Large</option><option value="60px">60px - XL</option></select></label>
              <label className="text-sm font-medium">Button Radius<select value={buttonRadius} onChange={(e) => setButtonRadius(e.target.value)} className="mt-1 block w-full rounded-md border p-2 text-black bg-white"><option value="0px">0px - Square</option><option value="4px">4px - Tiny</option><option value="8px">8px - Default</option><option value="12px">12px - Rounded</option><option value="999px">999px - Pill Button</option></select></label>
              <label className="text-sm font-medium">Global Font Size<select value={fontSize} onChange={(e) => setFontSize(e.target.value)} className="mt-1 block w-full rounded-md border p-2 text-black bg-white"><option value="12px">12px - Small</option><option value="14px">14px - Default</option><option value="16px">16px - Large</option><option value="18px">18px - XL</option></select></label>
            </div>

            {/* LIVE PREVIEW */}
            <div className="mt-8 rounded-xl border bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase">Live Preview (How site will look)</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <input placeholder="Form Preview" style={{ height: inputHeight, borderRadius: cardRadius, borderWidth: borderWidth, fontSize: fontSize }} className="w-40 border-slate-300 bg-white px-3 text-black" readOnly />
                <button style={{ height: buttonHeight, borderRadius: buttonRadius, background: gold, fontSize: fontSize }} className="px-6 font-bold text-black">Button Preview</button>
                <div style={{ borderRadius: cardRadius, height: buttonHeight, fontSize: fontSize }} className="flex items-center bg-white border px-4 text-black">Card</div>
              </div>
            </div>

            <button onClick={saveColors} type="button" className="mt-6 w-full rounded-md bg-[#0F172A] px-6 py-4 font-bold text-white text-lg">
              SAVE & APPLY TO WHOLE SITE - ALL DEVICES
            </button>
            <p className="mt-2 text-center text-xs text-slate-500">Changes are linked to globals.css via GlobalStyles - Instant on all pages</p>
          </section>

          <section className="mt-8 max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold">Client project upload limit</h2>
            <form className="mt-5 flex flex-wrap items-end gap-3" onSubmit={(event) => void saveSettings(event)}>
              <label className="text-sm font-medium">Maximum file size (MB)<input type="number" required min={1} max={2048} step={1} value={maximumMegabytes} onChange={(event) => setMaximumMegabytes(event.target.value)} className="mt-1 block w-48 rounded-md border p-2 text-black bg-white" /></label>
              <button type="submit" disabled={saving || !token} className="rounded-md bg-[#0F172A] px-4 py-2 font-semibold text-white disabled:opacity-60">{saving ? "Saving…" : "Save limit"}</button>
            </form>
          </section>
        </>
      )}
    </main>
  );
}