'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/project-delivery';
import AiDataNotice from '../ai-data-notice';

type Exp = { title: string; company: string; location: string; from: string; to: string; current: boolean; bullets: string; salary?: string; };
type Edu = { degree: string; school: string; year: string; };
type SavedCv = { id: string; title: string; content: string; createdAt: string; currency?: string; symbol?: string; country?: string; };

const TEMPLATES = [
  { id: 'Qatar Professional', name: 'Qatar Professional', desc: 'GCC Formal', accent: '#D4AF37' },
  { id: 'Australia Professional', name: 'Australia Professional', desc: 'Fair Work Compliant', accent: '#0066CC' },
  { id: 'UK Professional', name: 'UK Professional', desc: 'UKVI Compliant', accent: '#8B0000' },
  { id: 'US Standard', name: 'US Standard', desc: 'ATS 95%', accent: '#0F172A' },
  { id: 'Corporate Executive', name: 'Corporate Executive', desc: 'Executive Level', accent: '#1E3A8A' },
  { id: 'ATS Minimal', name: 'ATS Minimal', desc: '100% ATS Clean', accent: '#000000' },
] as const;

const COUNTRIES = [
  { country: 'Qatar', currency: 'QAR', symbol: 'QAR', law: 'Qatar Labour Law No.14/2004' },
  { country: 'Australia', currency: 'AUD', symbol: 'A$', law: 'Fair Work Act 2009' },
  { country: 'UAE', currency: 'AED', symbol: 'AED', law: 'UAE Labour Law' },
  { country: 'Saudi Arabia', currency: 'SAR', symbol: 'SAR', law: 'Saudi Labour Law' },
  { country: 'United Kingdom', currency: 'GBP', symbol: '£', law: 'Employment Rights Act 1996' },
  { country: 'USA', currency: 'USD', symbol: '$', law: 'FLSA' },
  { country: 'Canada', currency: 'CAD', symbol: 'C$', law: 'Canada Labour Code' },
  { country: 'India', currency: 'INR', symbol: '₹', law: 'Companies Act' },
] as const;

