'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/project-delivery';
import AiDataNotice from '../ai-data-notice';

type SavedDoc = { id: string; title: string; content: string; createdAt: string; };

const COUNTRIES = [
  { country: 'Qatar', currency: 'QAR', symbol: 'QAR', law: 'Qatar Labour Law, QFC' },
  { country: 'Australia', currency: 'AUD', symbol: 'A$', law: 'Fair Work Act 2009, WHS Act' },
  { country: 'UAE', currency: 'AED', symbol: 'AED', law: 'UAE Labour Law' },
  { country: 'UK', currency: 'GBP', symbol: '£', law: 'Employment Rights Act' },
  { country: 'USA', currency: 'USD', symbol: '$', law: 'OSHA, FLSA' },
] as const;

const SOP_TYPES = ['Operations SOP', 'HR SOP', 'Finance SOP', 'Sales SOP', 'Customer Service SOP', 'Quality SOP', 'Safety SOP', 'IT SOP'] as const;

export default function SOPBuilderPage() {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savedDoc, setSavedDoc] = useState<SavedDoc | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<(typeof COUNTRIES)[number]>(COUNTRIES[0]);
  const [form, setForm] = useState({ companyName: '', sopType: 'Operations SOP', department: '', purpose: '', steps: '', tools: '' });

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
    if (!form.companyName || !form.purpose.trim()) { setError('Company and Purpose required'); return; }
    setLoading(true); setError('');
    try {
      const payload = {
        documentType: 'sop-builder', type: 'sop',
        template: `${selectedCountry.country} SOP`,
        country: selectedCountry.country, currency: selectedCountry.currency,
        companyName: form.companyName, name: form.companyName,
        sopType: form.sopType, department: form.department,
        purpose: form.purpose, summary: form.purpose,
        steps: form.steps, tools: form.tools, content: form.purpose
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
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#D4AF37]">Operations • SOP</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900">SOP Builder</h1>
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
          <select value={form.sopType} onChange={e => setForm({ ...form, sopType: e.target.value })} className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm">
            {SOP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mt-8">
          <div className="rounded-[24px] border border-zinc-200 bg-white p-6 md:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.04)] space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">Company</h3>
              <input placeholder="Company Name *" className="mt-3 w-full rounded-[12px] border border-zinc-200 bg-zinc-50 p-3 text-sm font-medium focus:bg-white focus:border-zinc-900 focus:outline-none" value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })} />
              <input placeholder="Department" className="mt-3 w-full rounded-[12px] border border-zinc-200 bg-zinc-50 p-3 text-sm focus:bg-white focus:border-zinc-900 focus:outline-none" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} />
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-zinc-900">Procedure</h3>
              <textarea placeholder="Purpose / Objective *" className="w-full rounded-[12px] border border-zinc-200 bg-zinc-50 p-3 text-sm h-20 focus:bg-white focus:border-zinc-900 focus:outline-none" value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} />
              <textarea placeholder="Step by Step Procedure" className="w-full rounded-[12px] border border-zinc-200 bg-zinc-50 p-3 text-sm h-32 focus:bg-white focus:border-zinc-900 focus:outline-none" value={form.steps} onChange={e => setForm({ ...form, steps: e.target.value })} />
              <textarea placeholder="Tools / Systems Required" className="w-full rounded-[12px] border border-zinc-200 bg-zinc-50 p-3 text-sm h-16 focus:bg-white focus:border-zinc-900 focus:outline-none" value={form.tools} onChange={e => setForm({ ...form, tools: e.target.value })} />
            </div>
            <button onClick={handleGenerate} disabled={loading} className="w-full rounded-full bg-zinc-900 text-white py-3.5 text-sm font-semibold hover:bg-black disabled:opacity-50">
              {loading ? 'Generating...' : `Generate ${form.sopType} — ${selectedCountry.country}`}
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
                <h3 className="mt-5 font-semibold text-zinc-900">SOP Preview</h3>
                <p className="text-sm text-zinc-500 mt-2">{selectedCountry.country} • {selectedCountry.law}<br />{form.sopType}</p>
              </div>
            ) : (
              <div>
                <h3 className="text-sm font-semibold text-emerald-700 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500" />SOP Generated</h3>
                {pdfBlobUrl && <iframe src={pdfBlobUrl} className="w-full h-[600px] rounded-[16px] border border-zinc-200 mt-4 bg-white" />}
                <div className="flex gap-2 mt-4">
                  {pdfBlobUrl && <a href={pdfBlobUrl} download={`${form.companyName}-${form.sopType}.pdf`} className="rounded-full bg-zinc-900 text-white px-5 py-2.5 text-sm font-semibold">Download PDF</a>}
                  <button onClick={() => { setSavedDoc(null); setPdfBlobUrl(''); }} className="rounded-full border border-zinc-200 px-5 py-2.5 text-sm">New SOP</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}