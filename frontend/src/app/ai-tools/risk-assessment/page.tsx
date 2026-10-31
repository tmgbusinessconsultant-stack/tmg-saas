'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/project-delivery';

const COUNTRIES = [
  { code: 'Qatar', currency: 'QAR', law: 'Labour Law 14/2004, QFC Law 7/2005', week: 'Sun-Thu', prayer: true },
  { code: 'UAE', currency: 'AED', law: 'Federal Decree Law 33/2021', week: 'Mon-Fri', prayer: true },
  { code: 'Saudi Arabia', currency: 'SAR', law: 'KSA Labour Law, Vision 2030', week: 'Sun-Thu', prayer: true },
  { code: 'UK', currency: 'GBP', law: 'Employment Rights Act 1996', week: 'Mon-Fri', prayer: false },
  { code: 'USA', currency: 'USD', law: 'OSHA, FLSA, Title VII', week: 'Mon-Fri', prayer: false },
  { code: 'Australia', currency: 'AUD', law: 'Fair Work Act 2009, WHS Act 2011', week: 'Mon-Fri', prayer: false },
] as const;

const INDUSTRIES = ['Technology', 'Logistics', 'E-commerce', 'Consulting', 'Real Estate', 'Healthcare', 'Education', 'F&B', 'Construction', 'Manufacturing', 'Finance', 'Import/Export', 'Energy', 'Marketing Agency', 'Other'];

type Assessment = { id: string; businessType: string; country: string; currency: string; investmentAmount: number; teamSize: number; location: string; createdAt: string; overallScore?: string; riskMatrix?: any[]; recommendations?: any; };

