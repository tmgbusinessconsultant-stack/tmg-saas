'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/project-delivery';
import AiDataNotice from '../ai-data-notice';

type SavedPlan = { id: string; title: string; content: string; createdAt: string; currency?: string; country?: string; };

const TEMPLATES = [
  { id: 'Qatar Investor', name: 'Qatar Investor', desc: 'QFC + Gold + Arabic Ready', header: '#0F172A', accent: '#D4AF37', text: 'Qatar, GCC Investors' },
  { id: 'Australia Investor', name: 'Australia Investor', desc: 'ASIC + ABN + Fair Work Act', header: '#0F172A', accent: '#0066CC', text: 'Australia, AUD A$' },
  { id: 'US SBA Bank Ready', name: 'US SBA Bank Ready', desc: 'SBA Formal + Blue', header: '#1E3A8A', accent: '#3B82F6', text: 'US Banks & SBA Loans' },
  { id: 'UK Investor', name: 'UK Investor', desc: 'UKVI + Equality Act', header: '#1E293B', accent: '#8B0000', text: 'UK, GBP £' },
  { id: 'International Standard', name: 'International Standard', desc: 'Global Green', header: '#0F172A', accent: '#10B981', text: 'EU / Global' },
  { id: 'Lean Startup', name: 'Lean Startup', desc: 'Minimal + ATS Clean', header: '#FFFFFF', accent: '#000000', text: 'Accelerators' },
] as const;

const COUNTRIES = [
  { country: 'Qatar', currency: 'QAR', symbol: 'QAR ', law: 'QFC Regulations, Qatar Labour Law', tax: 'No Income Tax', flag: '🇶🇦' },
  { country: 'Australia', currency: 'AUD', symbol: 'A$', law: 'Fair Work Act 2009, ASIC, ABN/ACN Required', tax: 'GST 10%', flag: '🇦🇺' },
  { country: 'UAE', currency: 'AED', symbol: 'AED ', law: 'UAE Labour Law Federal Decree No.33/2021', tax: '5% VAT', flag: '🇦🇪' },
  { country: 'Saudi Arabia', currency: 'SAR', symbol: 'SAR ', law: 'Saudi Labour Law, MHRSD', tax: '15% VAT', flag: '🇸🇦' },
  { country: 'United Kingdom', currency: 'GBP', symbol: '£', law: 'Employment Rights Act 1996, Equality Act 2010', tax: 'PAYE', flag: '🇬🇧' },
  { country: 'USA', currency: 'USD', symbol: '$', law: 'FLSA, Title VII, SBA 7(a) Compliance', tax: 'Federal/State', flag: '🇺🇸' },
  { country: 'Canada', currency: 'CAD', symbol: 'C$', law: 'Canada Labour Code', tax: 'GST/HST', flag: '🇨🇦' },
  { country: 'India', currency: 'INR', symbol: '₹', law: 'Shops Act, Companies Act', tax: 'GST 18%', flag: '🇮🇳' },
  { country: 'Singapore', currency: 'SGD', symbol: 'S$', law: 'Employment Act, MOM', tax: '7% GST', flag: '🇸🇬' },
  { country: 'EU', currency: 'EUR', symbol: '€', law: 'EU Labour Directive, GDPR', tax: '19-25%', flag: '🇪🇺' },
] as const;

