"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Puck, type Data } from "@measured/puck";
import { config } from "./config";
import "@measured/puck/puck.css";
import {
  Settings2, Trash2, Plus, Sparkles, UploadCloud, LayoutDashboard,
  ExternalLink, Loader2, ArrowRight, ChevronDown, BarChart3, Edit3, Monitor, Tablet, Smartphone,
  Check, CloudLightning, ChevronRight
} from "lucide-react";

type ViewportMode = "desktop" | "tablet" | "mobile";
type ActiveView = "dashboard" | "canvas";

interface Site {
  id: string;
  name: string;
  subdomain: string;
  domain?: string;
  status?: string;
  logoUrl?: string;
  pages?: SitePage[];
  settings?: { aiGenerated?: boolean; companyName?: string; industry?: string; tone?: string; initialHero?: unknown };
  headerData?: { logoUrl?: string; companyName?: string; menu?: Array<{ label: string; href: string }>; };
  footerData?: { aboutText?: string; phone?: string; email?: string; copyright?: string; };
}

interface SitePage {
  slug: string;
  title?: string;
  order: number;
  content?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSitePage(value: unknown): value is SitePage {
  return isRecord(value)
    && typeof value.slug === "string"
    && typeof value.order === "number"
    && (value.title === undefined || typeof value.title === "string");
}

function isSite(value: unknown): value is Site {
  return isRecord(value)
    && typeof value.id === "string"
    && typeof value.name === "string"
    && typeof value.subdomain === "string"
    && (value.pages === undefined || (Array.isArray(value.pages) && value.pages.every(isSitePage)));
}

function isPuckData(value: unknown): value is Data {
  return isRecord(value) && isRecord(value.root) && Array.isArray(value.content);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "An unexpected error occurred.";
}

const emptyCanvasData: Data = { root: {}, content: [] };

export default function PremiumWebbuilderEngine() {
  const router = useRouter();
  const params = useParams();
  const explicitSiteId = params?.siteId as string | undefined;

  const [activeView, setActiveView] = useState<ActiveView>(explicitSiteId ? "canvas" : "dashboard");
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(explicitSiteId || null);

  const [sites, setSites] = useState<Site[]>([]);
  const [name, setName] = useState("");
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showAiDrawer, setShowAiDrawer] = useState(false);
  const [aiCompanyName, setAiCompanyName] = useState("");
  const [aiIndustry, setAiIndustry] = useState("Corporate Consulting");
  const [aiTone, setAiTone] = useState("Professional");
  const [aiGenerating, setAiGenerating] = useState(false);

  const [settingsSite, setSettingsSite] = useState<Site | null>(null);
  const [activeTab, setActiveTab] = useState<"domain" | "header" | "footer">("domain");

  const [domainInput, setDomainInput] = useState("");
  const [propagationStatus, setPropagationStatus] = useState<"idle" | "checking" | "active" | "pending">("idle");
  const [propagationResult, setPropagationResult] = useState<{ error?: string; propagated?: boolean } | null>(null);
  const [logoUrl, setLogoUrl] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [menuItems, setMenuItems] = useState<Array<{ label: string; href: string }>>([]);
  const [footerAbout, setFooterAbout] = useState("");
  const [footerPhone, setFooterPhone] = useState("");
  const [footerEmail, setFooterEmail] = useState("");
  const [footerCopyright, setFooterCopyright] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [activeSite, setActiveSite] = useState<Site | null>(null);
  const [canvasData, setCanvasData] = useState<Data>(emptyCanvasData);
  const [loadingCanvas, setLoadingCanvas] = useState(Boolean(explicitSiteId));
  const [currentSlug, setCurrentSlug] = useState("home");
  const [savingStatus, setSavingStatus] = useState<"idle" | "saving" | "saved" | "error">("saved");
  const [viewport, setViewport] = useState<ViewportMode>("desktop");
  const [isAddPageOpen, setIsAddPageOpen] = useState(false);
  const [newPageSlug, setNewPageSlug] = useState("");
  const [newPageTitle, setNewPageTitle] = useState("");
  const [isPageDropdownOpen, setIsPageDropdownOpen] = useState(false);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getToken = useCallback((): string | null => {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem("accessToken") || localStorage.getItem("accessToken") || localStorage.getItem("token") || localStorage.getItem("access_token") || localStorage.getItem("authToken");
  }, []);