export default function RiskAssessmentPage() {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Assessment | null>(null);
  const [history, setHistory] = useState<Assessment[]>([]);
  const [country, setCountry] = useState<(typeof COUNTRIES)[number]>(COUNTRIES[0]);
  const [form, setForm] = useState({ businessType: '', industry: 'Technology', location: 'Doha', investmentAmount: 50000, teamSize: 5, concerns: '', currency: 'QAR' });

  useEffect(() => {
    // Fixed: checks both storages as you had
    const t = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken') || localStorage.getItem('token') || '';
    setToken(t);
  }, []);

  useEffect(() => { if (token) loadHistory(); }, [token]);

  const loadHistory = async () => {
    try {
      const data = await apiRequest<Assessment[]>('/risk-assessments', token);
      setHistory(Array.isArray(data) ? data : []);
    } catch { }
  };

  const submit = async () => {
    if (!form.businessType.trim() || !form.concerns.trim()) return;
    setLoading(true);
    try {
      const payload = { ...form, country: country.code, currency: country.currency, teamSize: Number(form.teamSize), investmentAmount: Number(form.investmentAmount) };
      const data = await apiRequest<Assessment>('/risk-assessments', token, { method: 'POST', body: JSON.stringify(payload) });
      setResult(data);
      await loadHistory();
    } catch (e: any) { console.error(e); alert(e.message || 'Failed'); } finally { setLoading(false); }
  };

  const color = (score?: string) => score?.includes('High') ? 'bg-red-500' : score?.includes('Medium') ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div className="min-h-screen bg-[#FCFCF9]">
      <div className="max-w-7xl mx-auto px-6 py-10 md:py-14">
        <div className="flex justify-between items-start gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#D4AF37]">Risk • 5x5 Matrix</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900">Risk Assessment</h1>
            <p className="mt-2 text-sm text-zinc-500 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#D4AF37]" />
              {country.code} • {country.currency} • {country.law}
            </p>
          </div>
          <Link href="/ai-tools" className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold">AI Tools</Link>
        </div>

        <div className="mt-6 flex gap-2 flex-wrap">
          {COUNTRIES.map(c => (
            <button key={c.code} onClick={() => { setCountry(c); setForm({ ...form, currency: c.currency, location: c.code === 'Qatar' ? 'Doha' : c.code === 'UAE' ? 'Dubai' : c.code }); }} className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${country.code === c.code ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-900'}`}>
              {c.code} — {c.week}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mt-8">
          <div className="rounded-[24px] border border-zinc-200 bg-white p-6 md:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.04)] space-y-5">
            <h2 className="text-sm font-semibold text-zinc-900">Business Profile — {country.code}</h2>
            <input placeholder="Business Type e.g. Tech Consultancy *" value={form.businessType} onChange={e => setForm({ ...form, businessType: e.target.value })} className="w-full rounded-[12px] border border-zinc-200 bg-zinc-50 p-3 text-sm focus:bg-white focus:border-zinc-900 focus:outline-none" />
            <div className="grid grid-cols-2 gap-3">
              <select value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })} className="rounded-[12px] border border-zinc-200 bg-zinc-50 p-3 text-sm focus:bg-white focus:border-zinc-900 focus:outline-none">{INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}</select>
              <input placeholder="City" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="rounded-[12px] border border-zinc-200 bg-zinc-50 p-3 text-sm focus:bg-white focus:border-zinc-900 focus:outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[12px] border border-zinc-100 bg-zinc-50 p-3 text-sm">
                <span className="text-zinc-500 text-xs">Currency</span>
                <p className="font-semibold text-zinc-900">{form.currency}</p>
                <p className="text-[11px] text-zinc-500 mt-1 leading-4">{country.law}</p>
              </div>
              <div className="space-y-2">
                <input type="number" placeholder="Investment" value={form.investmentAmount} onChange={e => setForm({ ...form, investmentAmount: Number(e.target.value) })} className="w-full rounded-[12px] border border-zinc-200 bg-zinc-50 p-3 text-sm focus:bg-white focus:border-zinc-900 focus:outline-none" />
                <input type="number" placeholder="Team Size" value={form.teamSize} onChange={e => setForm({ ...form, teamSize: Number(e.target.value) })} className="w-full rounded-[12px] border border-zinc-200 bg-zinc-50 p-3 text-sm focus:bg-white focus:border-zinc-900 focus:outline-none" />
              </div>
            </div>
            <textarea placeholder="Top concerns? funding, competition, compliance, cashflow *" value={form.concerns} onChange={e => setForm({ ...form, concerns: e.target.value })} className="w-full rounded-[12px] border border-zinc-200 bg-zinc-50 p-3 text-sm h-28 focus:bg-white focus:border-zinc-900 focus:outline-none" />
            <button onClick={submit} disabled={loading} className="w-full rounded-full bg-zinc-900 text-white py-3.5 text-sm font-semibold hover:bg-black disabled:opacity-50">
              {loading ? 'Analyzing Risks...' : `Generate ${country.code} Risk Matrix`}
            </button>

            {history.length > 0 && (
              <div className="pt-5 border-t border-zinc-100">
                <p className="text-xs font-semibold text-zinc-900">Recent Assessments</p>
                <div className="mt-3 space-y-2 max-h-32 overflow-auto">
                  {history.map((h) => (
                    <button key={h.id} onClick={() => setResult(h)} className="w-full text-left text-xs p-3 rounded-[12px] bg-zinc-50 border border-zinc-100 hover:border-zinc-900 transition-colors">
                      {h.businessType} — {h.country} — {new Date(h.createdAt).toLocaleDateString()}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-[24px] border border-zinc-200 bg-white p-6 md:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            {!result ? (
              <div className="text-center py-16">
                <div className="h-14 w-14 rounded-[16px] bg-zinc-900 mx-auto grid place-items-center">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#D4AF37] animate-pulse" />
                </div>
                <h3 className="font-semibold mt-5 text-zinc-900">Risk Framework</h3>
                <p className="text-sm text-zinc-500 mt-2 leading-6">5x5 Matrix • Likelihood x Impact<br />Qatar QFC • UAE • KSA Vision 2030 • UK • USA OSHA<br />Go / No-Go + Mitigation</p>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-zinc-900">{result.businessType}</h3>
                  <span className={`text-white text-xs px-3 py-1 rounded-full font-semibold ${color(result.overallScore)}`}>{result.overallScore || 'Analysis'}</span>
                </div>
                <div className="mt-5 space-y-3">
                  {(result.riskMatrix || (result.recommendations as any)?.riskMatrix || []).map((r: any, i: number) => (
                    <div key={i} className="flex gap-3 rounded-[12px] border border-zinc-100 bg-zinc-50 p-3">
                      <span className={`w-1.5 rounded-full ${color(r.score)}`} />
                      <div className="flex-1">
                        <div className="flex justify-between gap-2">
                          <b className="text-sm text-zinc-900">{r.risk}</b>
                          <span className="text-[10px] bg-white border border-zinc-200 px-2 py-0.5 rounded-full">{r.category} • {r.score}</span>
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">L:{r.likelihood}/5 I:{r.impact}/5 — {r.mitigation}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 rounded-[12px] bg-zinc-50 border border-zinc-100 p-3 text-sm text-zinc-700">
                  <span className="font-semibold text-zinc-900">Executive:</span> {result.recommendations?.executiveSummary || (result.recommendations as any)?.goNoGo || 'Mitigation required'}<br />
                  <span className="text-xs text-zinc-500">{country.law}</span>
                </div>
                <div className="mt-3 text-xs text-zinc-400">Investment: {result.investmentAmount} {result.currency} • Team: {result.teamSize} • {result.country}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}