export default function BusinessPlanPage() {
  const [step, setStep] = useState(1);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [template, setTemplate] = useState('Qatar Investor');
  const [selectedCountry, setSelectedCountry] = useState<any>(COUNTRIES[0]);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savedPlan, setSavedPlan] = useState<SavedPlan | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState('');

  const [form, setForm] = useState({
    businessName: '',
    idea: '',
    industry: '',
    location: 'Doha, Qatar',
    targetMarket: '',
    elevatorPitch: '',
    marketSize: '',
    competitors: '',
    products: '',
    operations: '',
    team: '',
    startupCosts: '100,000',
    monthlyCosts: '15,000',
    revenueY1: '300,000',
    revenueY2: '600,000',
    revenueY3: '1,200,000',
    fundingNeeded: '250,000',
    fundingUse: ''
  });

  const currentTpl = TEMPLATES.find(t => t.id === template) || TEMPLATES[0];

  useEffect(() => { setToken(sessionStorage.getItem('accessToken') ?? ''); }, []);
  useEffect(() => {
    if (!savedPlan?.id || !token) return;
    (async () => {
      try {
        const base = process.env.NEXT_PUBLIC_API_URL || '/api';
        const res = await fetch(`${base}/business-plans/file/${savedPlan.id}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const blob = await res.blob();
        setPdfBlobUrl(URL.createObjectURL(blob));
      } catch {}
    })();
  }, [savedPlan?.id, token]);

  const handleCountryChange = (countryName: string) => {
    const c = COUNTRIES.find(x => x.country === countryName) || COUNTRIES[0];
    setSelectedCountry(c);
    setForm(prev => ({ ...prev, location: `${c.country} - ${c.currency}` }));
    if (c.country === 'Australia') setTemplate('Australia Investor');
    else if (c.country === 'United Kingdom') setTemplate('UK Investor');
    else if (c.country === 'USA') setTemplate('US SBA Bank Ready');
    else if (c.country === 'Qatar') setTemplate('Qatar Investor');
  };

  const handleGenerate = async () => {
    if (!token) { setError('Sign in required'); return; }
    if (!form.businessName || !form.idea) { setError('Business Name and Idea required'); return; }
    setLoading(true); setError('');
    try {
      const payload = { ...form, template, currency: selectedCountry.currency, country: selectedCountry.country, symbol: selectedCountry.symbol, law: selectedCountry.law, tax: selectedCountry.tax, name: form.businessName, expectedSalary: form.fundingNeeded };
      let result: SavedPlan;
      try {
        result = await apiRequest<SavedPlan>('/business-plans', token, { method: 'POST', body: JSON.stringify(payload) });
      } catch {
        const res = await fetch('/api/ai/business-plan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ input: `Business Plan: ${JSON.stringify(payload)}` }) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        result = { id: Date.now().toString(), title: form.businessName, content: data.message, createdAt: new Date().toISOString() };
        setPdfBlobUrl('');
        setSavedPlan(result);
        setStep(4);
        return;
      }
      setSavedPlan(result);
      setStep(4);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex justify-between items-center">
        <div><h1 className="text-3xl font-bold">Business Plan Builder Pro</h1><p className="text-xs text-gray-600 mt-1">{selectedCountry.flag} {selectedCountry.country} | {selectedCountry.currency} ({selectedCountry.symbol}) | {selectedCountry.law} | {selectedCountry.tax}</p></div>
        <Link href="/dashboard/business-plans" className="text-sm underline">My Plans</Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 items-center">
        <button onClick={() => setShowTemplateModal(true)} className="flex items-center gap-2 border rounded-full px-3 py-1.5 text-xs bg-white shadow-sm hover:shadow"><span className="w-3 h-3 rounded-full" style={{ background: currentTpl.header, border: '1px solid #ddd' }}></span><span className="w-3 h-3 rounded-full" style={{ background: currentTpl.accent }}></span>{currentTpl.name}</button>
        <select value={selectedCountry.country} onChange={e => handleCountryChange(e.target.value)} className="border rounded-full px-3 py-1.5 text-xs bg-white font-semibold">{COUNTRIES.map(c => <option key={c.country} value={c.country}>{c.flag} {c.country} - {c.currency} ({c.symbol}) - {c.law.substring(0,30)}</option>)}</select>
        <span className="text-xs bg-black text-white px-2 py-1 rounded-full">{selectedCountry.symbol} {selectedCountry.currency} Premium</span>
      </div>

      {showTemplateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-5"><h2 className="text-xl font-bold">Template - {selectedCountry.flag} {selectedCountry.country}</h2><button onClick={() => setShowTemplateModal(false)} className="text-2xl">×</button></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {TEMPLATES.map(t => (
                <button key={t.id} onClick={() => { setTemplate(t.id); setShowTemplateModal(false); }} className={`text-left border-2 rounded-xl overflow-hidden hover:scale-[1.02] transition-all ${template === t.id ? 'border-black ring-2 ring-black' : 'border-gray-200'}`}>
                  <div className="h-16 flex items-center px-4" style={{ background: t.header }}><div className="font-bold text-sm" style={{ color: t.id === 'Lean Startup' ? 'black' : 'white' }}>{t.name}</div><div className="ml-auto w-6 h-6 rounded-full" style={{ background: t.accent }}></div></div>
                  <div className="p-3 bg-gray-50"><div className="text-xs font-semibold">{t.desc}</div><div className="text-[11px] text-gray-500 mt-1">{t.text}</div></div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <div className="border rounded-xl p-5 bg-white shadow-sm">
          {step === 1 && (
            <div className="space-y-3">
              <h3 className="font-bold text-sm">Idea & Market — Step 1 — {selectedCountry.flag} {selectedCountry.country}</h3>
              <input placeholder="Business Name *" className="border p-2 rounded w-full font-semibold" value={form.businessName} onChange={e => setForm({ ...form, businessName: e.target.value })} />
              <textarea placeholder="Business Idea *" className="w-full border p-2 rounded h-24" value={form.idea} onChange={e => setForm({ ...form, idea: e.target.value })} />
              <div className="grid grid-cols-2 gap-2"><input placeholder="Industry" className="border p-2 rounded w-full text-sm" value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })} /><input placeholder="Location" className="border p-2 rounded w-full text-sm" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></div>
              <textarea placeholder="Target Market" className="w-full border p-2 rounded h-20 bg-amber-50 text-sm" value={form.targetMarket} onChange={e => setForm({ ...form, targetMarket: e.target.value })} />
              <textarea placeholder="Elevator Pitch" className="w-full border p-2 rounded h-16 text-sm" value={form.elevatorPitch} onChange={e => setForm({ ...form, elevatorPitch: e.target.value })} />
              <button onClick={() => setStep(2)} className="bg-black text-white px-5 py-2 rounded w-full">Next — Market (Step 2)</button>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-3">
              <h3 className="font-bold text-sm">Market & Operations — Step 2 — {selectedCountry.law}</h3>
              <textarea placeholder="Market Size" className="w-full border p-2 rounded h-20 text-sm" value={form.marketSize} onChange={e => setForm({ ...form, marketSize: e.target.value })} />
              <textarea placeholder="Competitors" className="w-full border p-2 rounded h-20 text-sm" value={form.competitors} onChange={e => setForm({ ...form, competitors: e.target.value })} />
              <textarea placeholder="Products / Services" className="w-full border p-2 rounded h-24 text-sm bg-blue-50/50" value={form.products} onChange={e => setForm({ ...form, products: e.target.value })} />
              <textarea placeholder="Operations Plan" className="w-full border p-2 rounded h-20 text-sm" value={form.operations} onChange={e => setForm({ ...form, operations: e.target.value })} />
              <textarea placeholder="Management Team" className="w-full border p-2 rounded h-20 text-sm" value={form.team} onChange={e => setForm({ ...form, team: e.target.value })} />
              <div className="flex gap-2"><button onClick={() => setStep(1)} className="border px-4 py-2 rounded text-sm">Back</button><button onClick={() => setStep(3)} className="bg-black text-white px-5 py-2 rounded text-sm flex-1">Next — Financials (Step 3)</button></div>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-3">
              <h3 className="font-bold text-sm">Financials — Step 3 — {selectedCountry.symbol} {selectedCountry.currency} — {selectedCountry.country}</h3>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs">Startup Costs ({selectedCountry.symbol} {selectedCountry.currency})<input className="border p-2 rounded w-full mt-1 bg-amber-50 font-bold" value={form.startupCosts} onChange={e => setForm({ ...form, startupCosts: e.target.value })} /></label>
                <label className="text-xs">Monthly Costs ({selectedCountry.symbol})<input className="border p-2 rounded w-full mt-1" value={form.monthlyCosts} onChange={e => setForm({ ...form, monthlyCosts: e.target.value })} /></label>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <label className="text-xs">Revenue Y1 ({selectedCountry.symbol})<input className="border p-2 rounded w-full mt-1 text-sm" value={form.revenueY1} onChange={e => setForm({ ...form, revenueY1: e.target.value })} /></label>
                <label className="text-xs">Revenue Y2<input className="border p-2 rounded w-full mt-1 text-sm" value={form.revenueY2} onChange={e => setForm({ ...form, revenueY2: e.target.value })} /></label>
                <label className="text-xs">Revenue Y3<input className="border p-2 rounded w-full mt-1 text-sm" value={form.revenueY3} onChange={e => setForm({ ...form, revenueY3: e.target.value })} /></label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs">Funding Needed ({selectedCountry.symbol} {selectedCountry.currency})<input className="border p-2 rounded w-full mt-1 font-bold bg-green-50" value={form.fundingNeeded} onChange={e => setForm({ ...form, fundingNeeded: e.target.value })} /></label>
                <label className="text-xs">Use of Funds<textarea className="border p-2 rounded w-full mt-1 h-[68px] text-sm" value={form.fundingUse} onChange={e => setForm({ ...form, fundingUse: e.target.value })} placeholder="e.g. 40% equipment, 30% marketing" /></label>
              </div>
              <button onClick={handleGenerate} disabled={loading} className="bg-[#0F172A] text-white px-5 py-3 rounded w-full font-bold mt-2">{loading ? 'Generating...' : `Generate ${currentTpl.name} — ${selectedCountry.flag} ${selectedCountry.symbol} ${form.fundingNeeded} ${selectedCountry.currency}`}</button>
              <div className="flex gap-2"><button onClick={() => setStep(2)} className="border px-4 py-2 rounded text-sm">Back</button></div>
              {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
            </div>
          )}
          {step === 4 && (
            <div><h3 className="font-bold text-green-700">Business Plan Generated — {selectedCountry.flag} {selectedCountry.country} | {selectedCountry.symbol} {selectedCountry.currency}</h3>{pdfBlobUrl && <iframe src={pdfBlobUrl} className="w-full h-[500px] border rounded mt-3" />}<div className="flex gap-2 mt-3">{pdfBlobUrl && <a href={pdfBlobUrl} download={`${form.businessName}-Business-Plan-${selectedCountry.country}-${selectedCountry.currency}.pdf`} className="bg-black text-white px-4 py-2 rounded text-sm">Download PDF — {selectedCountry.symbol} {selectedCountry.currency}</a>}<button onClick={() => setStep(1)} className="border px-4 py-2 rounded text-sm">New Plan</button></div><div className="mt-3 text-xs text-gray-500 p-2 bg-gray-50 rounded">{selectedCountry.law} | {selectedCountry.tax} | {selectedCountry.currency} Premium</div></div>
          )}
        </div>
        <div className="border rounded-xl p-5 bg-white shadow-sm">
          {!savedPlan ? <div className="text-center py-20"><div className="text-5xl mb-4">{selectedCountry.flag}</div><h3 className="font-bold">Premium International Business Plan</h3><p className="text-sm text-gray-600 mt-2">{selectedCountry.country} — {selectedCountry.currency} ({selectedCountry.symbol})<br/>{selectedCountry.law}<br/>Tax: {selectedCountry.tax}<br/>Funding: {selectedCountry.symbol} {form.fundingNeeded} {selectedCountry.currency}</p><div className="mt-4 text-xs bg-gray-100 px-3 py-1 rounded-full">{currentTpl.name} | {selectedCountry.country}</div></div> : <div><h3 className="font-bold">Preview — {selectedCountry.flag} {selectedCountry.country}</h3>{pdfBlobUrl && <iframe src={pdfBlobUrl} className="w-full h-[600px] border rounded mt-3" />}<div className="mt-3 text-xs text-gray-500 p-2 bg-gray-50 rounded">{selectedCountry.law} | {selectedCountry.tax} | TMG Premium</div></div>}
        </div>
      </div>
    </div>
  );
}



