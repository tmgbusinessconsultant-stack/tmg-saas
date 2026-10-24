'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/project-delivery';
import AiDataNotice from '../ai-data-notice';

type SavedDoc = { id: string; title: string; content: string; createdAt: string; currency?: string; symbol?: string; country?: string; };

const TEMPLATES = [
  { id: 'Qatar Professional', name: 'Qatar Professional', desc: 'GCC Formal + Gold', header: '#0F172A', accent: '#D4AF37', text: 'Qatar, UAE, KSA' },
  { id: 'Australia Professional', name: 'Australia Professional', desc: 'ASIC + Blue + Fair Work', header: '#0F172A', accent: '#0066CC', text: 'Australia, ABN/ACN' },
  { id: 'UK Professional', name: 'UK Professional', desc: 'UKVI + Equality Act', header: '#1E293B', accent: '#8B0000', text: 'UK, Right to Work' },
  { id: 'US Standard', name: 'US Standard', desc: 'FLSA + EEOC + ATS 95%', header: '#0F172A', accent: '#D4AF37', text: 'USA, USCIS' },
  { id: 'Corporate Executive', name: 'Corporate Executive', desc: 'US Executive Blue', header: '#1E3A8A', accent: '#3B82F6', text: 'CEO, Manager' },
  { id: 'ATS Minimal', name: 'ATS Minimal', desc: '100% ATS Clean', header: '#FFFFFF', accent: '#000000', text: 'Portals & Robots' },
] as const;

const COUNTRIES = [
  { country: 'Qatar', currency: 'QAR', symbol: 'QAR ', law: 'Qatar Labour Law No.14/2004', tax: 'No Income Tax', flag: '🇶🇦' },
  { country: 'Australia', currency: 'AUD', symbol: 'A$', law: 'Fair Work Act 2009', tax: 'GST 10%', flag: '🇦🇺' },
  { country: 'UAE', currency: 'AED', symbol: 'AED ', law: 'UAE Labour Law Federal Decree No.33/2021', tax: '5% VAT', flag: '🇦🇪' },
  { country: 'Saudi Arabia', currency: 'SAR', symbol: 'SAR ', law: 'Saudi Labour Law, MHRSD', tax: '15% VAT', flag: '🇸🇦' },
  { country: 'United Kingdom', currency: 'GBP', symbol: '£', law: 'Employment Rights Act 1996', tax: 'PAYE', flag: '🇬🇧' },
  { country: 'USA', currency: 'USD', symbol: '$', law: 'FLSA, Title VII', tax: 'Federal/State', flag: '🇺🇸' },
  { country: 'Canada', currency: 'CAD', symbol: 'C$', law: 'Canada Labour Code', tax: 'GST/HST', flag: '🇨🇦' },
  { country: 'India', currency: 'INR', symbol: '₹', law: 'Shops & Establishments', tax: 'GST 18%', flag: '🇮🇳' },
  { country: 'Singapore', currency: 'SGD', symbol: 'S$', law: 'Employment Act, MOM', tax: '7% GST', flag: '🇸🇬' },
  { country: 'EU', currency: 'EUR', symbol: '€', law: 'EU Labour Directive', tax: '19-25%', flag: '🇪🇺' },
] as const;

