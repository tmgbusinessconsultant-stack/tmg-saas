'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/project-delivery';

const COUNTRIES = [
  { code: 'Qatar', currency: 'QAR', flag: '🇶🇦', law: 'Labour Law 14/2004, QFC Law 7/2005', week: 'Sun-Thu', prayer: true },
  { code: 'UAE', currency: 'AED', flag: '🇦🇪', law: 'Federal Decree Law 33/2021', week: 'Mon-Fri', prayer: true },
  { code: 'Saudi Arabia', currency: 'SAR', flag: '🇸🇦', law: 'KSA Labour Law, Vision 2030', week: 'Sun-Thu', prayer: true },
  { code: 'UK', currency: 'GBP', flag: '🇬🇧', law: 'Employment Rights Act 1996', week: 'Mon-Fri', prayer: false },
  { code: 'USA', currency: 'USD', flag: '🇺🇸', law: 'OSHA, FLSA, Title VII', week: 'Mon-Fri', prayer: false },
  { code: 'Australia', currency: 'AUD', flag: '🇦🇺', law: 'Fair Work Act 2009, WHS Act 2011', week: 'Mon-Fri', prayer: false },
  { code: 'India', currency: 'INR', flag: '🇮🇳', law: 'Shops & Establishments Act', week: 'Mon-Sat', prayer: false },
  { code: 'Singapore', currency: 'SGD', flag: '🇸🇬', law: 'Employment Act 1968', week: 'Mon-Fri', prayer: false },
];

const INDUSTRIES = ['Technology','Logistics','E-commerce','Consulting','Real Estate','Healthcare','Education','F&B','Construction','Manufacturing','Finance','Import/Export','Energy','Marketing Agency','Other'];

