'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/project-delivery';
import AiDataNotice from '../ai-data-notice';

type Exp = { title: string; company: string; location: string; from: string; to: string; current: boolean; bullets: string; salary?: string; };
type Edu = { degree: string; school: string; year: string; };
type SavedCv = { id: string; title: string; content: string; createdAt: string; currency?: string; symbol?: string; country?: string; };

const TEMPLATES = [
  { id: 'Qatar Professional', name: 'Qatar Professional', desc: 'GCC Formal + Gold', header: '#0F172A', accent: '#D4AF37', text: 'Qatar, UAE, KSA' },
  { id: 'Australia Professional', name: 'Australia Professional', desc: 'ASIC + Blue + Fair Work', header: '#0F172A', accent: '#0066CC', text: 'Australia ABN/ACN' },
  { id: 'UK Professional', name: 'UK Professional', desc: 'UKVI + Equality Act', header: '#1E293B', accent: '#8B0000', text: 'UK Right to Work' },
  { id: 'US Standard', name: 'US Standard', desc: 'FLSA + EEOC + ATS 95%', header: '#0F172A', accent: '#D4AF37', text: 'USA USCIS' },
  { id: 'Corporate Executive', name: 'Corporate Executive', desc: 'US Executive Blue', header: '#1E3A8A', accent: '#3B82F6', text: 'CEO Manager' },
  { id: 'ATS Minimal', name: 'ATS Minimal', desc: '100% ATS Clean', header: '#FFFFFF', accent: '#000000', text: 'Portals & robots' },
] as const;

const COUNTRIES = [
  { country: 'Qatar', currency: 'QAR', symbol: 'QAR ', law: 'Qatar Labour Law No.14/2004', flag: '🇶🇦' },
  { country: 'Australia', currency: 'AUD', symbol: 'A$', law: 'Fair Work Act 2009', flag: '🇦🇺' },
  { country: 'UAE', currency: 'AED', symbol: 'AED ', law: 'UAE Labour Law', flag: '🇦🇪' },
  { country: 'Saudi Arabia', currency: 'SAR', symbol: 'SAR ', law: 'Saudi Labour Law', flag: '🇸🇦' },
  { country: 'United Kingdom', currency: 'GBP', symbol: '£', law: 'Employment Rights Act 1996', flag: '🇬🇧' },
  { country: 'USA', currency: 'USD', symbol: '$', law: 'FLSA', flag: '🇺🇸' },
  { country: 'Canada', currency: 'CAD', symbol: 'C$', law: 'Canada Labour Code', flag: '🇨🇦' },
  { country: 'India', currency: 'INR', symbol: '₹', law: 'Shops Act', flag: '🇮🇳' },
  { country: 'Singapore', currency: 'SGD', symbol: 'S$', law: 'Employment Act', flag: '🇸🇬' },
  { country: 'EU', currency: 'EUR', symbol: '€', law: 'EU Directive', flag: '🇪🇺' },
] as const;