export default function CVBuilderProPage() {
  const [step, setStep] = useState(1);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savedCv, setSavedCv] = useState<SavedCv | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState('');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [template, setTemplate] = useState(TEMPLATES[0].id);
  const [selectedCountry, setSelectedCountry] = useState<(typeof COUNTRIES)[number]>(COUNTRIES[0]);
  const [expectedSalary, setExpectedSalary] = useState('15000');
  const [contact, setContact] = useState({ fullName: '', email: '', phone: '', location: 'Doha, Qatar', linkedin: '', title: '' });
  const [summary, setSummary] = useState('');
  const [targetJD, setTargetJD] = useState('');
  const [exps, setExps] = useState<Exp[]>([{ title: 'Senior Operations Specialist', company: 'TMG Business Consulting', location: 'Doha, QA', from: '2022-01', to: 'Present', current: true, bullets: 'Led operations improving efficiency by 35%\nManaged team of 12', salary: '15000' }]);
  const [edus, setEdus] = useState<Edu[]>([{ degree: 'MBA', school: 'University', year: '2020' }]);
  const [skills, setSkills] = useState('Project Management, Business Analysis');
  const [langs, setLangs] = useState('English - Fluent, Arabic - Native');
  const [certs, setCerts] = useState('');

  const currentTpl = TEMPLATES.find(t => t.id === template) || TEMPLATES[0];

  useEffect(() => { setToken(sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken') || ''); }, []);
  useEffect(() => { return () => { if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl); }; }, [pdfBlobUrl]);

  useEffect(() => {
    if (!savedCv?.id || !token) return;
    (async () => {
      try {
        const res = await fetch(`/api/cv-documents/file/${savedCv.id}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const blob = await res.blob();
        if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
        setPdfBlobUrl(URL.createObjectURL(blob));
      } catch { }
    })();
  }, [savedCv?.id]);

  const handleCountryChange = (name: string) => {
    const c = COUNTRIES.find(x => x.country === name) || COUNTRIES[0];
    setSelectedCountry(c);
    setContact(prev => ({ ...prev, location: c.country }));
  };

  const handleGenerate = async () => {
    if (!token) { setError('Sign in required'); return; }
    if (!contact.fullName || !contact.title) { setError('Full Name and Title required'); return; }
    setLoading(true); setError('');
    try {
      const payload = {
        name: contact.fullName, role: contact.title,
        contact: { ...contact, location: selectedCountry.country },
        summary, exps: exps.map(e => ({ ...e, salary: e.salary || expectedSalary })),
        edus, skills, langs, certs, targetJD, template,
        currency: selectedCountry.currency, country: selectedCountry.country, expectedSalary,
      };
      const result = await apiRequest<SavedCv>('/cv-documents', token, { method: 'POST', body: JSON.stringify(payload) });
      setSavedCv(result);
      setStep(4);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#FCFCF9]">
      <div className="max-w-7xl mx-auto px-6 py-10 md:py-14">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#D4AF37]">AI Tool • 10 Countries</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900">CV Builder Pro</h1>
            <p className="mt-2 text-sm text-zinc-500">{selectedCountry.country} • {selectedCountry.currency} ({selectedCountry.symbol}) • {selectedCountry.law}</p>
          </div>
          <Link href="/dashboard/cvs" className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold">My CVs</Link>
        </div>

        {/* Controls - Premium */}
        <div className="mt-6 flex flex-wrap gap-2">
          <button onClick={() => setShowTemplateModal(true)} className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium flex items-center gap-2 shadow-sm hover:border-zinc-900">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: currentTpl.accent }} />{currentTpl.name}
          </button>
          <select value={selectedCountry.country} onChange={e => handleCountryChange(e.target.value)} className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium">
            {COUNTRIES.map(c => <option key={c.country} value={c.country}>{c.country} — {c.currency}</option>)}
          </select>
          <span className="rounded-full bg-zinc-900 text-white px-3 py-2 text-xs font-bold">{selectedCountry.symbol} Premium</span>
          <input value={expectedSalary} onChange={e => setExpectedSalary(e.target.value)} className="rounded-full border border-zinc-200 px-3 py-2 text-sm w-28 bg-white font-medium" placeholder="Salary" />
        </div>

        {/* Stepper */}
        <div className="mt-6 flex gap-2">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className={`h-1.5 flex-1 rounded-full transition-all ${step >= n ? 'bg-zinc-900' : 'bg-zinc-200'}`} />
          ))}
        </div>

        {showTemplateModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-[24px] max-w-3xl w-full p-6 shadow-2xl border border-zinc-200">
              <div className="flex justify-between items-center mb-5"><h2 className="text-lg font-semibold">Templates</h2><button onClick={() => setShowTemplateModal(false)} className="h-8 w-8 rounded-full bg-zinc-100 grid place-items-center">×</button></div>
              <div className="grid md:grid-cols-2 gap-3">
                {TEMPLATES.map(t => (
                  <button key={t.id} onClick={() => { setTemplate(t.id); setShowTemplateModal(false); }} className={`text-left rounded-[16px] border p-4 hover:border-zinc-900 transition-all ${template === t.id ? 'border-zinc-900 ring-1 ring-zinc-900' : 'border-zinc-200 bg-zinc-50'}`}>
                    <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: t.accent }} /><span className="text-sm font-semibold">{t.name}</span></div>
                    <div className="text-xs text-zinc-500 mt-1">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6 mt-8">
          <div className="rounded-[24px] border border-zinc-200 bg-white p-6 md:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-zinc-900">Contact & Target</h3>
                <div className="grid gap-3">
                  <input placeholder="Full Name *" className="rounded-[12px] border border-zinc-200 bg-zinc-50 p-3 text-sm focus:bg-white focus:border-zinc-900 focus:outline-none" value={contact.fullName} onChange={e => setContact({ ...contact, fullName: e.target.value })} />
                  <input placeholder="Professional Title *" className="rounded-[12px] border border-zinc-200 bg-zinc-50 p-3 text-sm focus:bg-white focus:border-zinc-900 focus:outline-none" value={contact.title} onChange={e => setContact({ ...contact, title: e.target.value })} />
                  <div className="grid grid-cols-2 gap-3">
                    <input placeholder="Email" className="rounded-[12px] border border-zinc-200 bg-zinc-50 p-3 text-sm" value={contact.email} onChange={e => setContact({ ...contact, email: e.target.value })} />
                    <input placeholder="Phone" className="rounded-[12px] border border-zinc-200 bg-zinc-50 p-3 text-sm" value={contact.phone} onChange={e => setContact({ ...contact, phone: e.target.value })} />
                  </div>
                  <textarea placeholder="Professional Summary" className="w-full rounded-[12px] border border-zinc-200 bg-zinc-50 p-3 text-sm h-24 focus:bg-white focus:border-zinc-900 focus:outline-none" value={summary} onChange={e => setSummary(e.target.value)} />
                </div>
                <button onClick={() => setStep(2)} className="w-full rounded-full bg-zinc-900 text-white py-3 text-sm font-semibold hover:bg-black">Next — Experience</button>
              </div>
            )}
            {step === 2 && (
              <div className="space-y-4">
                <h3 className="font-semibold">Experience • {selectedCountry.symbol}</h3>
                {exps.map((ex, i) => (
                  <div key={i} className="rounded-[16px] border border-zinc-100 bg-zinc-50 p-4 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input placeholder="Job Title" className="rounded-[10px] border border-zinc-200 p-2.5 text-sm bg-white" value={ex.title} onChange={e => { const c = [...exps]; c[i].title = e.target.value; setExps(c); }} />
                      <input placeholder="Company" className="rounded-[10px] border border-zinc-200 p-2.5 text-sm bg-white" value={ex.company} onChange={e => { const c = [...exps]; c[i].company = e.target.value; setExps(c); }} />
                    </div>
                    <textarea placeholder="Achievements (one per line)" className="w-full rounded-[10px] border border-zinc-200 p-2.5 text-sm bg-white h-20" value={ex.bullets} onChange={e => { const c = [...exps]; c[i].bullets = e.target.value; setExps(c); }} />
                  </div>
                ))}
                <div className="flex gap-2"><button onClick={() => setStep(1)} className="rounded-full border border-zinc-200 px-5 py-2.5 text-sm">Back</button><button onClick={() => setStep(3)} className="flex-1 rounded-full bg-zinc-900 text-white py-2.5 text-sm font-semibold">Next — Education</button></div>
              </div>
            )}
            {step === 3 && (
              <div className="space-y-4">
                <h3 className="font-semibold">Education & Skills</h3>
                <textarea placeholder="Skills" className="w-full rounded-[12px] border border-zinc-200 bg-zinc-50 p-3 text-sm" value={skills} onChange={e => setSkills(e.target.value)} />
                <textarea placeholder="Languages" className="w-full rounded-[12px] border border-zinc-200 bg-zinc-50 p-3 text-sm" value={langs} onChange={e => setLangs(e.target.value)} />
                <input placeholder={`Expected Salary (${selectedCountry.symbol})`} className="w-full rounded-[12px] border border-zinc-200 bg-white p-3 text-sm font-bold" value={expectedSalary} onChange={e => setExpectedSalary(e.target.value)} />
                <button onClick={handleGenerate} disabled={loading} className="w-full rounded-full bg-zinc-900 text-white py-3.5 text-sm font-bold hover:bg-black disabled:opacity-50">{loading ? 'Generating...' : `Generate ${currentTpl.name}`}</button>
                {error && <p className="text-sm text-red-600">{error}</p>}
              </div>
            )}
            {step === 4 && savedCv && (
              <div className="text-center py-10">
                <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 grid place-items-center mx-auto font-bold">✓</div>
                <h3 className="mt-4 font-semibold">CV Generated</h3>
                <p className="text-sm text-zinc-500 mt-1">{selectedCountry.country} • {selectedCountry.symbol} {expectedSalary}</p>
                <div className="mt-5 flex gap-2 justify-center">
                  {pdfBlobUrl && <a href={pdfBlobUrl} download={`${contact.fullName}-CV.pdf`} className="rounded-full bg-zinc-900 text-white px-5 py-2.5 text-sm">Download</a>}
                  <button onClick={() => setStep(1)} className="rounded-full border px-5 py-2.5 text-sm">New CV</button>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-[24px] border border-zinc-200 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            {!savedCv ? (
              <div className="text-center py-20">
                <div className="h-16 w-16 rounded-[16px] bg-zinc-900 mx-auto grid place-items-center"><span className="h-3 w-3 rounded-full bg-[#D4AF37]" /></div>
                <h3 className="mt-5 font-semibold text-zinc-900">Premium CV Preview</h3>
                <p className="text-sm text-zinc-500 mt-2 max-w-[260px] mx-auto">For {selectedCountry.country} — {selectedCountry.currency} ({selectedCountry.symbol})<br />{selectedCountry.law}</p>
              </div>
            ) : (
              pdfBlobUrl && <iframe src={pdfBlobUrl} className="w-full h-[650px] rounded-[16px] border border-zinc-200 bg-white" />
            )}
          </div>
        </div>
        <div className="mt-6"><AiDataNotice /></div>
      </div>
    </div>
  );
}