  const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/+$/, "").replace(/\/api$/, "") + "/api";
  const API_BASE = API.replace("/api", "");

  const apiFetch = useCallback(async (url: string, options: RequestInit = {}, overrideSiteId?: string): Promise<unknown> => {
    const token = getToken();
    const targetSiteId = overrideSiteId || selectedSiteId;
    const headers = new Headers(options.headers);
    headers.set("Content-Type", "application/json");
    if (token) headers.set("Authorization", `Bearer ${token}`);
    const targetUrl = targetSiteId ? `${API}/sites/${targetSiteId}${url}` : `${API}${url}`;
    const response = await fetch(targetUrl, { ...options, headers });
    if (response.status === 401) {
      localStorage.clear(); sessionStorage.clear();
      router.push(`/login?redirect=/builder/${targetSiteId || ""}`);
      throw new Error("Session expired");
    }
    if (!response.ok) { const text = await response.text(); throw new Error(`API Error ${response.status}: ${text}`); }
    const body: unknown = await response.json();
    return body;
  }, [selectedSiteId, router, API, getToken]);

  const fetchDashboardData = useCallback(async (): Promise<Site[]> => {
      const token = getToken();
      const res = await fetch(`${API}/sites`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`Could not load sites (${res.status}).`);
      const data: unknown = await res.json();
      if (!Array.isArray(data) || !data.every(isSite)) throw new Error("The sites response has an invalid shape.");
      return data;
  }, [API, getToken]);

  const loadDashboardData = useCallback(async () => {
    setLoadingDashboard(true);
    try {
      setSites(await fetchDashboardData());
    } catch (error) {
      console.error("Dashboard core connectivity broken:", error);
    } finally {
      setLoadingDashboard(false);
    }
  }, [fetchDashboardData]);

  useEffect(() => {
    if (activeView !== "dashboard") return;
    let active = true;
    void fetchDashboardData()
      .then((data) => { if (active) setSites(data); })
      .catch((error: unknown) => { if (active) console.error("Dashboard core connectivity broken:", error); })
      .finally(() => { if (active) setLoadingDashboard(false); });
    return () => { active = false; };
  }, [activeView, fetchDashboardData]);

  useEffect(() => {
    if (activeView !== "canvas" || !selectedSiteId) return;
    let active = true;
    void apiFetch("", {}, selectedSiteId)
      .then((response) => {
        if (!isSite(response)) throw new Error("The site response has an invalid shape.");
        const page = response.pages?.find((candidate) => candidate.slug === currentSlug)
          || response.pages?.find((candidate) => candidate.slug === "home")
          || response.pages?.[0];
        let content: unknown = page?.content;
        if (typeof content === "string") {
          try { content = JSON.parse(content) as unknown; }
          catch { throw new Error(`Page "${page?.slug ?? currentSlug}" contains invalid saved content.`); }
        }
        if (content === null || content === undefined) content = emptyCanvasData;
        if (Array.isArray(content)) content = { root: {}, content };
        if (!isPuckData(content)) throw new Error(`Page "${page?.slug ?? currentSlug}" has an invalid content structure.`);
        if (active) {
          setActiveSite(response);
          setCanvasData(content);
          if (page) setCurrentSlug(page.slug);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          console.error("Layout canvas recovery sync fault:", error);
          setSavingStatus("error");
        }
      })
      .finally(() => { if (active) setLoadingCanvas(false); });
    return () => { active = false; };
  }, [activeView, selectedSiteId, currentSlug, apiFetch]);

  const routeToCanvasStudio = (siteId: string) => { setLoadingCanvas(true); setSelectedSiteId(siteId); setCurrentSlug("home"); setActiveView("canvas"); };
  const routeToDashboard = () => { setLoadingDashboard(true); setActiveView("dashboard"); setSelectedSiteId(null); setActiveSite(null); };

  const createSiteInstance = async (withAi = false) => {
    const finalName = withAi ? aiCompanyName : name;
    if (!finalName) return alert("Please enter an enterprise project name.");
    setCreating(true);
    let settings: NonNullable<Site["settings"]> = { industry: withAi ? aiIndustry : "Corporate Consulting", tone: withAi ? aiTone : "Professional" };
    try {
      const token = getToken();
      if (withAi) {
        setAiGenerating(true);
        try {
          const aiRes = await fetch(`${API}/ai/generate-layout`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ companyName: aiCompanyName, industry: aiIndustry, tone: aiTone, targetAudience: "General Public & Business Owners in Qatar", componentType: "hero" })
          });
          if (aiRes.ok) {
            const aiOutput: unknown = await aiRes.json();
            settings = { aiGenerated: true, companyName: aiCompanyName, industry: aiIndustry, tone: aiTone, initialHero: aiOutput };
          }
        } catch (e) { console.error("AI pre-compilation error", e); }
        finally { setAiGenerating(false); }
      }
      const res = await fetch(`${API}/sites`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ name: finalName, settings }) });
      const siteData: unknown = await res.json();
      if (!res.ok) {
        const message = isRecord(siteData) && typeof siteData.message === "string" ? siteData.message : "Could not create site.";
        throw new Error(message);
      }
      if (!isSite(siteData)) throw new Error("The created site response has an invalid shape.");
      setName(""); setAiCompanyName(""); setShowAiDrawer(false);
      routeToCanvasStudio(siteData.id);
    } catch (err: unknown) { alert(errorMessage(err)); }
    finally { setCreating(false); setAiGenerating(false); }
  };

  const deleteSite = async (siteId: string) => {
    if (!confirm("Delete this site? This cannot be undone.")) return;
    try {
      const token = getToken();
      const res = await fetch(`${API}/sites/${siteId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Delete failed");
      loadDashboardData();
    } catch (e: unknown) { alert(errorMessage(e)); }
  };

  const triggerDebouncedAutoSave = useCallback((newData: Data, slug: string) => {
    setSavingStatus("saving");
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await apiFetch(`/pages/${slug}`, { method: "PUT", body: JSON.stringify({ content: newData }) });
        setSavingStatus("saved");
      } catch (e) { console.error("Asynchronous file payload stream broken:", e); setSavingStatus("error"); }
    }, 1200);
  }, [apiFetch]);

  const handleCanvasChange = (newData: Data) => { setCanvasData(newData); triggerDebouncedAutoSave(newData, currentSlug); };

  const handleProductionPublishPipeline = async () => {
    setSavingStatus("saving");
    try {
      await apiFetch(`/pages/${currentSlug}`, { method: "PUT", body: JSON.stringify({ content: canvasData }) });
      await apiFetch("/publish", { method: "PUT", body: JSON.stringify({ content: canvasData }) });
      setSavingStatus("saved");
      alert(`Project node deployment structural release live for /s/${activeSite?.subdomain}`);
    } catch (e: unknown) { alert("Deployment configuration error: " + errorMessage(e)); setSavingStatus("error"); }
  };

  const handleAddNewRouteSegment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPageSlug || !selectedSiteId) return;
    const cleanSlug = newPageSlug.toLowerCase().replace(/[^a-z0-9-]/g, "-");
    const displayTitle = newPageTitle || newPageSlug;
    try {
      await apiFetch(`/pages/${cleanSlug}`, {
        method: "PUT",
        body: JSON.stringify({
          content: { root: { props: { siteName: activeSite?.name } }, content: [{ type: "Heading", props: { id: "h1", text: displayTitle.toUpperCase(), level: "h1", align: "center" } }] },
          meta: { title: displayTitle }
        })
      });
      setIsAddPageOpen(false); setNewPageSlug(""); setNewPageTitle(""); setLoadingCanvas(true); setCurrentSlug(cleanSlug);
    } catch (e: unknown) { alert(errorMessage(e)); }
  };

  const handlePurgeRouteSegment = async () => {
    if (currentSlug === "home" || !selectedSiteId) return;
    if (!confirm(`Are you sure you want to delete the route '/${currentSlug}'?`)) return;
    try { await apiFetch(`/pages/${currentSlug}`, { method: "DELETE" }); setLoadingCanvas(true); setCurrentSlug("home"); }
    catch (e: unknown) { alert(errorMessage(e)); }
  };

  const openSettingsGrid = (site: Site) => {
    setSettingsSite(site); setActiveTab("domain");
    setPropagationStatus("idle"); setPropagationResult(null);
    setDomainInput(site.domain || ""); setLogoUrl(site.logoUrl || site.headerData?.logoUrl || "");
    setCompanyName(site.headerData?.companyName || site.name || "");
    setMenuItems(site.headerData?.menu || [{ label: "Home", href: "/" }, { label: "About", href: "/about" }]);
    setFooterAbout(site.footerData?.aboutText || ""); setFooterPhone(site.footerData?.phone || ""); setFooterEmail(site.footerData?.email || ""); setFooterCopyright(site.footerData?.copyright || `© ${new Date().getFullYear()} ${site.name}`);
  };

  const handleLogoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !settingsSite) return;
    if (file.size > 5 * 1024 * 1024) return alert("Max limit payload reached: 5MB");
    setUploadingLogo(true);
    try {
      const token = getToken(); const form = new FormData(); form.append("file", file);
      const res = await fetch(`${API}/sites/${settingsSite.id}/logo-upload`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form });
      const out = await res.json();
      if (!res.ok) throw new Error(out.message || "Asset file streaming exception");
      setLogoUrl(out.url); loadDashboardData();
    } catch (err: unknown) { alert("Upload failed: " + errorMessage(err)); }
    finally { setUploadingLogo(false); }
  };

  const saveDomain = async () => {
    if (!domainInput || !settingsSite) return alert("Please enter a custom destination host name.");
    setSaving(true);
    try {
      const token = getToken();
      const res = await fetch(`${API}/sites/${settingsSite.id}/domain`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ domain: domainInput }) });
      const out = await res.json();
      if (!res.ok) throw new Error(out.message || "Proxy routing mapping validation failure.");
      alert("Domain mapping applied. Point a CNAME record to: tmgbusinessconsulting.com");
      loadDashboardData(); setSettingsSite({ ...settingsSite, domain: domainInput });
      setPropagationStatus("idle");
      setPropagationResult(null);
    } catch (e: unknown) { alert(errorMessage(e)); } finally { setSaving(false); }
  };

  const checkPropagation = async () => {
    if (!settingsSite) return;
    setPropagationStatus("checking");
    try {
      const token = getToken();
      const res = await fetch(`${API}/sites/${settingsSite.id}/verify-domain`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const out: { propagated?: boolean } = await res.json();
      setPropagationResult(out);
      setPropagationStatus(out.propagated ? "active" : "pending");
    } catch (e: unknown) {
      setPropagationStatus("pending");
      setPropagationResult({ error: errorMessage(e) });
    }
  };

  const saveHeader = async () => {
    if (!settingsSite) return; setSaving(true);
    try {
      const token = getToken();
      const res = await fetch(`${API}/sites/${settingsSite.id}/header`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ headerData: { logoUrl, companyName, menu: menuItems }, logoUrl }) });
      if (!res.ok) throw new Error("Header layout mapping compilation broke.");
      alert("Header config metrics active."); loadDashboardData();
    } catch (e: unknown) { alert(errorMessage(e)); } finally { setSaving(false); }
  };

  const saveFooter = async () => {
    if (!settingsSite) return; setSaving(true);
    try {
      const token = getToken();
      const res = await fetch(`${API}/sites/${settingsSite.id}/footer`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ footerData: { aboutText: footerAbout, phone: footerPhone, email: footerEmail, copyright: footerCopyright } }) });
      const out = await res.json();
      if (!res.ok) throw new Error(out.message || "Footer sync lifecycle failure.");
      alert("Footer configurations synchronized."); loadDashboardData();
    } catch (e: unknown) { alert(errorMessage(e)); } finally { setSaving(false); }
  };

  const handleUpdateMenuItem = (index: number, key: "label" | "href", value: string) => { const updated = [...menuItems]; updated[index][key] = value; setMenuItems(updated); };
  const getLogoSrc = (url: string) => { if (!url) return ""; if (url.startsWith("/uploads")) return `${API_BASE}${url}`; return url; };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans antialiased">
      <header className="h-14 border-b border-zinc-800 bg-zinc-900 flex justify-between items-center px-4 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-white text-black flex items-center justify-center font-black text-xs">TMG</div>
            <span className="font-bold text-sm tracking-tight">Management Console</span>
          </Link>
          {activeView === "canvas" && activeSite && <><ChevronRight className="h-4 w-4 text-zinc-600" /><span className="text-sm text-zinc-300">{activeSite.name}</span></>}
        </div>
        <div className="flex items-center gap-2">
          {activeView === "canvas" && <button onClick={routeToDashboard} className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-medium transition">Exit Studio</button>}
          <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Edge Pipeline Live</span>
        </div>
      </header>

      {activeView === "dashboard" && (
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Project Portals</h1>
              <p className="text-xs text-zinc-500 mt-1">Deploy, monitor cloud routing tables, and design next-generation layouts.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enterprise project label..." className="w-full sm:w-64 bg-zinc-900 border border-zinc-800 focus:border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 outline-none transition" />
              <button onClick={() => createSiteInstance(false)} disabled={creating} className="flex items-center gap-1.5 bg-zinc-100 hover:bg-white text-zinc-950 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition shadow-sm whitespace-nowrap disabled:opacity-40">
                {creating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />} Standard Build
              </button>
              <button onClick={() => setShowAiDrawer(!showAiDrawer)} className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-95 text-white px-4 py-2 rounded-xl text-xs font-semibold tracking-wide shadow-lg shadow-indigo-600/20 transition whitespace-nowrap">
                <Sparkles className="h-3 w-3" /> Core AI Creator
              </button>
            </div>
          </div>

          {loadingDashboard ? (
            <div className="py-20 text-center text-zinc-500 text-sm flex flex-col items-center gap-2"><Loader2 className="h-6 w-6 animate-spin" /> Querying network configurations...</div>
          ) : sites.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-zinc-800 rounded-2xl">
              <LayoutDashboard className="h-8 w-8 mx-auto text-zinc-600 mb-3" />
              <p className="font-semibold">No sites deployed</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">Initialize a project structure manually or unleash the custom TMG generative engine layout blueprint.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sites.map((s) => (
                <div key={s.id} className="border border-zinc-800 bg-zinc-900 rounded-2xl p-4 flex flex-col gap-3 hover:border-zinc-700 transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-sm">{s.name}</h3>
                      <p className="text-[11px] font-mono text-zinc-500">{s.subdomain}.tmgbuild.com</p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide uppercase border ${s.status === "PUBLISHED" ? "bg-emerald-500/5 text-emerald-400 border-emerald-500/20" : "bg-zinc-800 text-zinc-400 border-zinc-700/60"}`}>{s.status || "Draft"}</span>
                  </div>
                  {s.domain && <p className="text-[11px] text-blue-400">Custom Routing: {s.domain}</p>}
                  {s.settings?.aiGenerated && <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 w-fit"><Sparkles className="h-3 w-3" /> AI Synthesis Node</span>}
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button onClick={() => routeToCanvasStudio(s.id)} className="flex items-center justify-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-xl text-xs font-semibold transition"><Edit3 className="h-3 w-3" /> Studio</button>
                    <a href={`/s/${s.subdomain}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 px-3 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold transition">View <ExternalLink className="h-3 w-3" /></a>
                    <a href={`/s/${s.subdomain}`} target="_blank" className="flex items-center justify-center gap-1.5 px-3 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-medium transition"><BarChart3 className="h-3 w-3" /> Analytics</a>
                    <button onClick={() => openSettingsGrid(s)} className="flex items-center justify-center gap-1.5 px-3 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-xl text-xs font-medium transition"><Settings2 className="h-3 w-3" /> Parameters</button>
                    <button onClick={() => deleteSite(s.id)} className="col-span-2 py-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-500/5 rounded-lg text-[11px] font-medium transition tracking-wide text-center">Purge Server Stack Reference Node</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeView === "canvas" && (
        <div className="h-[calc(100vh-56px)] flex flex-col bg-zinc-950">
          <div className="h-12 border-b border-zinc-800 bg-zinc-900 flex justify-between items-center px-3">
            <div className="flex items-center gap-2">
              <div className="relative">
                <button onClick={() => setIsPageDropdownOpen(!isPageDropdownOpen)} className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700/80 rounded-lg text-xs font-medium border border-zinc-700/50 transition">
                  <span className="text-zinc-400">Active Segment:</span> {currentSlug} <ChevronDown className="h-3 w-3" />
                </button>
                {isPageDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsPageDropdownOpen(false)} />
                    <div className="absolute left-0 mt-1.5 w-56 rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl p-1.5 z-20">
                      {[...(activeSite?.pages ?? [])].sort((a, b) => a.order - b.order).map((p) => (
                        <button key={p.slug} onClick={() => { setLoadingCanvas(true); setCurrentSlug(p.slug); setIsPageDropdownOpen(false); }} className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left text-xs transition ${currentSlug === p.slug ? "bg-blue-600/10 text-blue-400 font-medium" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"}`}>
                          {p.title || p.slug} {currentSlug === p.slug && <Check className="h-3 w-3" />}
                        </button>
                      ))}
                      <div className="h-[1px] bg-zinc-800 my-1" />
                      <button onClick={() => { setIsAddPageOpen(true); setIsPageDropdownOpen(false); }} className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-xs text-blue-400 hover:bg-blue-500/10 font-medium transition"><Plus className="h-3 w-3" /> Add Custom Route</button>
                    </div>
                  </>
                )}
              </div>
              {currentSlug !== "home" && <button onClick={handlePurgeRouteSegment} className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"><Trash2 className="h-4 w-4" /></button>}
            </div>

            <div className="hidden md:flex items-center bg-zinc-950 p-1 rounded-lg border border-zinc-800/80">
              <button onClick={() => setViewport("desktop")} className={`p-1.5 rounded-md transition ${viewport === "desktop" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"}`}><Monitor className="h-4 w-4" /></button>
              <button onClick={() => setViewport("tablet")} className={`p-1.5 rounded-md transition ${viewport === "tablet" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"}`}><Tablet className="h-4 w-4" /></button>
              <button onClick={() => setViewport("mobile")} className={`p-1.5 rounded-md transition ${viewport === "mobile" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"}`}><Smartphone className="h-4 w-4" /></button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                {savingStatus === "saving" && <Loader2 className="h-3 w-3 animate-spin" />}
                {savingStatus === "saved" && <Check className="h-3 w-3 text-green-500" />}
                {savingStatus === "saving" ? "syncing..." : savingStatus}
              </span>
              <a href={`/s/${activeSite?.subdomain}${currentSlug === "home" ? "" : "/" + currentSlug}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition">Preview <ExternalLink className="h-3 w-3" /></a>
              <button onClick={handleProductionPublishPipeline} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-white text-black text-xs font-bold hover:bg-zinc-100 transition"><CloudLightning className="h-3.5 w-3.5" /> Ship Live</button>
            </div>
          </div>

          <div className="flex-1 flex justify-center bg-zinc-950 overflow-auto">
            {loadingCanvas ? (
              <div className="flex flex-col items-center justify-center gap-2 text-zinc-500 text-sm py-20"><Loader2 className="h-6 w-6 animate-spin" /> Restructuring Layout Node...</div>
            ) : (
              <div className="h-full w-full transition-all duration-300 ease-in-out bg-white" style={{ maxWidth: viewport === "desktop" ? "100%" : viewport === "tablet" ? "768px" : "390px", borderLeft: viewport !== "desktop" ? "1px solid rgba(63,63,70,0.4)" : "none", borderRight: viewport !== "desktop" ? "1px solid rgba(63,63,70,0.4)" : "none", boxShadow: viewport !== "desktop" ? "0 25px 50px -12px rgba(0,0,0,0.7)" : "none" }}>
                <Puck config={config} data={canvasData} onPublish={handleProductionPublishPipeline} onChange={handleCanvasChange} />
              </div>
            )}
          </div>
        </div>
      )}

      {showAiDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !aiGenerating && setShowAiDrawer(false)} />
          <div className="relative w-full max-w-sm bg-zinc-900 border-l border-zinc-800 p-6 flex flex-col gap-5 overflow-auto">
            <div>
              <h3 className="font-bold flex items-center gap-2"><Sparkles className="h-4 w-4 text-purple-400" /> AI Architecture Synthesis Suite</h3>
              <p className="text-[11px] text-zinc-500 mt-1">Define design targets to auto-construct backend document schemas seamlessly.</p>
            </div>
            <div className="space-y-3">
              <div><label className="text-[11px] text-zinc-400">Business Name</label><input type="text" value={aiCompanyName} onChange={(e) => setAiCompanyName(e.target.value)} placeholder="e.g. Al Mansour Consulting" className="mt-1 w-full bg-zinc-900 border border-zinc-800 focus:border-purple-500 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-600 outline-none transition" disabled={aiGenerating} /></div>
              <div><label className="text-[11px] text-zinc-400">Market Vertical Sector</label><select value={aiIndustry} onChange={(e) => setAiIndustry(e.target.value)} className="mt-1 w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 outline-none transition" disabled={aiGenerating}><option>Corporate Consulting</option><option>Construction</option><option>Trading</option><option>Technology</option><option>Real Estate</option><option>Logistics</option><option>Healthcare</option></select></div>
              <div><label className="text-[11px] text-zinc-400">Brand Tone Profile</label><select value={aiTone} onChange={(e) => setAiTone(e.target.value)} className="mt-1 w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 outline-none transition" disabled={aiGenerating}><option>Professional</option><option>Friendly</option><option>Bold</option><option>Luxury</option></select></div>
            </div>
            {aiGenerating && <div className="flex items-center gap-2 text-[11px] text-purple-300"><Loader2 className="h-3 w-3 animate-spin" /> Assembling content maps and instantiating custom production framework metrics...</div>}
            <div className="flex gap-2 mt-auto">
              <button type="button" onClick={() => setShowAiDrawer(false)} disabled={aiGenerating || creating} className="flex-1 py-2 bg-transparent hover:bg-zinc-900 border border-transparent hover:border-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-semibold rounded-xl transition">Cancel</button>
              <button type="button" onClick={() => createSiteInstance(true)} disabled={aiGenerating || creating} className="flex-1 py-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:opacity-95 text-white text-xs font-semibold rounded-xl tracking-wide shadow-lg shadow-purple-600/10 flex items-center justify-center gap-1.5 transition disabled:opacity-50">{creating ? "Deploying..." : "Assemble Platform"} <ArrowRight className="h-3 w-3" /></button>
            </div>
          </div>
        </div>
      )}

      {settingsSite && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSettingsSite(null)} />
          <div className="relative w-full max-w-md bg-zinc-900 border-l border-zinc-800 flex flex-col">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-start">
              <div><h3 className="font-bold text-sm">Parameter Matrix Setup</h3><p className="text-[11px] text-zinc-500 mt-1">Configuring Instance Node: {settingsSite.name}</p></div>
              <button onClick={() => setSettingsSite(null)} className="text-xs px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-200 transition">Close</button>
            </div>
            <div className="flex border-b border-zinc-800">
              {(["domain", "header", "footer"] as const).map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-3 text-xs font-medium border-b-2 capitalize transition ${activeTab === tab ? "border-blue-500 text-blue-400 font-semibold" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}>{tab} Layer</button>
              ))}
            </div>
            <div className="flex-1 overflow-auto p-5 space-y-5">
              {activeTab === "domain" && (
                <div className="space-y-4">
                  <div><h4 className="text-xs font-semibold">DNS Infrastructure Mapping</h4><p className="text-[11px] text-zinc-500">Route custom root web domains securely into cluster networks.</p></div>
                  <div><label className="text-[11px] text-zinc-400">Target Hostname String</label><div className="flex gap-2 mt-1"><input type="text" value={domainInput} onChange={(e) => setDomainInput(e.target.value)} placeholder="yourdomain.qa" className="flex-1 bg-zinc-900 border border-zinc-800 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs font-mono text-zinc-100 placeholder-zinc-600 outline-none transition" /><button onClick={saveDomain} disabled={saving} className="px-4 py-2 bg-white text-black rounded-xl text-xs font-bold">{saving ? "Syncing..." : "Apply"}</button></div></div>
                  {settingsSite.domain && <button type="button" onClick={checkPropagation} disabled={propagationStatus === "checking"} className="px-4 py-2 border border-zinc-700 rounded-xl text-xs font-semibold disabled:opacity-50">{propagationStatus === "checking" ? "Checking DNS..." : "Verify DNS propagation"}</button>}
                  {propagationStatus !== "idle" && <p role={propagationResult?.error ? "alert" : "status"} className={`text-xs ${propagationStatus === "active" ? "text-emerald-400" : "text-amber-400"}`}>{propagationResult?.error ?? (propagationStatus === "active" ? "DNS points to the configured target." : "DNS target has not propagated yet.")}</p>}
                  <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-[11px] text-zinc-400"><p>Required DNS Pointer:</p><p>Type: CNAME</p><p>Host: @ or subdomain</p><p>Target: tmgbusinessconsulting.com</p></div>
                </div>
              )}
              {activeTab === "header" && (
                <div className="space-y-4">
                  <div><label className="text-[11px] text-zinc-400">Corporate Identity Logotype</label><div className="mt-2 flex items-center gap-3">{logoUrl ? <Image src={getLogoSrc(logoUrl)} alt="logo" width={48} height={48} unoptimized className="h-12 w-12 rounded-lg object-cover border border-zinc-800" /> : <div className="h-12 w-12 rounded-lg bg-zinc-800 flex items-center justify-center"><UploadCloud className="h-5 w-5 text-zinc-500" /></div>}<label className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-medium cursor-pointer transition"><input type="file" accept="image/*" className="hidden" onChange={handleLogoFileUpload} />Upload</label>{uploadingLogo && <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />}</div><input type="text" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="Direct Logo Image URL" className="mt-2 w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs font-mono text-zinc-100 outline-none transition" /></div>
                  <div><label className="text-[11px] text-zinc-400">Company Brand Display Name</label><input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Text branding value..." className="mt-1 w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 outline-none transition" /></div>
                  <div><div className="flex justify-between items-center"><label className="text-[11px] text-zinc-400">Navigation Framework Segments</label><button type="button" onClick={() => setMenuItems([...menuItems, { label: "New Route Link", href: "/route" }])} className="text-[11px] text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 transition"><Plus className="h-3 w-3" /> Add Segment</button></div><div className="space-y-2 mt-2">{menuItems.map((item, idx) => (<div key={idx} className="flex gap-2"><input type="text" value={item.label} onChange={(e) => handleUpdateMenuItem(idx, "label", e.target.value)} placeholder="Label" className="w-1/3 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 outline-none" /><input type="text" value={item.href} onChange={(e) => handleUpdateMenuItem(idx, "href", e.target.value)} placeholder="Route" className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-300 outline-none" /><button type="button" onClick={() => setMenuItems(menuItems.filter((_, i) => i !== idx))} className="text-zinc-600 hover:text-red-400 p-1 transition"><Trash2 className="h-3 w-3" /></button></div>))}</div></div>
                  <button onClick={saveHeader} disabled={saving} className="w-full py-2 bg-white text-black rounded-xl text-xs font-bold">{saving ? "Saving..." : "Commit Header Architecture updates"}</button>
                </div>
              )}
              {activeTab === "footer" && (
                <div className="space-y-4">
                  <div><label className="text-[11px] text-zinc-400">Corporate Overview Abstract</label><textarea value={footerAbout} onChange={(e) => setFooterAbout(e.target.value)} placeholder="Brief summary..." rows={3} className="mt-1 w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 outline-none transition resize-none" /></div>
                  <div className="grid grid-cols-2 gap-2"><input value={footerPhone} onChange={(e) => setFooterPhone(e.target.value)} placeholder="Contact Telephone Line" className="border p-3 bg-zinc-900 border-zinc-800 rounded-xl text-xs outline-none" /><input value={footerEmail} onChange={(e) => setFooterEmail(e.target.value)} placeholder="Support Email Address" className="border p-3 bg-zinc-900 border-zinc-800 rounded-xl text-xs outline-none" /></div>
                  <input value={footerCopyright} onChange={(e) => setFooterCopyright(e.target.value)} placeholder="Copyright statement info..." className="border p-3 bg-zinc-900 border-zinc-800 rounded-xl text-xs w-full outline-none" />
                  <button onClick={saveFooter} disabled={saving} className="w-full py-2 bg-white text-black rounded-xl text-xs font-bold">{saving ? "Saving..." : "Commit Footer Layout parameters"}</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isAddPageOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsAddPageOpen(false)} />
          <form onSubmit={handleAddNewRouteSegment} className="relative w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <h3 className="text-sm font-semibold text-white mb-1">Initialize New Route Segment</h3>
            <p className="text-[11px] text-zinc-500 mb-4">Create a unique pathway for your page layout structure.</p>
            <div className="space-y-4">
              <div><label className="text-[11px] text-zinc-400">Route URL Slug</label><input type="text" value={newPageSlug} onChange={(e) => setNewPageSlug(e.target.value)} placeholder="e.g. services-pricing" className="mt-1 w-full bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded-lg px-3 py-2 text-xs font-mono text-zinc-100 outline-none transition" required /></div>
              <div><label className="text-[11px] text-zinc-400">SEO Page Title</label><input type="text" value={newPageTitle} onChange={(e) => setNewPageTitle(e.target.value)} placeholder="e.g. Corporate Strategy Core" className="mt-1 w-full bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-zinc-100 outline-none transition" /></div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button type="button" onClick={() => setIsAddPageOpen(false)} className="px-3 py-2 bg-transparent hover:bg-zinc-800 rounded-lg text-xs font-medium text-zinc-400 transition">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-white text-black rounded-lg text-xs font-bold hover:bg-zinc-100 transition">Create Segment</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
