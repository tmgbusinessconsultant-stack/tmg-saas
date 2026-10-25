"use client";
import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { apiRequest } from "@/lib/project-delivery";

type EffectiveRow = { key: string; effectiveValue: string | null; dbValue: string | null; envValue: string | null; source: string; updatedAt: string | null; updatedBy: string | null; };
type AuditRow = { id: string; key: string; oldValue: string | null; newValue: string; changedBy: string; createdAt: string; };

const DESIGN_DEFAULTS = {
  primary: "#0F172A",
  gold: "#D4AF37",
  bg: "#F8FAFC",
  cardBg: "#FFFFFF",
  headerBg: "#0F172A",
  footerBg: "#0F172A",
  textColor: "#0F172A",
  borderColor: "#CBD5E1",
  buttonRadius: "8px",
  cardRadius: "12px",
  inputHeight: "44px",
  buttonHeight: "44px",
  fontSize: "14px",
  h1Size: "36px",
  h2Size: "24px",
  h3Size: "18px",
  fontFamily: "Arial, Helvetica, sans-serif",
  lineHeight: "1.6",
  headerHeight: "64px",
  footerHeight: "auto",
  containerMax: "1280px",
  borderWidth: "1px",
};

const PRESETS = [
  { name: "Default Dark", colors: { primary: "#0F172A", gold: "#D4AF37", bg: "#F8FAFC", headerBg: "#0F172A", footerBg: "#0F172A" } },
  { name: "Light Gold", colors: { primary: "#8A6A00", gold: "#D4AF37", bg: "#FFFBEB", headerBg: "#FFFFFF", footerBg: "#FFFBEB", cardBg: "#FFFFFF" } },
  { name: "Ocean Blue", colors: { primary: "#0E7490", gold: "#06B6D4", bg: "#ECFEFF", headerBg: "#0E7490", footerBg: "#164E63" } },
  { name: "Forest", colors: { primary: "#14532D", gold: "#22C55E", bg: "#F0FDF4", headerBg: "#14532D", footerBg: "#052E16" } },
];

