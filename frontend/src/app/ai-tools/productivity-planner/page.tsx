'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/project-delivery';

const COUNTRIES = [
  { code: 'Qatar', week: 'Sun-Thu', prayer: true, ramadan: true },
  { code: 'UAE', week: 'Mon-Fri', prayer: true, ramadan: true },
  { code: 'Saudi Arabia', week: 'Sun-Thu', prayer: true, ramadan: true },
  { code: 'UK', week: 'Mon-Fri', prayer: false, ramadan: false },
  { code: 'USA', week: 'Mon-Fri', prayer: false, ramadan: false },
  { code: 'Australia', week: 'Mon-Fri', prayer: false, ramadan: false },
] as const;

type Plan = { id: string; role: string; country: string; teamSize: string; workSchedule: string; createdAt: string; weeklyPlan?: any; kpis?: any; challenges?: string; };

export default function ProductivityPage() {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Plan | null>(null);
  const [history, setHistory] = useState<Plan[]>([]);
  const [country, setCountry] = useState<(typeof COUNTRIES)[number]>(COUNTRIES[0]);
  const [form, setForm] = useState({ role: 'Founder', teamSize: '1-5', workSchedule: 'Sun-Thu 8AM-4PM (Qatar)', goals: '', challenges: '', ramadanMode: false });

  useEffect(() => { setToken(sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken') || ''); }, []);
  useEffect(() => { if (token) loadHistory(); }, [token]);

  const loadHistory = async () => {
    try { const data = await apiRequest<Plan[]>('/productivity-plans', token); setHistory(data); } catch { }
  };

  const submit = async () => {
    if (!form.goals.trim()) { setResult(null); return; }
    setLoading(true);
    try {
      const payload = { ...form, country: country.code, workSchedule: form.workSchedule };
      const data = await apiRequest<Plan>('/productivity-plans', token, { method: 'POST', body: JSON.stringify(payload) });
      setResult(data); void loadHistory();
    } catch (e: any) { console.error(e); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#FCFCF9]">
      <div className="max-w-7xl mx-auto px-6 py-10 md:py-14">
        <div className="flex justify-between items-start gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#D4AF37]">Productivity • International</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900">Productivity Planner</h1>
            <p className="mt-2 text-sm text-zinc-500 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#D4AF37]" />
              {country.code} • {country.week} • {country.prayer ? 'Prayer slots' : 'Standard'} {country.ramadan && '• Ramadan mode'}
            </p>
          </div>
          <Link href="/ai-tools" className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold">AI Tools</Link>
        </div>

        <div className="mt-6 flex gap-2 flex-wrap">
          {COUNTRIES.map(c => (
            <button key={c.code} onClick={() => setCountry(c)} className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${country.code === c.code ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-900'}`}>
              {c.code} — {c.week}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mt-8">
          <div className="rounded-[24px] border border-zinc-200 bg-white p-6 md:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.04)] space-y-5">
            <h2 className="text-sm font-semibold text-zinc-900">Work Context — {country.week}</h2>
            <div className="grid grid-cols-2 gap-3">
              <input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} placeholder="Role" className="rounded-[12px] border border-zinc-200 bg-zinc-50 p-3 text-sm focus:bg-white focus:border-zinc-900 focus:outline-none" />
              <select value={form.teamSize} onChange={e => setForm({ ...form, teamSize: e.target.value })} className="rounded-[12px] border border-zinc-200 bg-zinc-50 p-3 text-sm focus:bg-white focus:border-zinc-900 focus:outline-none">
                <option>1-5</option><option>6-15</option><option>16-50</option><option>50+</option>
              </select>
            </div>
            <input value={form.workSchedule} onChange={e => setForm({ ...form, workSchedule: e.target.value })} placeholder="Schedule e.g. Sun-Thu 8AM-4PM" className="w-full rounded-[12px] border border-zinc-200 bg-zinc-50 p-3 text-sm focus:bg-white focus:border-zinc-900 focus:outline-none" />
            <textarea value={form.goals} onChange={e => setForm({ ...form, goals: e.target.value })} placeholder="Top 3 goals this quarter *" className="w-full rounded-[12px] border border-zinc-200 bg-zinc-50 p-3 text-sm h-24 focus:bg-white focus:border-zinc-900 focus:outline-none" />
            <textarea value={form.challenges} onChange={e => setForm({ ...form, challenges: e.target.value })} placeholder="Challenges: focus, meetings, prayer times..." className="w-full rounded-[12px] border border-zinc-200 bg-zinc-50 p-3 text-sm h-20 focus:bg-white focus:border-zinc-900 focus:outline-none" />
            {country.ramadan && (
              <label className="flex gap-2 items-center text-sm rounded-[12px] border border-zinc-100 bg-zinc-50 p-3">
                <input type="checkbox" checked={form.ramadanMode} onChange={e => setForm({ ...form, ramadanMode: e.target.checked })} className="rounded" />
                <span className="font-medium">Ramadan Mode</span>
                <span className="text-zinc-500 text-xs">6AM-2PM + Night Deep Work 9PM-1AM</span>
              </label>
            )}
            <button onClick={submit} disabled={loading} className="w-full rounded-full bg-zinc-900 text-white py-3.5 text-sm font-semibold hover:bg-black disabled:opacity-50">
              {loading ? 'Building Weekly Plan...' : `Generate ${country.code} Weekly Plan`}
            </button>

            {history.length > 0 && (
              <div className="pt-5 border-t border-zinc-100">
                <p className="text-xs font-semibold text-zinc-900">Recent Plans</p>
                <div className="mt-3 space-y-2 max-h-36 overflow-auto">
                  {history.map((h) => (
                    <button key={h.id} onClick={() => setResult(h)} className="w-full text-left text-xs p-3 rounded-[12px] bg-zinc-50 border border-zinc-100 hover:border-zinc-900 transition-colors">
                      {h.role} — {h.country} — {new Date(h.createdAt).toLocaleDateString()}
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
                <h3 className="font-semibold mt-5 text-zinc-900">Focus System</h3>
                <p className="text-sm text-zinc-500 mt-2 leading-6">Sun-Thu Qatar/Saudi • Mon-Fri UAE/UK/USA/AU<br />Prayer Slots • Deep Work • Team Sync</p>
                <span className="mt-4 inline-flex text-xs rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1">KPI: Focus 5h/day • 8 tasks/day</span>
              </div>
            ) : (
              <div>
                <h3 className="font-semibold text-zinc-900">Weekly Plan — {result.workSchedule}</h3>
                <p className="text-xs text-zinc-500 mt-1">{result.country} • {result.role} • Team {result.teamSize}</p>
                <div className="mt-5 space-y-3">
                  {result.weeklyPlan && typeof result.weeklyPlan === 'object' ? Object.entries(result.weeklyPlan).map(([day, tasks]: any) => (
                    <div key={day} className="rounded-[12px] bg-zinc-50 border border-zinc-100 p-3 text-sm">
                      <span className="font-semibold text-zinc-900">{day}:</span>
                      <span className="text-zinc-600 ml-2">{Array.isArray(tasks) ? tasks.map((t: any) => `${t.time || ''} ${t.task}`).join(' • ') : String(tasks)}</span>
                    </div>
                  )) : <pre className="text-xs bg-zinc-50 p-3 rounded-[12px] border border-zinc-100 overflow-auto">{JSON.stringify(result, null, 2)}</pre>}
                </div>
                <div className="mt-5 rounded-[12px] bg-emerald-50 border border-emerald-100 p-3 text-sm text-emerald-900">
                  <span className="font-semibold">KPIs:</span> {result.kpis ? JSON.stringify(result.kpis) : 'Focus 5h/day • 8 tasks/day'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
