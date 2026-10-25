'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/project-delivery';
import AiDataNotice from '../ai-data-notice';

type SavedDoc = { id: string; title: string; content: string; createdAt: string; currency?: string; };

const COUNTRIES = [
  { country: 'Qatar', currency: 'QAR', symbol: 'QAR', law: 'Qatar Labour Law No.14/2004, QFC' },
  { country: 'Australia', currency: 'AUD', symbol: 'A$', law: 'Fair Work Act 2009, WHS Act 2011' },
  { country: 'UAE', currency: 'AED', symbol: 'AED', law: 'UAE Labour Law Decree No.33' },
  { country: 'Saudi Arabia', currency: 'SAR', symbol: 'SAR', law: 'Saudi Labour Law' },
  { country: 'United Kingdom', currency: 'GBP', symbol: '£', law: 'Employment Rights Act 1996' },
  { country: 'USA', currency: 'USD', symbol: '$', law: 'FLSA, Title VII' },
] as const;

const POLICY_TYPES = ['HR Policy', 'Leave Policy', 'Remote Work Policy', 'Code of Conduct', 'Health & Safety Policy', 'Data Protection Policy', 'Anti-Harassment Policy', 'Compensation Policy'] as const;

export default function PolicyGeneratorPage() {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savedDoc, setSavedDoc] = useState<SavedDoc | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<(typeof COUNTRIES)[number]>(COUNTRIES[0]);
  const [form, setForm] = useState({ companyName: '', policyType: 'HR Policy', employeeCount: '50', industry: '', summary: '', complianceNotes: '' });

  useEffect(() => { setToken(sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken') || ''); }, []);
  useEffect(() => { return () => { if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl); }; }, [pdfBlobUrl]);

  useEffect(() => {
    if (!savedDoc?.id || !token) return;
    (async () => {
      try {
        const res = await fetch(`/api/cv-documents/file/${savedDoc.id}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const blob = await res.blob();
        if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
        setPdfBlobUrl(URL.createObjectURL(blob));
      } catch { }
    })();
  }, [savedDoc?.id]);

  const handleGenerate = async () => {
    if (!token) { setError('Sign in required'); return; }
    if (!form.companyName || !form.summary.trim()) { setError('Company and Policy details required'); return; }
    setLoading(true); setError('');
    try {
      const payload = {
        documentType: 'policy-generator', type: 'policy',
        template: `${selectedCountry.country} Policy`,
        country: selectedCountry.country, currency: selectedCountry.currency,
        companyName: form.companyName, name: form.companyName,
        policyType: form.policyType, employeeCount: form.employeeCount,
        industry: form.industry, summary: form.summary,
        complianceNotes: form.complianceNotes, content: form.summary
      };
      const result = await apiRequest<SavedDoc>('/cv-documents', token, { method: 'POST', body: JSON.stringify(payload) });
      setSavedDoc(result);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#FCFCF9]">
      <div className="max-w-7xl mx-auto px-6 py-10 md:py-14">
        <div className="flex justify-between items-start gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#D4AF37]">HR • Compliance</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900">Policy Generator</h1>
            <p className="mt-2 text-sm text-zinc-500 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#D4AF37]" />
              {selectedCountry.country} • {selectedCountry.law}
            </p>
          </div>
          <Link href="/documents" className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold">Documents</Link>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <select value={selectedCountry.country} onChange={e => setSelectedCountry(COUNTRIES.find(x => x.country === e.target.value) || COUNTRIES[0])} className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium">
            {COUNTRIES.map(c => <option key={c.country} value={c.country}>{c.country} — {c.currency}</option>)}
          </select>
          <select value={form.policyType} onChange={e => setForm({ ...form, policyType: e.target.value })} className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm">
            {POLICY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mt-8">
          <div className="rounded-[24px] border border-zinc-200 bg-white p-6 md:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.04)] space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">Company</h3>
              <input placeholder="Company Name *" className="mt-3 w-full rounded-[12px] border border-zinc-200 bg-zinc-50 p-3 text-sm font-medium focus:bg-white focus:border-zinc-900 focus:outline-none" value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })} />
              <div className="mt-3 grid grid-cols-2 gap-3">
                <input placeholder="Employees" className="rounded-[12px] border border-zinc-200 bg-zinc-50 p-3 text-sm focus:bg-white focus:border-zinc-900 focus:outline-none" value={form.employeeCount} onChange={e => setForm({ ...form, employeeCount: e.target.value })} />
                <input placeholder="Industry" className="rounded-[12px] border border-zinc-200 bg-zinc-50 p-3 text-sm focus:bg-white focus:border-zinc-900 focus:outline-none" value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-zinc-900">Policy Details</h3>
              <textarea placeholder="Policy Requirements *" className="mt-3 w-full rounded-[12px] border border-zinc-200 bg-zinc-50 p-3 text-sm h-32 focus:bg-white focus:border-zinc-900 focus:outline-none" value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} />
              <textarea placeholder="Compliance Notes (optional)" className="mt-3 w-full rounded-[12px] border border-zinc-200 bg-zinc-50 p-3 text-sm h-20 focus:bg-white focus:border-zinc-900 focus:outline-none" value={form.complianceNotes} onChange={e => setForm({ ...form, complianceNotes: e.target.value })} />
            </div>

            <button onClick={handleGenerate} disabled={loading} className="w-full rounded-full bg-zinc-900 text-white py-3.5 text-sm font-semibold hover:bg-black disabled:opacity-50">
              {loading ? 'Generating...' : `Generate ${form.policyType} — ${selectedCountry.country}`}
            </button>
            {error && <p className="text-sm text-red-600 rounded-[12px] bg-red-50 border border-red-200 p-3">{error}</p>}
            <AiDataNotice />
          </div>

          <div className="rounded-[24px] border border-zinc-200 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            {!savedDoc ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-20">
                <div className="h-14 w-14 rounded-[16px] bg-zinc-900 grid place-items-center">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#D4AF37]" />
                </div>
                <h3 className="mt-5 font-semibold text-zinc-900">Policy Preview</h3>
                <p className="text-sm text-zinc-500 mt-2">{selectedCountry.country} • {selectedCountry.law}<br />{form.policyType}</p>
              </div>
            ) : (
              <div>
                <h3 className="text-sm font-semibold text-emerald-700 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500" />Policy Generated</h3>
                {pdfBlobUrl && <iframe src={pdfBlobUrl} className="w-full h-[600px] rounded-[16px] border border-zinc-200 mt-4 bg-white" />}
                <div className="flex gap-2 mt-4">
                  {pdfBlobUrl && <a href={pdfBlobUrl} download={`${form.companyName}-${form.policyType}.pdf`} className="rounded-full bg-zinc-900 text-white px-5 py-2.5 text-sm font-semibold">Download PDF</a>}
                  <button onClick={() => { setSavedDoc(null); setPdfBlobUrl(''); }} className="rounded-full border border-zinc-200 px-5 py-2.5 text-sm">New Policy</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