export default function AdminSettingsPage() {
  const [token, setToken] = useState("");
  const [maximumMegabytes, setMaximumMegabytes] = useState("100");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [activeTab, setActiveTab] = useState<"live" | "design" | "upload" | "audit">("live");
  const [liveRows, setLiveRows] = useState<EffectiveRow[]>([]);
  const [liveSearch, setLiveSearch] = useState("");
  const [audits, setAudits] = useState<AuditRow[]>([]);
  const [auditSearch, setAuditSearch] = useState("");
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveSavingKey, setLiveSavingKey] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ===== DESIGN - ALL 22 FIELDS =====
  const [primary, setPrimary] = useState(DESIGN_DEFAULTS.primary);
  const [gold, setGold] = useState(DESIGN_DEFAULTS.gold);
  const [bg, setBg] = useState(DESIGN_DEFAULTS.bg);
  const [cardBg, setCardBg] = useState(DESIGN_DEFAULTS.cardBg);
  const [headerBg, setHeaderBg] = useState(DESIGN_DEFAULTS.headerBg);
  const [footerBg, setFooterBg] = useState(DESIGN_DEFAULTS.footerBg);
  const [textColor, setTextColor] = useState(DESIGN_DEFAULTS.textColor);
  const [borderColor, setBorderColor] = useState(DESIGN_DEFAULTS.borderColor);
  const [buttonRadius, setButtonRadius] = useState(DESIGN_DEFAULTS.buttonRadius);
  const [cardRadius, setCardRadius] = useState(DESIGN_DEFAULTS.cardRadius);
  const [inputRadius, setInputRadius] = useState(DESIGN_DEFAULTS.inputRadius);
  const [inputHeight, setInputHeight] = useState(DESIGN_DEFAULTS.inputHeight);
  const [buttonHeight, setButtonHeight] = useState(DESIGN_DEFAULTS.buttonHeight);
  const [fontSize, setFontSize] = useState(DESIGN_DEFAULTS.fontSize);
  const [h1Size, setH1Size] = useState(DESIGN_DEFAULTS.h1Size);
  const [h2Size, setH2Size] = useState(DESIGN_DEFAULTS.h2Size);
  const [h3Size, setH3Size] = useState(DESIGN_DEFAULTS.h3Size);
  const [fontFamily, setFontFamily] = useState(DESIGN_DEFAULTS.fontFamily);
  const [lineHeight, setLineHeight] = useState(DESIGN_DEFAULTS.lineHeight);
  const [headerHeight, setHeaderHeight] = useState(DESIGN_DEFAULTS.headerHeight);
  const [footerHeight, setFooterHeight] = useState(DESIGN_DEFAULTS.footerHeight);
  const [containerMax, setContainerMax] = useState(DESIGN_DEFAULTS.containerMax);
  const [borderWidth, setBorderWidth] = useState(DESIGN_DEFAULTS.borderWidth);
  const [colorNotice, setColorNotice] = useState("");

  const applyCssVars = (c: typeof DESIGN_DEFAULTS) => {
    const root = document.documentElement;
    root.style.setProperty("--primary", c.primary);
    root.style.setProperty("--gold", c.gold);
    root.style.setProperty("--background", c.bg);
    root.style.setProperty("--card-bg", c.cardBg);
    root.style.setProperty("--header-bg", c.headerBg);
    root.style.setProperty("--footer-bg", c.footerBg);
    root.style.setProperty("--foreground", c.textColor);
    root.style.setProperty("--border-color", c.borderColor);
    root.style.setProperty("--button-radius", c.buttonRadius);
    root.style.setProperty("--radius", c.cardRadius);
    root.style.setProperty("--input-radius", c.inputRadius);
    root.style.setProperty("--input-height", c.inputHeight);
    root.style.setProperty("--button-height", c.buttonHeight);
    root.style.setProperty("--font-size", c.fontSize);
    root.style.setProperty("--h1-size", c.h1Size);
    root.style.setProperty("--h2-size", c.h2Size);
    root.style.setProperty("--h3-size", c.h3Size);
    root.style.setProperty("--font-family", c.fontFamily);
    root.style.setProperty("--line-height", c.lineHeight);
    root.style.setProperty("--header-height", c.headerHeight);
    root.style.setProperty("--footer-height", c.footerHeight);
    root.style.setProperty("--container-max", c.containerMax);
    root.style.setProperty("--border-width", c.borderWidth);
  };

  const getCurrentColors = (): typeof DESIGN_DEFAULTS => ({
    primary, gold, bg, cardBg, headerBg, footerBg, textColor, borderColor,
    buttonRadius, cardRadius, inputRadius, inputHeight, buttonHeight,
    fontSize, h1Size, h2Size, h3Size, fontFamily, lineHeight,
    headerHeight, footerHeight, containerMax, borderWidth
  });

  const loadColorsToState = (c: any) => {
    setPrimary(c.primary || DESIGN_DEFAULTS.primary);
    setGold(c.gold || DESIGN_DEFAULTS.gold);
    setBg(c.bg || DESIGN_DEFAULTS.bg);
    setCardBg(c.cardBg || DESIGN_DEFAULTS.cardBg);
    setHeaderBg(c.headerBg || DESIGN_DEFAULTS.headerBg);
    setFooterBg(c.footerBg || DESIGN_DEFAULTS.footerBg);
    setTextColor(c.textColor || DESIGN_DEFAULTS.textColor);
    setBorderColor(c.borderColor || DESIGN_DEFAULTS.borderColor);
    setButtonRadius(c.buttonRadius || DESIGN_DEFAULTS.buttonRadius);
    setCardRadius(c.cardRadius || DESIGN_DEFAULTS.cardRadius);
    setInputRadius(c.inputRadius || DESIGN_DEFAULTS.inputRadius);
    setInputHeight(c.inputHeight || DESIGN_DEFAULTS.inputHeight);
    setButtonHeight(c.buttonHeight || DESIGN_DEFAULTS.buttonHeight);
    setFontSize(c.fontSize || DESIGN_DEFAULTS.fontSize);
    setH1Size(c.h1Size || DESIGN_DEFAULTS.h1Size);
    setH2Size(c.h2Size || DESIGN_DEFAULTS.h2Size);
    setH3Size(c.h3Size || DESIGN_DEFAULTS.h3Size);
    setFontFamily(c.fontFamily || DESIGN_DEFAULTS.fontFamily);
    setLineHeight(c.lineHeight || DESIGN_DEFAULTS.lineHeight);
    setHeaderHeight(c.headerHeight || DESIGN_DEFAULTS.headerHeight);
    setFooterHeight(c.footerHeight || DESIGN_DEFAULTS.footerHeight);
    setContainerMax(c.containerMax || DESIGN_DEFAULTS.containerMax);
    setBorderWidth(c.borderWidth || DESIGN_DEFAULTS.borderWidth);
    applyCssVars({ ...DESIGN_DEFAULTS, ...c });
  };

  useEffect(() => {
    const accessToken = sessionStorage.getItem("accessToken") || localStorage.getItem("token") || "";
    if (!accessToken) { setError("Sign in as admin"); setLoading(false); return; }
    setToken(accessToken);
    apiRequest<{ maximumMegabytes: number }>("/settings/project-upload-limit", accessToken).then(s => setMaximumMegabytes(String(s.maximumMegabytes))).catch(() => { }).finally(() => setLoading(false));

    // Load from local + backend
    const saved = localStorage.getItem("tmg_colors");
    if (saved) { try { loadColorsToState(JSON.parse(saved)); } catch { } }

    void loadLive(accessToken); void loadAudit(accessToken);

    // Try load tmg_colors from backend if exists
    apiRequest<{ effectiveValue: string } | any>("/settings/tmg_colors", accessToken).then((r: any) => {
      const val = r.effectiveValue || r.value || r;
      if (val) {
        try { const parsed = typeof val === "string" ? JSON.parse(val) : val; if (parsed.primary) { loadColorsToState(parsed); localStorage.setItem("tmg_colors", JSON.stringify(parsed)); } } catch { }
      }
    }).catch(() => { });
  }, []);

  async function loadLive(accessToken?: string) { const t = accessToken || token || sessionStorage.getItem("accessToken") || localStorage.getItem("token") || ""; if (!t) return; setLiveLoading(true); try { const rows = await apiRequest<EffectiveRow[]>("/settings/public", t); setLiveRows(rows); } catch { } setLiveLoading(false); }
  async function loadAudit(accessToken?: string) { const t = accessToken || token || sessionStorage.getItem("accessToken") || localStorage.getItem("token") || ""; if (!t) return; try { const rows = await apiRequest<AuditRow[]>("/settings/audit", t); setAudits(rows); } catch { try { const rows = await apiRequest<AuditRow[]>("/settings/audit-log", t); setAudits(rows); } catch { } } }
  async function saveLive(key: string, value: string) { setLiveSavingKey(key); setError(""); setNotice(""); try { await apiRequest(`/settings/${key}`, token, { method: "PUT", body: JSON.stringify({ value }) }); setNotice(`${key} saved LIVE ✓`); await loadLive(); await loadAudit(); } catch (e: any) { setError(e.message); } finally { setLiveSavingKey(null); } }
  async function resetLive(key: string) { if (!confirm(`Reset ${key} to ENV default?`)) return; try { await apiRequest(`/settings/${key}`, token, { method: "DELETE" }); setNotice(`${key} reset to ENV`); await loadLive(); await loadAudit(); } catch (e: any) { setError(e.message); } }
  async function saveSettings(e: FormEvent<HTMLFormElement>) { e.preventDefault(); setSaving(true); try { const result = await apiRequest<{ maximumMegabytes: number }>("/settings/project-upload-limit", token, { method: "PATCH", body: JSON.stringify({ maximumMegabytes: Number(maximumMegabytes) }) }); setMaximumMegabytes(String(result.maximumMegabytes)); setNotice("Upload limit saved."); } catch (err: any) { setError(err.message); } finally { setSaving(false); } }

  async function saveColors() {
    const colors = getCurrentColors();
    localStorage.setItem("tmg_colors", JSON.stringify(colors));
    applyCssVars(colors);

    // Save to backend too
    setSaving(true); setError(""); setNotice("");
    try {
      // save as single JSON blob
      await apiRequest(`/settings/tmg_colors`, token, { method: "PUT", body: JSON.stringify({ value: JSON.stringify(colors) }) });
      // also save individual for live tab visibility
      for (const [k, v] of Object.entries(colors)) {
        await apiRequest(`/settings/design_${k}`, token, { method: "PUT", body: JSON.stringify({ value: v as string }) }).catch(() => { });
      }
      setColorNotice(`SAVED ALL 22 FIELDS! Applied LIVE + saved to DB ✓`);
      setNotice("Design system saved globally — all devices will load it");
      await loadLive(); await loadAudit();
    } catch (e: any) { setColorNotice(`Saved locally, but DB sync failed: ${e.message}. Other devices won't see it yet.`); setError(e.message); }
    finally { setSaving(false); setTimeout(() => setColorNotice(""), 8000); }
  }

  function resetDesign() {
    if (!confirm("Reset ALL 22 design fields to defaults?")) return;
    loadColorsToState(DESIGN_DEFAULTS);
    localStorage.removeItem("tmg_colors");
    setNotice("Design reset to defaults locally. Click SAVE to save to DB.");
  }

  function exportDesign() {
    const colors = getCurrentColors();
    const blob = new Blob([JSON.stringify(colors, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `tmg-design-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    URL.revokeObjectURL(url);
    setNotice("Design JSON exported ✓");
  }

  function importDesign(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        if (!parsed.primary && !parsed.gold) throw new Error("Invalid design file");
        loadColorsToState(parsed);
        localStorage.setItem("tmg_colors", JSON.stringify(parsed));
        setNotice("Design imported — click SAVE to apply globally");
        setColorNotice("Imported! Now click SAVE & APPLY to save to DB");
      } catch (err: any) { setError(`Import failed: ${err.message}`); }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  const filteredLive = useMemo(() => liveRows.filter(r => `${r.key} ${r.effectiveValue}`.toLowerCase().includes(liveSearch.toLowerCase())), [liveRows, liveSearch]);
  const filteredAudits = useMemo(() => audits.filter(a => `${a.key} ${a.changedBy} ${a.newValue}`.toLowerCase().includes(auditSearch.toLowerCase())), [audits, auditSearch]);

  if (loading) return <main className="p-8">Loading…</main>;

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <header className="flex flex-wrap justify-between gap-3">
        <div><p className="text-xs font-bold tracking-widest text-[#8A6A00]">ADMIN • SUPER ADVANCED</p><h1 className="text-4xl font-bold text-slate-900">System Settings — Global Control</h1><p className="text-sm text-slate-500 mt-1">{liveRows.length} live keys • {audits.length} audit logs • 22 design fields</p></div>
        <div className="flex gap-2"><Link href="/admin" className="border px-4 py-2 rounded bg-white text-slate-900 text-sm h-fit">Dashboard</Link><button onClick={() => { void loadLive(); void loadAudit(); }} className="border px-4 py-2 rounded bg-white text-sm h-fit">Refresh All</button></div>
      </header>

      <div className="mt-8 flex gap-2 border-b overflow-x-auto sticky top-0 bg-[#F8FAFC] z-10 py-2">
        <button onClick={() => setActiveTab("live")} className={`px-4 py-2 border-b-2 font-bold whitespace-nowrap text-sm ${activeTab === "live" ? "border-black text-black" : "border-transparent text-slate-500"}`}>Tab1: Live Keys ({filteredLive.length})</button>
        <button onClick={() => setActiveTab("design")} className={`px-4 py-2 border-b-2 font-bold whitespace-nowrap text-sm ${activeTab === "design" ? "border-black text-black" : "border-transparent text-slate-500"}`}>Tab2: Design 22 Fields ★</button>
        <button onClick={() => setActiveTab("upload")} className={`px-4 py-2 border-b-2 font-bold whitespace-nowrap text-sm ${activeTab === "upload" ? "border-black text-black" : "border-transparent text-slate-500"}`}>Tab3: Upload</button>
        <button onClick={() => setActiveTab("audit")} className={`px-4 py-2 border-b-2 font-bold whitespace-nowrap text-sm ${activeTab === "audit" ? "border-black text-black" : "border-transparent text-slate-500"}`}>Tab4: Audit ({audits.length})</button>
      </div>

      {(error || notice) && <p className={`mt-4 p-3 rounded text-sm font-medium ${error ? "bg-red-50 text-red-800 border border-red-200" : "bg-green-50 text-green-800 border border-green-200"}`}>{error || notice}</p>}

      {activeTab === "live" && (
        <section className="mt-6">
          <div className="flex gap-2 mb-4"><input value={liveSearch} onChange={e => setLiveSearch(e.target.value)} placeholder="Search key or value..." className="flex-1 max-w-md border rounded-lg px-3 py-2 text-sm bg-white text-black" /><button onClick={() => setLiveSearch("")} className="border px-3 py-2 rounded text-sm bg-white">Clear</button></div>
          <div className="space-y-3">
            {liveLoading ? <p>Loading…</p> : filteredLive.map(r => (
              <div key={`${r.key}-${r.effectiveValue}`} className="border rounded-xl p-4 bg-white shadow-sm">
                <div className="flex flex-wrap justify-between gap-2"><span className="font-mono font-bold text-slate-900 text-sm">{r.key}</span><span className={`text-[10px] px-2 py-1 rounded font-bold h-fit ${r.source === "database" ? "bg-green-100 text-green-800 border border-green-200" : "bg-slate-100 text-slate-600"}`}>{r.source} {r.updatedBy ? `• by ${r.updatedBy.slice(0, 8)}` : ""}</span></div>
                {r.dbValue && r.envValue && r.dbValue !== r.envValue && <p className="text-[11px] mt-1 text-slate-500">DB: {r.dbValue.slice(0, 80)} | ENV: {r.envValue.slice(0, 80)}</p>}
                <div className="flex gap-2 mt-3">
                  <input id={`inp-${r.key}`} defaultValue={r.effectiveValue || ""} key={`inp-${r.key}-${r.effectiveValue}`} className="flex-1 border rounded-lg px-3 py-2 text-sm bg-white text-black font-mono" />
                  <button onClick={() => { const el = document.getElementById(`inp-${r.key}`) as HTMLInputElement; void saveLive(r.key, el.value); }} disabled={liveSavingKey === r.key} className="bg-black text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50 min-w-[90px]">{liveSavingKey === r.key ? "Saving…" : "Save Live"}</button>
                  <button onClick={() => void resetLive(r.key)} className="border px-3 py-2 rounded-lg text-xs bg-white text-slate-900">Reset</button>
                </div>
              </div>
            ))}
            {filteredLive.length === 0 && <p className="text-center p-8 text-slate-500">No keys match search</p>}
          </div>
        </section>
      )}

      {activeTab === "design" && (
        <section className="mt-6 border rounded-2xl p-6 bg-white max-w-6xl space-y-6 shadow-sm">
          <div className="flex flex-wrap justify-between gap-3 items-start">
            <div><h2 className="font-bold text-slate-900 text-xl">Global Design System — 22 Controls + Presets + Backup</h2><p className="text-xs text-slate-500 mt-1">Saves to localStorage + Backend DB (tmg_colors). All devices sync on load.</p></div>
            <div className="flex flex-wrap gap-2">
              <button onClick={exportDesign} className="border px-3 py-2 rounded-lg text-xs font-bold bg-white">📤 Export JSON</button>
              <button onClick={() => fileInputRef.current?.click()} className="border px-3 py-2 rounded-lg text-xs font-bold bg-white">📥 Import JSON</button>
              <input ref={fileInputRef} type="file" accept=".json" onChange={importDesign} className="hidden" />
              <button onClick={resetDesign} className="border px-3 py-2 rounded-lg text-xs font-bold bg-red-50 text-red-700">Reset to Default</button>
            </div>
          </div>
          {colorNotice && <p className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-800 font-bold text-sm">{colorNotice}</p>}

          <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-xl">
            <span className="text-xs font-bold text-slate-600 py-1">Presets:</span>
            {PRESETS.map(p => (
              <button key={p.name} onClick={() => { loadColorsToState({ ...getCurrentColors(), ...p.colors }); setNotice(`Preset ${p.name} loaded — click SAVE to apply`); }} className="px-3 py-1 rounded-full border text-xs bg-white hover:bg-black hover:text-white">{p.name}</button>
            ))}
          </div>

          <div><h3 className="font-bold bg-slate-100 p-2 rounded text-slate-900 text-sm">A. COLORS (8)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
              {[
                ["Primary", primary, setPrimary],
                ["Gold", gold, setGold],
                ["Page BG", bg, setBg],
                ["Card BG", cardBg, setCardBg],
                ["Header BG", headerBg, setHeaderBg],
                ["Footer BG", footerBg, setFooterBg],
                ["Text Color", textColor, setTextColor],
                ["Border", borderColor, setBorderColor],
              ].map(([label, val, setter]: any) => (
                <label key={label} className="text-xs text-slate-900 font-medium">{label}<div className="flex gap-1 mt-1"><input type="color" value={val} onChange={e => setter(e.target.value)} className="h-10 w-10 rounded border cursor-pointer" /><input value={val} onChange={e => setter(e.target.value)} className="flex-1 border rounded p-1 text-black text-xs font-mono" /></div></label>
              ))}
            </div>
          </div>

          <div><h3 className="font-bold bg-slate-100 p-2 rounded text-slate-900 text-sm">B. TYPOGRAPHY (6)</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-3">
              <label className="text-xs text-slate-900">Font Family<select value={fontFamily} onChange={e => setFontFamily(e.target.value)} className="block w-full border rounded-lg p-2 bg-white text-black mt-1"><option value="Arial, Helvetica, sans-serif">Arial</option><option value="Inter, sans-serif">Inter</option><option value="Georgia, serif">Georgia Serif</option><option value="JetBrains Mono, monospace">Monospace</option><option value="Poppins, sans-serif">Poppins</option></select></label>
              <label className="text-xs text-slate-900">Body Size<select value={fontSize} onChange={e => setFontSize(e.target.value)} className="block w-full border rounded-lg p-2 bg-white text-black mt-1"><option value="12px">12px</option><option value="14px">14px</option><option value="16px">16px</option><option value="18px">18px</option></select></label>
              <label className="text-xs text-slate-900">H1 Size<select value={h1Size} onChange={e => setH1Size(e.target.value)} className="block w-full border rounded-lg p-2 bg-white text-black mt-1"><option value="28px">28px</option><option value="36px">36px</option><option value="48px">48px</option><option value="60px">60px</option></select></label>
              <label className="text-xs text-slate-900">H2 Size<select value={h2Size} onChange={e => setH2Size(e.target.value)} className="block w-full border rounded-lg p-2 bg-white text-black mt-1"><option value="20px">20px</option><option value="24px">24px</option><option value="30px">30px</option></select></label>
              <label className="text-xs text-slate-900">H3 Size<select value={h3Size} onChange={e => setH3Size(e.target.value)} className="block w-full border rounded-lg p-2 bg-white text-black mt-1"><option value="16px">16px</option><option value="18px">18px</option><option value="22px">22px</option></select></label>
              <label className="text-xs text-slate-900">Line Height<select value={lineHeight} onChange={e => setLineHeight(e.target.value)} className="block w-full border rounded-lg p-2 bg-white text-black mt-1"><option value="1.4">1.4 Compact</option><option value="1.6">1.6 Normal</option><option value="1.8">1.8 Relaxed</option></select></label>
            </div>
          </div>

          <div><h3 className="font-bold bg-slate-100 p-2 rounded text-slate-900 text-sm">C. SIZING & LAYOUT (8)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
              <label className="text-xs text-slate-900">Button Radius<select value={buttonRadius} onChange={e => setButtonRadius(e.target.value)} className="block w-full border rounded-lg p-2 bg-white text-black mt-1"><option value="0px">Square 0</option><option value="6px">6px</option><option value="8px">8px</option><option value="12px">12px</option><option value="999px">Pill</option></select></label>
              <label className="text-xs text-slate-900">Card Radius<select value={cardRadius} onChange={e => setCardRadius(e.target.value)} className="block w-full border rounded-lg p-2 bg-white text-black mt-1"><option value="0px">0</option><option value="8px">8px</option><option value="12px">12px</option><option value="24px">24px</option></select></label>
              <label className="text-xs text-slate-900">Input Radius<select value={inputRadius} onChange={e => setInputRadius(e.target.value)} className="block w-full border rounded-lg p-2 bg-white text-black mt-1"><option value="8px">8px</option><option value="12px">12px</option><option value="24px">24px</option></select></label>
              <label className="text-xs text-slate-900">Border Width<select value={borderWidth} onChange={e => setBorderWidth(e.target.value)} className="block w-full border rounded-lg p-2 bg-white text-black mt-1"><option value="0px">None</option><option value="1px">1px</option><option value="2px">2px</option></select></label>
              <label className="text-xs text-slate-900">Input Height<select value={inputHeight} onChange={e => setInputHeight(e.target.value)} className="block w-full border rounded-lg p-2 bg-white text-black mt-1"><option value="36px">36px Small</option><option value="44px">44px Default</option><option value="52px">52px Large</option></select></label>
              <label className="text-xs text-slate-900">Button Height<select value={buttonHeight} onChange={e => setButtonHeight(e.target.value)} className="block w-full border rounded-lg p-2 bg-white text-black mt-1"><option value="36px">36px</option><option value="44px">44px</option><option value="52px">52px</option></select></label>
              <label className="text-xs text-slate-900">Container Max<select value={containerMax} onChange={e => setContainerMax(e.target.value)} className="block w-full border rounded-lg p-2 bg-white text-black mt-1"><option value="1024px">1024 Small</option><option value="1280px">1280 Default</option><option value="1536px">1536 Wide</option><option value="100%">100% Full</option></select></label>
              <label className="text-xs text-slate-900">Header Height<select value={headerHeight} onChange={e => setHeaderHeight(e.target.value)} className="block w-full border rounded-lg p-2 bg-white text-black mt-1"><option value="56px">56px</option><option value="64px">64px</option><option value="80px">80px</option></select></label>
            </div>
          </div>

          {/* Live Preview */}
          <div className="border rounded-xl p-4 bg-slate-50">
            <p className="text-xs font-bold mb-3">LIVE PREVIEW</p>
            <div className="flex gap-2 flex-wrap">
              <div style={{ background: primary, color: "white", borderRadius: buttonRadius, height: buttonHeight }} className="px-4 flex items-center text-sm font-bold">Primary Btn</div>
              <div style={{ background: gold, color: "black", borderRadius: buttonRadius, height: buttonHeight }} className="px-4 flex items-center text-sm font-bold">Gold Btn</div>
              <div style={{ background: cardBg, borderColor: borderColor, borderWidth: borderWidth, borderRadius: cardRadius }} className="px-4 py-2 border text-sm">Card sample</div>
            </div>
          </div>

          <button onClick={saveColors} type="button" disabled={saving} className="w-full rounded-xl bg-black px-6 py-4 font-bold text-white text-lg hover:bg-slate-800 disabled:opacity-50 shadow-lg">
            {saving ? "Saving to DB..." : "💾 SAVE & APPLY ALL 22 FIELDS — GLOBAL (DB + Local)"}
          </button>
          <p className="text-[11px] text-slate-400 text-center">Saves to tmg_colors key in DB + localStorage. Other admins will auto-load on next page visit.</p>
        </section>
      )}

      {activeTab === "upload" && (<section className="mt-8 max-w-2xl rounded-2xl border bg-white p-6 shadow-sm"><h2 className="font-bold text-slate-900 text-lg">Upload Limit</h2><p className="text-sm text-slate-500 mt-1">Max file size per project upload</p><form className="mt-5 flex gap-3" onSubmit={e => void saveSettings(e)}><input type="number" required min={1} max={2048} value={maximumMegabytes} onChange={e => setMaximumMegabytes(e.target.value)} className="w-32 rounded-lg border p-2.5 text-black bg-white" /><span className="py-2.5 text-sm">MB</span><button type="submit" disabled={saving} className="rounded-lg bg-black px-5 py-2.5 text-white text-sm font-bold disabled:opacity-50">{saving ? "Saving…" : "Save"}</button></form></section>)}

      {activeTab === "audit" && (
        <section className="mt-8 border rounded-2xl bg-white overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-50 border-b flex flex-wrap justify-between gap-3 items-center"><h2 className="font-bold text-slate-900">Audit Log — All Changes</h2><div className="flex gap-2"><input value={auditSearch} onChange={e => setAuditSearch(e.target.value)} placeholder="Search key, user, value..." className="border rounded-lg px-3 py-1.5 text-sm bg-white w-64" /><button onClick={() => void loadAudit()} className="text-xs border px-3 py-1.5 rounded-lg bg-white">Refresh</button></div></div>
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="p-3">Time</th><th className="p-3">Key</th><th className="p-3">Changed By</th><th className="p-3">Old → New</th></tr></thead><tbody>{filteredAudits.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-slate-500">No audits</td></tr>}{filteredAudits.map(a => (<tr key={a.id} className="border-t hover:bg-slate-50"><td className="p-3 text-xs whitespace-nowrap">{new Date(a.createdAt).toLocaleString()}</td><td className="p-3 font-mono font-bold text-slate-900 text-xs">{a.key}</td><td className="p-3 text-xs font-mono">{a.changedBy.slice(0, 12)}</td><td className="p-3 font-mono text-xs max-w-[400px]"><span className="text-red-500 line-through block truncate">{a.oldValue?.slice(0, 80) || "—"}</span><span className="text-green-600 block truncate font-bold">{a.newValue?.slice(0, 80)}</span></td></tr>))}</tbody></table></div>
        </section>
      )}
    </main>
  );
}