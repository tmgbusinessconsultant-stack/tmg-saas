'use client';
import { useEffect, useState, use, useCallback, useRef } from 'react';
import { Puck, Data } from '@measured/puck';
import '@measured/puck/puck.css';
import { config } from './config';

interface PageMetadata {
  title: string;
  seoTitle?: string;
  description: string;
  seoDesc?: string;
  slug: string;
  schemaVersion?: number;
}
interface ExtendedData extends Data { meta?: PageMetadata; }

export default function BuilderPage({ params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = use(params);
  const [currentPage, setCurrentPage] = useState("home");
  const [pages, setPages] = useState<string[]>(["home"]);
  const [data, setData] = useState<ExtendedData>({ content: [], root: { props: config.root.defaultProps } });
  const [allData, setAllData] = useState<Record<string, ExtendedData>>({});
  const [loading, setLoading] = useState(true);
  const [newPageName, setNewPageName] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [aiCompanyName, setAiCompanyName] = useState("");
  const [aiIndustry, setAiIndustry] = useState("Corporate Consulting");
  const [aiTone, setAiTone] = useState("Professional");
  const [showAiDrawer, setShowAiDrawer] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const latestDataRef = useRef<ExtendedData>(data);
  useEffect(() => { latestDataRef.current = data; }, [data]);

  const apiFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers };
    const response = await fetch(`http://localhost:4000/api/sites/${siteId}${url}`, { ...options, headers });
    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
    return response.json();
  }, [siteId]);

  useEffect(() => {
    setLoading(true);
    apiFetch('').then(site => {
      const pNames = site.pages?.map((p: any) => p.slug) || ["home"];
      setPages(pNames);
      const map: Record<string, ExtendedData> = {};
      site.pages?.forEach((p: any) => {
        let c = p.content;
        if (typeof c === 'string') { try { c = JSON.parse(c); } catch { c = { content: [], root: { props: config.root.defaultProps } }; } }
        const normalized = c ? (Array.isArray(c) ? { content: c, root: { props: config.root.defaultProps } } : c) : { content: [], root: { props: config.root.defaultProps } };
        map[p.slug] = {
          ...normalized,
          meta: {
            title: p.title || p.slug,
            seoTitle: p.seoTitle || p.title || p.slug,
            description: p.description || '',
            seoDesc: p.seoDesc || p.description || '',
            slug: p.slug,
            schemaVersion: p.schemaVersion || 2
          }
        };
      });
      setAllData(map);
      const home = map["home"] || { content: [], root: { props: config.root.defaultProps }, meta: { title: 'Home', seoTitle: 'Home - Best Business in Qatar', description: '', seoDesc: '', slug: 'home', schemaVersion: 2 } };
      setData(home);
      if (site.name) setAiCompanyName(site.name);
    }).catch(err => console.error("Initial load failed:", err)).finally(() => setLoading(false));
  }, [apiFetch]);

  const switchPage = (slug: string) => {
    if (slug === currentPage) return;
    const currentSnapshot = latestDataRef.current;
    setAllData(prev => {
      const updated = { ...prev, [currentPage]: currentSnapshot };
      const nextData = updated[slug] || { content: [], root: { props: config.root.defaultProps }, meta: { title: slug, seoTitle: slug, description: '', seoDesc: '', slug, schemaVersion: 2 } };
      setData(nextData);
      setCurrentPage(slug);
      return updated;
    });
  };

  // ULTIMATE SAVE - sends seoTitle + seoDesc + schemaVersion 2
  const save = async (newData: ExtendedData) => {
    setSaveStatus('saving');
    try {
      const meta = newData.meta || latestDataRef.current?.meta;
      const payload = {
        data: newData,
        content: newData.content,
        root: newData.root,
        title: meta?.title || currentPage,
        seoTitle: meta?.seoTitle || meta?.title || currentPage,
        seoDesc: meta?.seoDesc || meta?.description || '',
        description: meta?.description || '',
        schemaVersion: 2,
        meta: { ...meta, schemaVersion: 2 }
      };
      setData(newData);
      setAllData(prev => ({ ...prev, [currentPage]: newData }));
      await apiFetch(`/pages/${currentPage}`, { method: 'PUT', body: JSON.stringify(payload) });
      setSaveStatus('saved');
    } catch (e) { setSaveStatus('error'); console.error(e); }
  };

  const addPage = async () => {
    let slug = newPageName.toLowerCase().replace(/\s+/g, '-').trim();
    if (!slug || pages.includes(slug)) return;
    const freshSchema: ExtendedData = { content: [], root: { props: config.root.defaultProps }, meta: { title: newPageName, seoTitle: newPageName, description: '', seoDesc: '', slug, schemaVersion: 2 } };
    try {
      await apiFetch(`/pages/${slug}`, { method: 'PUT', body: JSON.stringify(freshSchema) });
      const currentSnapshot = latestDataRef.current;
      setAllData(prev => ({ ...prev, [currentPage]: currentSnapshot, [slug]: freshSchema }));
      setPages(prev => [...prev, slug]); setCurrentPage(slug); setData(freshSchema); setNewPageName(""); setShowAdd(false);
    } catch (err) { alert("Failed to add page."); }
  };

  const deletePage = async (slug: string) => {
    if (slug === 'home') return alert("Cannot delete home"); if (!confirm(`Delete /${slug}?`)) return;
    try { await apiFetch(`/pages/${slug}`, { method: 'DELETE' }); const nextPages = pages.filter(p => p !== slug); setPages(nextPages); if (currentPage === slug) { setCurrentPage('home'); setData(allData['home']); } } catch (err) { alert("Failed to delete."); }
  };

  const publish = async () => {
    try { await save(latestDataRef.current); await apiFetch('/publish', { method: 'PUT' }); alert('🚀 Production bundle built! SEO + schemaVersion 2 live'); } catch (e) { alert('Publish failed.'); }
  };

  // === ULTIMATE AI ENGINE - FIXED CardGrid ===
  const executeAiLayoutSync = async (type: 'hero' | 'features' | 'full') => {
    if (!aiCompanyName.trim()) return alert("Enter company name");
    setAiGenerating(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:4000/api/ai/generate-layout', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ companyName: aiCompanyName, industry: aiIndustry, tone: aiTone, targetAudience: 'General Public & Business Owners in Qatar', componentType: type })
      });
      if (!res.ok) throw new Error('AI endpoint failed');
      const aiOutput = await res.json();
      const current = latestDataRef.current;

      if (type === 'hero' || type === 'full') {
        const heroBlocks = [
          { type: "Hero", props: { id: `ai_hero_${Date.now()}`, title: aiOutput.heading || aiOutput.title || `Welcome to ${aiCompanyName}`, subtitle: aiOutput.subtext || aiOutput.description || `Leading ${aiIndustry} solutions in Qatar — Professional & Trusted`, ctaText: aiOutput.ctaText || "Get Free Consultation", ctaLink: "/contact", bg: "#0a2540" } },
        ];
        const updated: ExtendedData = { ...current, content: [...heroBlocks, ...(current.content || [])] };
        await save(updated);
      }
      if (type === 'features' || type === 'full') {
        const featureItems = aiOutput.features || aiOutput.items || [];
        // FIXED: CardGrid expects itemsJson string + sectionTitle
        const items = featureItems.length ? featureItems : [
          { title: `${aiIndustry} Setup`, desc: `End-to-end ${aiIndustry} formation in Qatar`, icon: "🏢" },
          { title: "PRO & Licensing", desc: "Ministry approvals, visas, compliance", icon: "📑" },
          { title: "Growth Strategy", desc: "Market entry & local partnership", icon: "🚀" }
        ];
        const featuresBlock = {
          type: "CardGrid",
          props: { id: `ai_feat_${Date.now()}`, title: `Why ${aiCompanyName}`, itemsJson: JSON.stringify(items, null, 2) }
        };
        const base = type === 'full' ? latestDataRef.current : current;
        const updated: ExtendedData = { ...base, content: [...(base.content || []), featuresBlock, { type: "Spacer", props: { id: `sp_${Date.now()}`, height: "h-12" } }] };
        await save(updated);
      }
      setShowAiDrawer(false);
    } catch (err: any) { alert("AI failed: " + err.message); } finally { setAiGenerating(false); }
  };

  if (loading) return <div className='p-10 font-medium text-gray-600 animate-pulse'>Initialising TMG Engine v2...</div>;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: (data?.root?.props as any)?.bg || "#fff" }}>
      <div className='flex justify-between items-center px-4 py-3 bg-white border-b sticky top-0 z-50 flex-wrap gap-4 shadow-sm'>
        <div className='flex gap-3 items-center flex-wrap'>
          <span className='font-extrabold tracking-tight text-lg text-slate-900 border-r pr-3'>TMG Builder Pro v2</span>
          <div className="flex gap-1.5 bg-slate-100 p-1 rounded-lg">
            {pages.map(p => (<div key={p} className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm font-medium ${currentPage === p ? 'bg-white shadow text-black' : 'text-slate-600'}`}><button onClick={() => switchPage(p)}>{p}</button>{p !== 'home' && (<button onClick={() => deletePage(p)} className="text-gray-400 hover:text-red-500 ml-1">×</button>)}</div>))}
          </div>
          {!showAdd ? (<button onClick={() => setShowAdd(true)} className='px-3 py-1.5 border border-dashed rounded text-sm'>+ Add Route</button>) : (<div className='flex gap-1 items-center bg-white p-1 rounded border'><input value={newPageName} onChange={e => setNewPageName(e.target.value)} placeholder="services" className='px-2 py-1 text-sm outline-none w-28' autoFocus /><button onClick={addPage} className='bg-emerald-600 text-white px-3 py-1 rounded text-sm'>Create</button><button onClick={() => setShowAdd(false)} className='px-2 text-gray-400'>×</button></div>)}
        </div>
        <div className='flex gap-2 items-center'>
          <div className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${saveStatus === 'saved' ? 'bg-emerald-500' : saveStatus === 'saving' ? 'bg-amber-500 animate-ping' : 'bg-rose-500'}`} />{saveStatus}</div>
          <button onClick={() => setShowAiDrawer(!showAiDrawer)} className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-md text-sm font-bold shadow">✨ AI Layout</button>
          <button onClick={() => setShowSettings(!showSettings)} className="px-3 py-2 border rounded-md text-sm bg-slate-50">{showSettings ? 'Close SEO' : 'SEO Settings'}</button>
          <button onClick={publish} className='bg-black text-white font-medium px-5 py-2 rounded-md text-sm'>Publish 🚀</button>
        </div>
      </div>

      {showSettings && (
        <div className="bg-slate-50 border-b p-4 flex gap-4 flex-wrap animate-in slide-in-from-top">
          <div className="flex-1 min-w-[200px]"><label className="text-xs font-bold">Page Title (Internal)</label><input value={data.meta?.title || ''} onChange={e => { const m = { ...data.meta!, title: e.target.value }; setData({ ...data, meta: m }); }} onBlur={e => save({ ...latestDataRef.current, meta: { ...latestDataRef.current.meta!, title: e.target.value } })} className="w-full p-2 border rounded bg-white text-sm mt-1" /></div>
          <div className="flex-1 min-w-[250px]"><label className="text-xs font-bold text-blue-700">SEO Title (Google) — 60 chars</label><input value={data.meta?.seoTitle || ''} onChange={e => { const m = { ...data.meta!, seoTitle: e.target.value }; setData({ ...data, meta: m }); }} onBlur={e => save({ ...latestDataRef.current, meta: { ...latestDataRef.current.meta!, seoTitle: e.target.value } })} className="w-full p-2 border rounded bg-white text-sm mt-1 border-blue-200" placeholder="Best Corporate Consulting Qatar | Al Mansour" /><div className="text-[10px] text-gray-400 mt-1">{(data.meta?.seoTitle || '').length}/60</div></div>
          <div className="flex-[2] min-w-[300px]"><label className="text-xs font-bold text-green-700">SEO Description — 155 chars (CTR)</label><input value={data.meta?.seoDesc || data.meta?.description || ''} onChange={e => { const m = { ...data.meta!, seoDesc: e.target.value, description: e.target.value }; setData({ ...data, meta: m }); }} onBlur={e => save({ ...latestDataRef.current, meta: { ...latestDataRef.current.meta!, seoDesc: e.target.value, description: e.target.value } })} className="w-full p-2 border rounded bg-white text-sm mt-1 border-green-200" placeholder="Leading consulting in Qatar for company formation..." /><div className="text-[10px] text-gray-400 mt-1">{(data.meta?.seoDesc || '').length}/155 — Preview: <b>{data.meta?.seoTitle}</b> | {(data.meta?.seoDesc || '').slice(0,80)}</div></div>
        </div>
      )}

      {showAiDrawer && (
        <div className="bg-white border-b p-6 shadow-inner">
          <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg">AI Layout Generator Engine v2 — Ultimate</h3><button onClick={() => setShowAiDrawer(false)} className="text-gray-400">✕</button></div>
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div><label className="text-xs font-bold">Company Name</label><input value={aiCompanyName} onChange={e => setAiCompanyName(e.target.value)} placeholder="Al Mansour" className="border p-2.5 rounded-md text-sm w-full mt-1" /></div>
              <div><label className="text-xs font-bold">Industry</label><select value={aiIndustry} onChange={e => setAiIndustry(e.target.value)} className="border p-2.5 rounded-md text-sm w-full mt-1 bg-white"><option>Corporate Consulting</option><option>Construction</option><option>Trading</option><option>Technology</option><option>Real Estate</option><option>Logistics</option><option>Legal Services</option></select></div>
              <div><label className="text-xs font-bold">Tone</label><select value={aiTone} onChange={e => setAiTone(e.target.value)} className="border p-2.5 rounded-md text-sm w-full mt-1 bg-white"><option>Professional</option><option>Friendly</option><option>Bold</option><option>Luxury</option><option>Minimal</option></select></div>
            </div>
            <div className="flex gap-3 flex-wrap"><button onClick={() => executeAiLayoutSync('hero')} disabled={aiGenerating} className="bg-slate-900 text-white px-6 py-2.5 rounded-md text-sm font-medium disabled:opacity-50">⚡ Generate Hero (Qatar)</button><button onClick={() => executeAiLayoutSync('features')} disabled={aiGenerating} className="bg-blue-600 text-white px-6 py-2.5 rounded-md text-sm font-medium disabled:opacity-50">✨ Features (3 Cards)</button><button onClick={() => executeAiLayoutSync('full')} disabled={aiGenerating} className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2.5 rounded-md text-sm font-bold disabled:opacity-50 shadow">🚀 Full Page AI (Best)</button><span className="text-xs text-gray-400 self-center">schemaVersion 2 + SEO auto-saved</span></div>
          </div>
        </div>
      )}
      <div className="flex-1 relative"><Puck key={currentPage} config={config as any} data={data} onPublish={save} onChange={setData} /></div>
    </div>
  );
}