export default function CVBuilderProPage() {
  const [step, setStep] = useState(1);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savedCv, setSavedCv] = useState<SavedCv | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState('');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [template, setTemplate] = useState('Qatar Professional');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
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

  useEffect(() => { setToken(sessionStorage.getItem('accessToken') ?? ''); }, []);
  useEffect(() => {
    if (!savedCv?.id || !token) return;
    (async () => {
      try {
        const base = process.env.NEXT_PUBLIC_API_URL || '/api';
        const res = await fetch(`${base}/cv-documents/file/${savedCv.id}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const blob = await res.blob();
        setPdfBlobUrl(URL.createObjectURL(blob));
      } catch {}
    })();
  }, [savedCv?.id, token]);

  const handleCountryChange = (countryName: string) => {
    const c = COUNTRIES.find(x => x.country === countryName) || COUNTRIES[0];
    setSelectedCountry(c);
    setContact(prev => ({ ...prev, location: c.country }));
    if (c.country === 'Australia') setTemplate('Australia Professional');
    else if (c.country === 'United Kingdom') setTemplate('UK Professional');
    else if (c.country === 'USA') setTemplate('US Standard');
  };

  const handleGenerate = async () => {
    if (!token) { setError('Sign in required'); return; }
    if (!contact.fullName || !contact.title) { setError('Full Name and Title required'); return; }
    setLoading(true); setError('');
    try {
      const payload = {
        name: contact.fullName,
        role: contact.title,
        contact: { ...contact, location: selectedCountry.country },
        summary,
        exps: exps.map(e => ({ ...e, salary: e.salary || expectedSalary })),
        edus,
        skills,
        langs,
        certs,
        targetJD,
        template,
        currency: selectedCountry.currency,
        country: selectedCountry.country,
        expectedSalary,
        salary: expectedSalary
      };
      const result = await apiRequest<SavedCv>('/cv-documents', token, { method: 'POST', body: JSON.stringify(payload) });
      setSavedCv(result);
      setStep(4);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  const updateExp = (i: number, field: keyof Exp, value: any) => {
    const c = [...exps];
    (c[i] as any)[field] = value;
    setExps(c);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">CV Builder Pro</h1>
          <p className="text-xs text-gray-600 mt-1">{selectedCountry.flag} {selectedCountry.country} | {selectedCountry.currency} ({selectedCountry.symbol}) | {selectedCountry.law}</p>
        </div>
        <Link href="/dashboard/cvs" className="text-sm underline">My CVs</Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 items-center">
        <button onClick={() => setShowTemplateModal(true)} className="flex items-center gap-2 border rounded-full px-3 py-1.5 text-xs bg-white shadow-sm">
          <span className="w-3 h-3 rounded-full" style={{ background: currentTpl.header, border: '1px solid #ddd' }}></span>
          <span className="w-3 h-3 rounded-full" style={{ background: currentTpl.accent }}></span>
          {currentTpl.name}
        </button>
        <select value={selectedCountry.country} onChange={e => handleCountryChange(e.target.value)} className="border rounded-full px-3 py-1.5 text-xs bg-white font-semibold">
          {COUNTRIES.map(c => <option key={c.country} value={c.country}>{c.flag} {c.country} - {c.currency} ({c.symbol})</option>)}
        </select>
        <span className="text-xs bg-black text-white px-2 py-1 rounded-full">{selectedCountry.symbol} {selectedCountry.currency} Premium</span>
        <input value={expectedSalary} onChange={e => setExpectedSalary(e.target.value)} className="border rounded-full px-3 py-1 text-xs w-28 bg-amber-50 font-bold" placeholder="Salary" />
      </div>

      {showTemplateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-5"><h2 className="text-xl font-bold">Template - {selectedCountry.country}</h2><button onClick={() => setShowTemplateModal(false)} className="text-2xl">×</button></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {TEMPLATES.map(t => (
                <button key={t.id} onClick={() => { setTemplate(t.id); setShowTemplateModal(false); }} className={`text-left border-2 rounded-xl overflow-hidden hover:scale-[1.02] transition-all ${template === t.id ? 'border-black ring-2 ring-black' : 'border-gray-200'}`}>
                  <div className="h-16 flex items-center px-4" style={{ background: t.header }}><div className="font-bold text-sm" style={{ color: t.id === 'ATS Minimal' ? 'black' : 'white' }}>{t.name}</div><div className="ml-auto w-6 h-6 rounded-full" style={{ background: t.accent }}></div></div>
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
              <h3 className="font-bold text-sm">Contact & Target - {selectedCountry.flag} {selectedCountry.country}</h3>
              <input placeholder="Full Name *" className="border p-2 rounded w-full" value={contact.fullName} onChange={e => setContact({ ...contact, fullName: e.target.value })} />
              <input placeholder="Professional Title *" className="border p-2 rounded w-full" value={contact.title} onChange={e => setContact({ ...contact, title: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="Email" className="border p-2 rounded w-full" value={contact.email} onChange={e => setContact({ ...contact, email: e.target.value })} />
                <input placeholder="Phone" className="border p-2 rounded w-full" value={contact.phone} onChange={e => setContact({ ...contact, phone: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="Location" className="border p-2 rounded w-full" value={contact.location} onChange={e => setContact({ ...contact, location: e.target.value })} />
                <input placeholder="LinkedIn" className="border p-2 rounded w-full" value={contact.linkedin} onChange={e => setContact({ ...contact, linkedin: e.target.value })} />
              </div>
              <textarea placeholder="Professional Summary" className="w-full border p-2 rounded h-24" value={summary} onChange={e => setSummary(e.target.value)} />
              <textarea placeholder="Target Job Description (ATS)" className="w-full border p-2 rounded h-20 bg-amber-50" value={targetJD} onChange={e => setTargetJD(e.target.value)} />
              <button onClick={() => setStep(2)} className="bg-black text-white px-5 py-2 rounded w-full">Next — Experience (Step 2)</button>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-3">
              <h3 className="font-bold text-sm">Experience — {selectedCountry.symbol} {selectedCountry.currency}</h3>
              {exps.map((ex, i) => (
                <div key={i} className="border p-3 rounded space-y-2 bg-gray-50/50">
                  <div className="grid grid-cols-2 gap-2">
                    <input placeholder="Job Title" className="border p-2 rounded text-sm bg-white" value={ex.title} onChange={e => updateExp(i, 'title', e.target.value)} />
                    <input placeholder="Company" className="border p-2 rounded text-sm bg-white" value={ex.company} onChange={e => updateExp(i, 'company', e.target.value)} />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <input placeholder="Location" className="border p-2 rounded text-sm bg-white" value={ex.location} onChange={e => updateExp(i, 'location', e.target.value)} />
                    <input placeholder="From YYYY-MM" className="border p-2 rounded text-sm bg-white" value={ex.from} onChange={e => updateExp(i, 'from', e.target.value)} />
                    <input placeholder="To" className="border p-2 rounded text-sm bg-white" value={ex.to} onChange={e => updateExp(i, 'to', e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <textarea placeholder="Achievements" className="border p-2 rounded h-20 text-sm bg-white" value={ex.bullets} onChange={e => updateExp(i, 'bullets', e.target.value)} />
                    <input placeholder={`Salary ${selectedCountry.symbol}`} className="border p-2 rounded text-sm bg-white h-10" value={ex.salary||''} onChange={e => updateExp(i, 'salary', e.target.value)} />
                  </div>
                </div>
              ))}
              <button onClick={() => setExps([...exps, { title: '', company: '', location: selectedCountry.country, from: '', to: 'Present', current: true, bullets: '', salary: expectedSalary }])} className="text-xs border px-3 py-1 rounded">+ Add Experience</button>
              <div className="flex gap-2"><button onClick={() => setStep(1)} className="border px-4 py-2 rounded text-sm">Back</button><button onClick={() => setStep(3)} className="bg-black text-white px-5 py-2 rounded text-sm flex-1">Next — Education (Step 3)</button></div>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-3">
              <h3 className="font-bold text-sm">Education & Skills — {selectedCountry.country}</h3>
              {edus.map((ed, i) => (
                <div key={i} className="grid grid-cols-3 gap-2">
                  <input placeholder="Degree" className="border p-2 rounded text-sm" value={ed.degree} onChange={e => { const c = [...edus]; c[i].degree = e.target.value; setEdus(c); }} />
                  <input placeholder="School" className="border p-2 rounded text-sm" value={ed.school} onChange={e => { const c = [...edus]; c[i].school = e.target.value; setEdus(c); }} />
                  <input placeholder="Year" className="border p-2 rounded text-sm" value={ed.year} onChange={e => { const c = [...edus]; c[i].year = e.target.value; setEdus(c); }} />
                </div>
              ))}
              <button onClick={() => setEdus([...edus, { degree: '', school: '', year: '' }])} className="text-xs border px-3 py-1 rounded">+ Add Education</button>
              <textarea placeholder="Skills" className="w-full border p-2 rounded" value={skills} onChange={e => setSkills(e.target.value)} />
              <textarea placeholder="Languages" className="w-full border p-2 rounded" value={langs} onChange={e => setLangs(e.target.value)} />
              <textarea placeholder="Certifications" className="w-full border p-2 rounded" value={certs} onChange={e => setCerts(e.target.value)} />
              <label className="text-xs">Expected Salary ({selectedCountry.symbol} {selectedCountry.currency})<input className="border p-2 rounded w-full mt-1 font-bold bg-amber-50" value={expectedSalary} onChange={e => setExpectedSalary(e.target.value)} /></label>
              <button onClick={handleGenerate} disabled={loading} className="bg-[#0F172A] text-white px-5 py-3 rounded w-full font-bold mt-2">{loading ? 'Generating...' : `Generate ${currentTpl.name} — ${selectedCountry.flag} ${selectedCountry.symbol} ${expectedSalary} ${selectedCountry.currency}`}</button>
              <div className="flex gap-2"><button onClick={() => setStep(2)} className="border px-4 py-2 rounded text-sm">Back</button></div>
              {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
            </div>
          )}
          {step === 4 && (
            <div><h3 className="font-bold text-green-700">CV Generated — {selectedCountry.flag} {selectedCountry.country} | {selectedCountry.symbol} {selectedCountry.currency}</h3>{pdfBlobUrl && <iframe src={pdfBlobUrl} className="w-full h-[500px] border rounded mt-3" />}<div className="flex gap-2 mt-3">{pdfBlobUrl && <a href={pdfBlobUrl} download={`${contact.fullName}-CV-${selectedCountry.country}.pdf`} className="bg-black text-white px-4 py-2 rounded text-sm">Download PDF</a>}<button onClick={() => setStep(1)} className="border px-4 py-2 rounded text-sm">New CV</button></div></div>
          )}
        </div>
        <div className="border rounded-xl p-5 bg-white shadow-sm">
          {!savedCv ? (
            <div className="text-center py-20"><div className="text-5xl mb-4">{selectedCountry.flag}</div><h3 className="font-bold">Premium International CV</h3><p className="text-sm text-gray-600 mt-2">For {selectedCountry.country} — {selectedCountry.currency} ({selectedCountry.symbol})<br/>{selectedCountry.law}<br/>Salary: {selectedCountry.symbol} {expectedSalary} {selectedCountry.currency}</p></div>
          ) : (
            <div><h3 className="font-bold text-green-700">Preview — {selectedCountry.country}</h3>{pdfBlobUrl && <iframe src={pdfBlobUrl} className="w-full h-[600px] border rounded mt-3" />}<div className="mt-3 text-xs text-gray-500 p-2 bg-gray-50 rounded">{selectedCountry.law} | {selectedCountry.currency} Premium | TMG International</div></div>
          )}
        </div>
      </div>
    </div>
  );
}
