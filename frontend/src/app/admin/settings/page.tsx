"use client";
import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";
import { apiRequest } from "@/lib/project-delivery";

type EffectiveRow = { key: string; effectiveValue: string | null; dbValue: string | null; envValue: string | null; source: string; updatedAt: string | null; updatedBy: string | null; };
type AuditRow = { id: string; key: string; oldValue: string | null; newValue: string; changedBy: string; createdAt: string; };

export default function AdminSettingsPage() {
  const [token, setToken] = useState("");
  const [maximumMegabytes, setMaximumMegabytes] = useState("100");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [activeTab, setActiveTab] = useState<"live" | "design" | "upload" | "audit">("live");
  const [liveRows, setLiveRows] = useState<EffectiveRow[]>([]);
  const [audits, setAudits] = useState<AuditRow[]>([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveSavingKey, setLiveSavingKey] = useState<string | null>(null);

  // ===== DESIGN - ALL 20+ FIELDS =====
  const [primary, setPrimary] = useState("#0F172A");
  const [gold, setGold] = useState("#D4AF37");
  const [bg, setBg] = useState("#F8FAFC");
  const [cardBg, setCardBg] = useState("#FFFFFF");
  const [headerBg, setHeaderBg] = useState("#0F172A");
  const [footerBg, setFooterBg] = useState("#0F172A");
  const [textColor, setTextColor] = useState("#0F172A");
  const [borderColor, setBorderColor] = useState("#CBD5E1");
  const [buttonRadius, setButtonRadius] = useState("8px");
  const [cardRadius, setCardRadius] = useState("12px");
  const [inputRadius, setInputRadius] = useState("12px");
  const [inputHeight, setInputHeight] = useState("44px");
  const [buttonHeight, setButtonHeight] = useState("44px");
  const [fontSize, setFontSize] = useState("14px");
  const [h1Size, setH1Size] = useState("36px");
  const [h2Size, setH2Size] = useState("24px");
  const [h3Size, setH3Size] = useState("18px");
  const [fontFamily, setFontFamily] = useState("Arial, Helvetica, sans-serif");
  const [lineHeight, setLineHeight] = useState("1.6");
  const [headerHeight, setHeaderHeight] = useState("64px");
  const [footerHeight, setFooterHeight] = useState("auto");
  const [containerMax, setContainerMax] = useState("1280px");
  const [borderWidth, setBorderWidth] = useState("1px");
  const [colorNotice, setColorNotice] = useState("");

  useEffect(() => {
    const accessToken = sessionStorage.getItem("accessToken");
    if (!accessToken) { setError("Sign in as admin"); setLoading(false); return; }
    setToken(accessToken);
    apiRequest<{ maximumMegabytes: number }>("/settings/project-upload-limit", accessToken).then(s => setMaximumMegabytes(String(s.maximumMegabytes))).catch(() => { }).finally(() => setLoading(false));
    const saved = localStorage.getItem("tmg_colors");
    if (saved) { try { const c = JSON.parse(saved); setPrimary(c.primary || "#0F172A"); setGold(c.gold || "#D4AF37"); setBg(c.bg || "#F8FAFC"); setCardBg(c.cardBg || "#FFFFFF"); setHeaderBg(c.headerBg || "#0F172A"); setFooterBg(c.footerBg || "#0F172A"); setTextColor(c.textColor || "#0F172A"); setBorderColor(c.borderColor || "#CBD5E1"); setButtonRadius(c.buttonRadius || "8px"); setCardRadius(c.cardRadius || "12px"); setInputRadius(c.inputRadius || "12px"); setInputHeight(c.inputHeight || "44px"); setButtonHeight(c.buttonHeight || "44px"); setFontSize(c.fontSize || "14px"); setH1Size(c.h1Size || "36px"); setH2Size(c.h2Size || "24px"); setH3Size(c.h3Size || "18px"); setFontFamily(c.fontFamily || "Arial"); setLineHeight(c.lineHeight || "1.6"); setHeaderHeight(c.headerHeight || "64px"); setFooterHeight(c.footerHeight || "auto"); setContainerMax(c.containerMax || "1280px"); setBorderWidth(c.borderWidth || "1px"); } catch { } }
    void loadLive(accessToken); void loadAudit(accessToken);
  }, []);

  async function loadLive(accessToken?: string) { const t = accessToken || token || sessionStorage.getItem("accessToken") || ""; if (!t) return; setLiveLoading(true); try { const rows = await apiRequest<EffectiveRow[]>("/settings/public", t); setLiveRows(rows); } catch { } setLiveLoading(false); }
  async function loadAudit(accessToken?: string) { const t = accessToken || token || sessionStorage.getItem("accessToken") || ""; if (!t) return; try { const rows = await apiRequest<AuditRow[]>("/settings/audit", t); setAudits(rows); } catch { try { const rows = await apiRequest<AuditRow[]>("/settings/audit-log", t); setAudits(rows); } catch { } } }
  async function saveLive(key: string, value: string) { setLiveSavingKey(key); setError(""); setNotice(""); try { await apiRequest(`/settings/${key}`, token, { method: "PUT", body: JSON.stringify({ value }) }); setNotice(`${key} saved LIVE`); await loadLive(); await loadAudit(); } catch (e: any) { setError(e.message); } finally { setLiveSavingKey(null); } }
  async function resetLive(key: string) { try { await apiRequest(`/settings/${key}`, token, { method: "DELETE" }); setNotice(`${key} reset to ENV`); await loadLive(); await loadAudit(); } catch (e: any) { setError(e.message); } }
  async function saveSettings(e: FormEvent<HTMLFormElement>) { e.preventDefault(); setSaving(true); try { const result = await apiRequest<{ maximumMegabytes: number }>("/settings/project-upload-limit", token, { method: "PATCH", body: JSON.stringify({ maximumMegabytes: Number(maximumMegabytes) }) }); setMaximumMegabytes(String(result.maximumMegabytes)); setNotice("Upload limit saved."); } catch (err: any) { setError(err.message); } finally { setSaving(false); } }

  function saveColors() {
    const colors = { primary, gold, bg, cardBg, headerBg, footerBg, textColor, borderColor, buttonRadius, cardRadius, inputRadius, inputHeight, buttonHeight, fontSize, h1Size, h2Size, h3Size, fontFamily, lineHeight, headerHeight, footerHeight, containerMax, borderWidth };
    localStorage.setItem("tmg_colors", JSON.stringify(colors));
    const root = document.documentElement;
    root.style.setProperty("--primary", primary); root.style.setProperty("--gold", gold); root.style.setProperty("--background", bg); root.style.setProperty("--card-bg", cardBg); root.style.setProperty("--header-bg", headerBg); root.style.setProperty("--footer-bg", footerBg); root.style.setProperty("--foreground", textColor); root.style.setProperty("--border-color", borderColor); root.style.setProperty("--button-radius", buttonRadius); root.style.setProperty("--radius", cardRadius); root.style.setProperty("--input-radius", inputRadius); root.style.setProperty("--input-height", inputHeight); root.style.setProperty("--button-height", buttonHeight); root.style.setProperty("--font-size", fontSize); root.style.setProperty("--h1-size", h1Size); root.style.setProperty("--h2-size", h2Size); root.style.setProperty("--h3-size", h3Size); root.style.setProperty("--font-family", fontFamily); root.style.setProperty("--line-height", lineHeight); root.style.setProperty("--header-height", headerHeight); root.style.setProperty("--footer-height", footerHeight); root.style.setProperty("--container-max", containerMax); root.style.setProperty("--border-width", borderWidth);
    setColorNotice(`SAVED ALL 22 FIELDS! Applied to whole site instantly`); setTimeout(() => setColorNotice(""), 6000); setNotice("Design system saved & applied LIVE");
  }

  if (loading) return <main className="p-8">Loading…</main>;

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <header className="flex justify-between"><div><p className="text-xs font-bold tracking-widest text-[#8A6A00]">ADMIN</p><h1 className="text-4xl font-bold text-slate-900">System Settings - FULL GLOBAL</h1></div><Link href="/admin" className="border px-4 py-2 rounded text-slate-900">Dashboard</Link></header>

      <div className="mt-8 flex gap-2 border-b overflow-x-auto">
        <button onClick={() => setActiveTab("live")} className={`px-4 py-2 border-b-2 font-bold whitespace-nowrap ${activeTab === "live" ? "border-black text-black" : "border-transparent text-slate-500"}`}>Tab1: Live Keys</button>
        <button onClick={() => setActiveTab("design")} className={`px-4 py-2 border-b-2 font-bold whitespace-nowrap ${activeTab === "design" ? "border-black text-black" : "border-transparent text-slate-500"}`}>Tab2: Design 22 Fields</button>
        <button onClick={() => setActiveTab("upload")} className={`px-4 py-2 border-b-2 font-bold whitespace-nowrap ${activeTab === "upload" ? "border-black text-black" : "border-transparent text-slate-500"}`}>Tab3: Upload</button>
        <button onClick={() => setActiveTab("audit")} className={`px-4 py-2 border-b-2 font-bold whitespace-nowrap ${activeTab === "audit" ? "border-black text-black" : "border-transparent text-slate-500"}`}>Tab4: Audit ({audits.length})</button>
      </div>

      {(error || notice) && <p className={`mt-4 p-3 rounded text-sm ${error ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"}`}>{error || notice}</p>}

      {activeTab === "live" && (<section className="mt-6 space-y-3">{liveLoading ? <p>Loading…</p> : liveRows.map(r => (<div key={r.key} className="border rounded-xl p-4 bg-white"><div className="flex justify-between"><span className="font-mono font-bold text-slate-900">{r.key}</span><span className={`text-[10px] px-2 py-1 rounded font-bold ${r.source === "database" ? "bg-green-100 text-green-800" : "bg-slate-100"}`}>{r.source}</span></div><div className="flex gap-2 mt-3"><input id={`inp-${r.key}`} defaultValue={r.effectiveValue || ""} className="flex-1 border rounded px-3 py-2 text-sm bg-white text-black font-mono" /><button onClick={() => { const el = document.getElementById(`inp-${r.key}`) as HTMLInputElement; void saveLive(r.key, el.value); }} className="bg-black text-white px-4 py-2 rounded text-sm font-bold">{liveSavingKey === r.key ? "Saving…" : "Save Live"}</button><button onClick={() => void resetLive(r.key)} className="border px-3 py-2 rounded text-xs text-slate-900">Reset</button></div></div>))}</section>)}

      {activeTab === "design" && (
        <section className="mt-6 border rounded-xl p-6 bg-white max-w-6xl space-y-6">
          <h2 className="font-bold text-slate-900 text-xl">FULL Global Design System - 22 Controls</h2>
          {colorNotice && <p className="p-3 rounded bg-green-50 border text-green-800 font-bold">{colorNotice}</p>}

          <div><h3 className="font-bold bg-slate-100 p-2 rounded text-slate-900">A. COLORS (7)</h3><div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
            <label className="text-xs text-slate-900">Primary <input type="color" value={primary} onChange={e => setPrimary(e.target.value)} className="block h-10 w-full" /><input value={primary} onChange={e => setPrimary(e.target.value)} className="w-full border rounded p-1 text-black text-xs" /></label>
            <label className="text-xs text-slate-900">Gold <input type="color" value={gold} onChange={e => setGold(e.target.value)} className="block h-10 w-full" /><input value={gold} onChange={e => setGold(e.target.value)} className="w-full border rounded p-1 text-black text-xs" /></label>
            <label className="text-xs text-slate-900">Page BG <input type="color" value={bg} onChange={e => setBg(e.target.value)} className="block h-10 w-full" /><input value={bg} onChange={e => setBg(e.target.value)} className="w-full border rounded p-1 text-black text-xs" /></label>
            <label className="text-xs text-slate-900">Card BG <input type="color" value={cardBg} onChange={e => setCardBg(e.target.value)} className="block h-10 w-full" /><input value={cardBg} onChange={e => setCardBg(e.target.value)} className="w-full border rounded p-1 text-black text-xs" /></label>
            <label className="text-xs text-slate-900">Header BG <input type="color" value={headerBg} onChange={e => setHeaderBg(e.target.value)} className="block h-10 w-full" /><input value={headerBg} onChange={e => setHeaderBg(e.target.value)} className="w-full border rounded p-1 text-black text-xs" /></label>
            <label className="text-xs text-slate-900">Footer BG <input type="color" value={footerBg} onChange={e => setFooterBg(e.target.value)} className="block h-10 w-full" /><input value={footerBg} onChange={e => setFooterBg(e.target.value)} className="w-full border rounded p-1 text-black text-xs" /></label>
            <label className="text-xs text-slate-900">Text Color <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)} className="block h-10 w-full" /><input value={textColor} onChange={e => setTextColor(e.target.value)} className="w-full border rounded p-1 text-black text-xs" /></label>
            <label className="text-xs text-slate-900">Border Color <input type="color" value={borderColor} onChange={e => setBorderColor(e.target.value)} className="block h-10 w-full" /><input value={borderColor} onChange={e => setBorderColor(e.target.value)} className="w-full border rounded p-1 text-black text-xs" /></label>
          </div></div>

          <div><h3 className="font-bold bg-slate-100 p-2 rounded text-slate-900">B. TYPOGRAPHY (6)</h3><div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-3">
            <label className="text-xs text-slate-900">Font Family<select value={fontFamily} onChange={e => setFontFamily(e.target.value)} className="block w-full border rounded p-2 bg-white text-black"><option>Arial, Helvetica, sans-serif</option><option>Inter, sans-serif</option><option>Georgia, serif</option><option>Monospace</option></select></label>
            <label className="text-xs text-slate-900">Body Size<select value={fontSize} onChange={e => setFontSize(e.target.value)} className="block w-full border rounded p-2 bg-white text-black"><option value="12px">12px</option><option value="14px">14px</option><option value="16px">16px</option><option value="18px">18px</option></select></label>
            <label className="text-xs text-slate-900">H1 Size<select value={h1Size} onChange={e => setH1Size(e.target.value)} className="block w-full border rounded p-2 bg-white text-black"><option value="28px">28px</option><option value="36px">36px</option><option value="48px">48px</option><option value="60px">60px</option></select></label>
            <label className="text-xs text-slate-900">H2 Size<select value={h2Size} onChange={e => setH2Size(e.target.value)} className="block w-full border rounded p-2 bg-white text-black"><option value="20px">20px</option><option value="24px">24px</option><option value="30px">30px</option><option value="36px">36px</option></select></label>
            <label className="text-xs text-slate-900">H3 Size<select value={h3Size} onChange={e => setH3Size(e.target.value)} className="block w-full border rounded p-2 bg-white text-black"><option value="16px">16px</option><option value="18px">18px</option><option value="22px">22px</option></select></label>
            <label className="text-xs text-slate-900">Line Height<select value={lineHeight} onChange={e => setLineHeight(e.target.value)} className="block w-full border rounded p-2 bg-white text-black"><option value="1.4">1.4</option><option value="1.6">1.6</option><option value="1.8">1.8</option></select></label>
          </div></div>

          <div><h3 className="font-bold bg-slate-100 p-2 rounded text-slate-900">C. SIZING & LAYOUT (9)</h3><div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-3">
            <label className="text-xs text-slate-900">Button Radius<select value={buttonRadius} onChange={e => setButtonRadius(e.target.value)} className="block w-full border rounded p-2 bg-white text-black"><option value="0px">Square</option><option value="8px">8px</option><option value="12px">12px</option><option value="999px">Pill</option></select></label>
            <label className="text-xs text-slate-900">Card Radius<select value={cardRadius} onChange={e => setCardRadius(e.target.value)} className="block w-full border rounded p-2 bg-white text-black"><option value="0px">0</option><option value="12px">12px</option><option value="24px">24px</option></select></label>
            <label className="text-xs text-slate-900">Input Radius<select value={inputRadius} onChange={e => setInputRadius(e.target.value)} className="block w-full border rounded p-2 bg-white text-black"><option value="8px">8px</option><option value="12px">12px</option><option value="24px">24px</option></select></label>
            <label className="text-xs text-slate-900">Input Height<select value={inputHeight} onChange={e => setInputHeight(e.target.value)} className="block w-full border rounded p-2 bg-white text-black"><option value="36px">36px</option><option value="44px">44px</option><option value="52px">52px</option></select></label>
            <label className="text-xs text-slate-900">Button Height<select value={buttonHeight} onChange={e => setButtonHeight(e.target.value)} className="block w-full border rounded p-2 bg-white text-black"><option value="36px">36px</option><option value="44px">44px</option><option value="52px">52px</option></select></label>
            <label className="text-xs text-slate-900">Header Height<select value={headerHeight} onChange={e => setHeaderHeight(e.target.value)} className="block w-full border rounded p-2 bg-white text-black"><option value="56px">56px</option><option value="64px">64px</option><option value="80px">80px</option></select></label>
            <label className="text-xs text-slate-900">Footer Height<select value={footerHeight} onChange={e => setFooterHeight(e.target.value)} className="block w-full border rounded p-2 bg-white text-black"><option value="auto">Auto</option><option value="200px">200px</option><option value="300px">300px</option></select></label>
            <label className="text-xs text-slate-900">Container Max<select value={containerMax} onChange={e => setContainerMax(e.target.value)} className="block w-full border rounded p-2 bg-white text-black"><option value="1024px">1024px</option><option value="1280px">1280px</option><option value="1536px">1536px</option></select></label>
            <label className="text-xs text-slate-900">Border Width<select value={borderWidth} onChange={e => setBorderWidth(e.target.value)} className="block w-full border rounded p-2 bg-white text-black"><option value="1px">1px</option><option value="2px">2px</option><option value="0px">None</option></select></label>
          </div></div>

          <button onClick={saveColors} type="button" className="w-full rounded-md bg-black px-6 py-4 font-bold text-white text-lg">SAVE & APPLY ALL 22 FIELDS TO WHOLE SITE</button>
        </section>
      )}

      {activeTab === "upload" && (<section className="mt-8 max-w-2xl rounded-2xl border bg-white p-6"><h2 className="font-bold text-slate-900">Upload Limit</h2><form className="mt-5 flex gap-3" onSubmit={e => void saveSettings(e)}><input type="number" required min={1} max={2048} value={maximumMegabytes} onChange={e => setMaximumMegabytes(e.target.value)} className="w-48 rounded-md border p-2 text-black bg-white" /><button type="submit" disabled={saving} className="rounded-md bg-black px-4 py-2 text-white">{saving ? "Saving…" : "Save"}</button></form></section>)}
      {activeTab === "audit" && (<section className="mt-8 border rounded-xl bg-white overflow-hidden"><div className="p-4 bg-slate-50 border-b flex justify-between"><h2 className="font-bold text-slate-900">Audit Log</h2><button onClick={() => loadAudit()} className="text-xs border px-3 py-1 rounded bg-white text-slate-900">Refresh</button></div><table className="w-full text-sm"><thead className="bg-slate-50 text-left"><tr><th className="p-3">Time</th><th className="p-3">Key</th><th className="p-3">Changed By</th><th className="p-3">Old → New</th></tr></thead><tbody>{audits.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-slate-500">No audits</td></tr>}{audits.map(a => (<tr key={a.id} className="border-t"><td className="p-3 text-xs">{new Date(a.createdAt).toLocaleString()}</td><td className="p-3 font-mono font-bold text-slate-900">{a.key}</td><td className="p-3">{a.changedBy}</td><td className="p-3 font-mono text-xs"><span className="text-red-500 line-through">{a.oldValue?.slice(0, 60) || "—"}</span> → <span className="text-green-600">{a.newValue?.slice(0, 60)}</span></td></tr>))}</tbody></table></section>)}
    </main>
  );
}