export default function CoverLetterProPage() {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savedDoc, setSavedDoc] = useState<SavedDoc | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState('');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [template, setTemplate] = useState('Qatar Professional');
  const [selectedCountry, setselectedCountry] = useState<any>(COUNTRIES[0]);

  const [form, setForm] = useState({
    applicantName: '',
    position: '',
    companyName: '',
    expectedSalary: '15000',
    email: '',
    phone: '',
    experience: '',
    achievements: '',
    skills: '',
    motivation: '',
    closing: ''
  });

  const currentTpl = TEMPLATES.find(t => t.id === template) || TEMPLATES[0];

  useEffect(() => { setToken(sessionStorage.getItem('accessToken') ?? ''); }, []);
  useEffect(() => {
    if (!savedDoc?.id || !token) return;
    (async () => {
      try {
        const base = process.env.NEXT_PUBLIC_API_URL || '/api';
        const res = await fetch(`${base}/cv-documents/file/${savedDoc.id}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const blob = await res.blob();
        setPdfBlobUrl(URL.createObjectURL(blob));
      } catch {}
    })();
  }, [savedDoc?.id, token]);

  const handleCountryChange = (countryName: string) => {
    const c = COUNTRIES.find(x => x.country === countryName) || COUNTRIES[0];
    setselectedCountry(c);
    // Auto-switch template for country
    if (c.country === 'Australia') setTemplate('Australia Professional');
    else if (c.country === 'United Kingdom') setTemplate('UK Professional');
    else if (c.country === 'USA') setTemplate('US Standard');
    else if (c.country === 'Qatar' || c.country === 'UAE' || c.country === 'Saudi Arabia') setTemplate('Qatar Professional');
  };

  const handleGenerate = async () => {
    if (!token) { setError('Sign in required'); return; }
    if (!form.applicantName || !form.position || !form.companyName) { setError('Name, Position, Company required'); return; }
    setLoading(true); setError('');
    try {
      const payload = {
        documentType: 'cover-letter',
        type: 'cover-letter',
        template,
        country: selectedCountry.country,
        currency: selectedCountry.currency,
        expectedSalary: form.expectedSalary,
        salary: form.expectedSalary,
        applicantName: form.applicantName,
        name: form.applicantName,
        position: form.position,
        role: form.position,
        companyName: form.companyName,
        company: form.companyName,
        email: form.email,
        phone: form.phone,
        contact: { fullName: form.applicantName, title: form.position, email: form.email, phone: form.phone, location: selectedCountry.country },
        experience: form.experience,
        achievements: form.achievements,
        skills: form.skills,
        motivation: form.motivation,
        closing: form.closing,
        coverLetterBody: `I am writing to express my strong interest in the ${form.position} position at ${form.companyName} within the ${selectedCountry.country} market. ${form.experience}`,
        paragraph2: form.achievements,
        paragraph3: form.motivation
      };
      const result = await apiRequest<SavedDoc>('/cv-documents', token, { method: 'POST', body: JSON.stringify(payload) });
      setSavedDoc(result);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Cover Letter Builder Pro</h1>
          <p className="text-sm text-gray-600 mt-1">{selectedCountry.flag} {selectedCountry.country} | {selectedCountry.currency} ({selectedCountry.symbol}) | {selectedCountry.law} | {selectedCountry.tax}</p>
        </div>
        <Link href="/dashboard/cvs" className="text-sm underline">My Documents</Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 items-center">
        <button onClick={() => setShowTemplateModal(true)} className="flex items-center gap-2 border rounded-full px-3 py-1.5 text-xs bg-white shadow-sm hover:shadow">
          <span className="w-3 h-3 rounded-full" style={{ background: currentTpl.header, border: '1px solid #ddd' }}></span>
          <span className="w-3 h-3 rounded-full" style={{ background: currentTpl.accent }}></span>
          {currentTpl.name}
        </button>
        <select value={selectedCountry.country} onChange={e => handleCountryChange(e.target.value)} className="border rounded-full px-3 py-1.5 text-xs bg-white font-semibold">
          {COUNTRIES.map(c => <option key={c.country} value={c.country}>{c.flag} {c.country} - {c.currency} ({c.symbol})</option>)}
        </select>
        <span className="text-xs bg-black text-white px-2 py-1 rounded-full">{selectedCountry.symbol} {selectedCountry.currency} Premium</span>
      </div>

      {showTemplateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold">Choose Template - {selectedCountry.country}</h2>
              <button onClick={() => setShowTemplateModal(false)} className="text-2xl">×</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {TEMPLATES.map(t => (
                <button key={t.id} onClick={() => { setTemplate(t.id); setShowTemplateModal(false); }} className={`text-left border-2 rounded-xl overflow-hidden hover:scale-[1.02] transition-all ${template === t.id ? 'border-black ring-2 ring-black' : 'border-gray-200'}`}>
                  <div className="h-16 flex items-center px-4" style={{ background: t.header }}>
                    <div className="font-bold text-sm" style={{ color: t.id === 'ATS Minimal' ? 'black' : 'white' }}>{t.name}</div>
                    <div className="ml-auto w-6 h-6 rounded-full" style={{ background: t.accent }}></div>
                  </div>
                  <div className="p-3 bg-gray-50"><div className="text-xs font-semibold">{t.desc}</div><div className="text-[11px] text-gray-500 mt-1">{t.text}</div></div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <div className="border rounded-xl p-5 bg-white shadow-sm space-y-4">
          <h3 className="font-bold text-sm">Applicant & Target — {selectedCountry.country} ({selectedCountry.currency})</h3>
          <input placeholder="Full Name *" className="border p-2 rounded w-full font-semibold" value={form.applicantName} onChange={e => setForm({ ...form, applicantName: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <input placeholder="Target Position *" className="border p-2 rounded w-full text-sm" value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} />
            <input placeholder="Company Name *" className="border p-2 rounded w-full text-sm" value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <input placeholder="Email" className="border p-2 rounded w-full text-sm" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            <input placeholder="Phone" className="border p-2 rounded w-full text-sm" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            <label className="text-xs">Salary ({selectedCountry.symbol} {selectedCountry.currency})<input className="border p-2 rounded w-full mt-1 font-bold bg-amber-50" value={form.expectedSalary} onChange={e => setForm({ ...form, expectedSalary: e.target.value })} /></label>
          </div>

          <h3 className="font-bold text-sm mt-4">Content — {selectedCountry.law}</h3>
          <textarea placeholder={`Experience relevant to ${selectedCountry.country} market`} className="w-full border p-2 rounded h-20 text-sm" value={form.experience} onChange={e => setForm({ ...form, experience: e.target.value })} />
          <textarea placeholder="Key Achievements with numbers" className="w-full border p-2 rounded h-20 text-sm bg-blue-50/50" value={form.achievements} onChange={e => setForm({ ...form, achievements: e.target.value })} />
          <textarea placeholder="Skills" className="w-full border p-2 rounded h-16 text-sm" value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })} />
          <textarea placeholder={`Why ${form.companyName || 'this company'} in ${selectedCountry.country}? Motivation`} className="w-full border p-2 rounded h-20 text-sm" value={form.motivation} onChange={e => setForm({ ...form, motivation: e.target.value })} />

          <button onClick={handleGenerate} disabled={loading} className="bg-[#0F172A] text-white px-5 py-3 rounded w-full font-bold">
            {loading ? 'Generating...' : `Generate Cover Letter — ${selectedCountry.flag} ${selectedCountry.country} | ${selectedCountry.symbol} ${form.expectedSalary} ${selectedCountry.currency}`}
          </button>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <AiDataNotice />
        </div>

        <div className="border rounded-xl p-5 bg-white shadow-sm">
          {!savedDoc ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-20">
              <div className="text-5xl mb-4">{selectedCountry.flag}</div>
              <h3 className="font-bold">Premium International Cover Letter</h3>
              <p className="text-sm text-gray-600 mt-2 max-w-sm">For {selectedCountry.country} market — {selectedCountry.currency} ({selectedCountry.symbol})<br/>Law: {selectedCountry.law}<br/>Tax: {selectedCountry.tax}<br/>Salary: {selectedCountry.symbol} {form.expectedSalary || '15000'} {selectedCountry.currency}</p>
              <div className="mt-4 text-xs bg-gray-100 px-3 py-1 rounded-full">{currentTpl.name} | {selectedCountry.country}</div>
            </div>
          ) : (
            <div>
              <h3 className="font-bold text-green-700">Cover Letter Generated — {savedDoc.country} | {savedDoc.symbol} {savedDoc.currency}</h3>
              {pdfBlobUrl && <iframe src={pdfBlobUrl} className="w-full h-[600px] border rounded mt-3" />}
              <div className="flex gap-2 mt-3">
                {pdfBlobUrl && <a href={pdfBlobUrl} download={`${form.applicantName}-Cover-Letter-${selectedCountry.country}-${selectedCountry.currency}.pdf`} className="bg-black text-white px-4 py-2 rounded text-sm">Download PDF — {selectedCountry.symbol} {selectedCountry.currency}</a>}
                <button onClick={() => { setSavedDoc(null); setPdfBlobUrl(''); }} className="border px-4 py-2 rounded text-sm">New Letter</button>
              </div>
              <div className="mt-3 text-xs text-gray-500 p-2 bg-gray-50 rounded">Compliance: {selectedCountry.law} | {selectedCountry.law || selectedCountry.tax} | TMG Premium International</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}




