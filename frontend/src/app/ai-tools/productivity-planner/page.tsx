'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/project-delivery';

const COUNTRIES = [
  { code: 'Qatar', flag: '🇶🇦', week: 'Sun-Thu', prayer: true, ramadan: true, lang: 'EN/AR' },
  { code: 'UAE', flag: '🇦🇪', week: 'Mon-Fri', prayer: true, ramadan: true, lang: 'EN/AR' },
  { code: 'Saudi Arabia', flag: '🇸🇦', week: 'Sun-Thu', prayer: true, ramadan: true, lang: 'EN/AR' },
  { code: 'UK', flag: '🇬🇧', week: 'Mon-Fri', prayer: false, ramadan: false, lang: 'EN' },
  { code: 'USA', flag: '🇺🇸', week: 'Mon-Fri', prayer: false, ramadan: false, lang: 'EN' },
  { code: 'Australia', flag: '🇦🇺', week: 'Mon-Fri', prayer: false, ramadan: false, lang: 'EN' },
];

export default function ProductivityPage() {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [country, setCountry] = useState<any>(COUNTRIES[0]);
  const [form, setForm] = useState({ role: 'Founder', teamSize: '1-5', workSchedule: 'Sun-Thu 8AM-4PM (Qatar)', goals: '', challenges: '', ramadanMode: false });

  useEffect(() => { setToken(sessionStorage.getItem('accessToken') || ''); }, []);
  useEffect(() => { if(token) loadHistory(); }, [token]);

  const loadHistory = async () => {
    try { const data = await apiRequest<any[]>('/productivity-plans', token); setHistory(data); } catch {}
  };

  const submit = async () => {
    if(!form.goals){ alert('Goals required'); return; }
    setLoading(true);
    try {
      const payload = { ...form, country: country.code, workSchedule: form.workSchedule };
      const data = await apiRequest<any>('/productivity-plans', token, { method: 'POST', body: JSON.stringify(payload) });
      setResult(data); loadHistory();
    } catch(e:any){ alert(e.message); }
    setLoading(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">International Productivity Planner</h1>
          <p className="text-sm text-gray-600 mt-1">{country.flag} {country.code} • {country.week} • Prayer: {country.prayer ? 'Yes' : 'No'} • Ramadan Mode Available</p>
        </div>
        <Link href="/ai-tools" className="text-sm underline">AI Tools</Link>
      </div>

      <div className="mt-4 flex gap-2 flex-wrap">
        {COUNTRIES.map(c=><button key={c.code} onClick={()=>setCountry(c)} className={`px-3 py-1.5 rounded-full border text-xs font-semibold ${country.code===c.code?'bg-black text-white':'bg-white'}`}>{c.flag} {c.code} — {c.week}</button>)}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <div className="border rounded-2xl p-6 bg-white shadow-sm space-y-4">
          <h2 className="font-bold">Work Context — {country.week}</h2>
          <div className="grid grid-cols-2 gap-3">
            <input value={form.role} onChange={e=>setForm({...form, role: e.target.value})} placeholder="Role e.g. Founder" className="border p-3 rounded-lg"/>
            <select value={form.teamSize} onChange={e=>setForm({...form, teamSize: e.target.value})} className="border p-3 rounded-lg"><option>1-5</option><option>6-15</option><option>16-50</option><option>50+</option></select>
          </div>
          <input value={form.workSchedule} onChange={e=>setForm({...form, workSchedule: e.target.value})} placeholder="Schedule e.g. Sun-Thu 8AM-4PM" className="w-full border p-3 rounded-lg"/>
          <textarea value={form.goals} onChange={e=>setForm({...form, goals: e.target.value})} placeholder="Top 3 goals this quarter *" className="w-full border p-3 rounded-lg h-24"/>
          <textarea value={form.challenges} onChange={e=>setForm({...form, challenges: e.target.value})} placeholder="Challenges: focus, meetings, prayer times, remote team..." className="w-full border p-3 rounded-lg h-20"/>
          {country.ramadan && <label className="flex gap-2 items-center text-sm font-medium"><input type="checkbox" checked={form.ramadanMode} onChange={e=>setForm({...form, ramadanMode: e.target.checked})}/> 🌙 Ramadan Mode (6AM-2PM + Night Deep Work 9PM-1AM)</label>}
          <button onClick={submit} disabled={loading} className="w-full bg-[#0F172A] text-white p-3 rounded-lg font-bold">{loading ? 'Building Weekly Plan with AI...' : `Generate ${country.flag} Weekly Plan`}</button>
          {history.length>0 && <div className="pt-3 border-t"><p className="text-xs font-semibold">Recent Plans</p><div className="mt-2 space-y-1 max-h-32 overflow-auto">{history.map((h:any)=><div key={h.id} onClick={()=>setResult(h)} className="text-xs p-2 bg-gray-50 rounded cursor-pointer">{h.role} — {h.country} — {new Date(h.createdAt).toLocaleDateString()}</div>)}</div></div>}
        </div>

        <div className="border rounded-2xl p-6 bg-white shadow-sm">
          {!result ? (
            <div className="text-center py-16"><div className="text-6xl">⚡ {country.flag}</div><h3 className="font-bold mt-4">International Focus System</h3><p className="text-sm text-gray-600 mt-2">Sun-Thu Qatar/Saudi • Mon-Fri UAE/UK/USA/AU<br/>Prayer Slots • Deep Work • Team Sync<br/>KPI: Focus Hours, Tasks/Day</p></div>
          ) : (
            <div>
              <h3 className="font-bold text-lg">Weekly Plan — {result.workSchedule || form.workSchedule}</h3>
              <p className="text-xs text-gray-500">{result.country} • {result.role} • Team {result.teamSize}</p>
              <div className="mt-4 space-y-2">
                {result.weeklyPlan && Object.entries(result.weeklyPlan).map(([day, tasks]:any)=>(
                  <div key={day} className="border-b py-2 text-sm"><b>{day}:</b> {Array.isArray(tasks) ? tasks.map((t:any)=>`${t.time||''} ${t.task} (${t.type||'Work'})`).join(' • ') : JSON.stringify(tasks)}</div>
                ))}
                {!result.weeklyPlan && <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto">{JSON.stringify(result, null, 2)}</pre>}
              </div>
              <div className="mt-4 p-3 bg-green-50 rounded text-sm"><b>KPIs:</b> {result.kpis ? JSON.stringify(result.kpis) : 'Focus 5h/day • 8 tasks/day'}<br/>{result.challenges && <span>Challenges addressed: {result.challenges}</span>}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