export default function RiskAssessmentPage() {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [form, setForm] = useState({ businessType: '', industry: 'Technology', location: 'Doha', investmentAmount: 50000, teamSize: 5, concerns: '', currency: 'QAR' });

  useEffect(() => { setToken(sessionStorage.getItem('accessToken') || ''); }, []);
  useEffect(() => { if(token) loadHistory(); }, [token]);

  const loadHistory = async () => {
    try { const data = await apiRequest<any[]>('/risk-assessments', token); setHistory(data); } catch {}
  };

  const submit = async () => {
    if(!form.businessType || !form.concerns){ alert('Business Type & Concerns required'); return; }
    setLoading(true);
    try {
      const payload = { ...form, country: country.code, currency: country.currency, teamSize: Number(form.teamSize), investmentAmount: Number(form.investmentAmount) };
      const data = await apiRequest<any>('/risk-assessments', token, { method: 'POST', body: JSON.stringify(payload) });
      setResult(data); loadHistory();
    } catch(e:any){ alert(e.message); }
    setLoading(false);
  };

  const color = (score:string) => score?.includes('High') ? 'bg-red-500' : score?.includes('Medium') ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">International Risk Assessment — 5x5 Matrix</h1>
          <p className="text-sm text-gray-600 mt-1">{country.flag} {country.code} • {country.currency} • {country.law} • Week: {country.week}</p>
        </div>
        <Link href="/ai-tools" className="text-sm underline">AI Tools</Link>
      </div>

      <div className="mt-4 flex gap-2 flex-wrap">
        {COUNTRIES.map(c=><button key={c.code} onClick={()=>{ setCountry(c); setForm({...form, currency: c.currency, location: c.code==='Qatar'?'Doha': c.code==='UAE'?'Dubai': c.code}); }} className={`px-3 py-1.5 rounded-full border text-xs font-semibold ${country.code===c.code?'bg-black text-white':'bg-white'}`}>{c.flag} {c.code}</button>)}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <div className="border rounded-2xl p-6 bg-white shadow-sm space-y-4">
          <h2 className="font-bold">Business Profile — {country.code}</h2>
          <input placeholder="Business Type e.g. Tech Consultancy *" value={form.businessType} onChange={e=>setForm({...form,businessType:e.target.value})} className="w-full border p-3 rounded-lg"/>
          <div className="grid grid-cols-2 gap-3">
            <select value={form.industry} onChange={e=>setForm({...form,industry:e.target.value})} className="border p-3 rounded-lg">{INDUSTRIES.map(i=><option key={i} value={i}>{i}</option>)}</select>
            <input placeholder="City" value={form.location} onChange={e=>setForm({...form,location:e.target.value})} className="border p-3 rounded-lg"/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="border p-3 rounded-lg bg-gray-50 text-sm">Currency: <b>{form.currency}</b><br/>Law: <span className="text-xs">{country.law}</span></div>
            <div className="space-y-2">
              <input type="number" placeholder="Investment" value={form.investmentAmount} onChange={e=>setForm({...form,investmentAmount:Number(e.target.value)})} className="border p-3 rounded-lg w-full"/>
              <input type="number" placeholder="Team Size" value={form.teamSize} onChange={e=>setForm({...form,teamSize:Number(e.target.value)})} className="border p-3 rounded-lg w-full"/>
            </div>
          </div>
          <textarea placeholder="Top concerns? e.g. funding, competition, compliance, cashflow *" value={form.concerns} onChange={e=>setForm({...form,concerns:e.target.value})} className="w-full border p-3 rounded-lg h-28"/>
          <button onClick={submit} disabled={loading} className="w-full bg-[#0F172A] text-white p-3 rounded-lg font-bold">{loading ? 'Analyzing Risks with AI...' : `Generate ${country.flag} Risk Matrix`}</button>
          {history.length>0 && <div className="pt-3 border-t"><p className="text-xs font-semibold">Recent Assessments</p><div className="mt-2 space-y-1 max-h-32 overflow-auto">{history.map((h:any)=><div key={h.id} onClick={()=>setResult(h)} className="text-xs p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100">{h.businessType} — {h.country} — {new Date(h.createdAt).toLocaleDateString()}</div>)}</div></div>}
        </div>

        <div className="border rounded-2xl p-6 bg-white shadow-sm">
          {!result ? (
            <div className="text-center py-16"><div className="text-6xl">🛡️ {country.flag}</div><h3 className="font-bold mt-4">International Risk Framework</h3><p className="text-sm text-gray-600 mt-2">5x5 Matrix • Likelihood x Impact<br/>Qatar QFC • UAE • KSA Vision 2030 • UK • USA OSHA<br/>Go/No-Go + Mitigation</p></div>
          ) : (
            <div>
              <div className="flex justify-between items-center"><h3 className="font-bold text-lg">{result.businessType} — {result.overallScore || 'Risk Analysis'}</h3><span className={`text-white text-xs px-3 py-1 rounded-full ${color(result.overallScore)}`}>{result.overallScore}</span></div>
              <div className="mt-4 space-y-3">
                {(result.riskMatrix || result.recommendations?.riskMatrix || []).map((r:any,i:number)=>(
                  <div key={i} className="flex gap-3 border p-3 rounded-lg">
                    <span className={`w-2 rounded ${color(r.score)}`}></span>
                    <div className="flex-1"><div className="flex justify-between"><b className="text-sm">{r.risk}</b><span className="text-[10px] bg-gray-100 px-2 py-1 rounded">{r.category} • {r.score}</span></div><p className="text-xs text-gray-600 mt-1">L:{r.likelihood}/5 I:{r.impact}/5 — {r.mitigation}</p></div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm"><b>Executive:</b> {result.recommendations?.executiveSummary || result.recommendations?.goNoGo || 'Mitigation required'}<br/><b>Compliance:</b> {country.law}</div>
              <div className="mt-3 text-xs text-gray-500">Investment: {result.investmentAmount} {result.currency} • Team: {result.teamSize} • {result.country} — {result.location}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
