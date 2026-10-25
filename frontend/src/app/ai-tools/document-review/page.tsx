'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/project-delivery';
import AiDataNotice from '../ai-data-notice';

type SavedDoc = { id: string; title: string; content: string; createdAt: string; currency?: string; symbol?: string; country?: string; };

const COUNTRIES = [
  { country: 'Qatar', currency: 'QAR', symbol: 'QAR', law: 'Qatar Labour Law No.14/2004, QFC' },
  { country: 'Australia', currency: 'AUD', symbol: 'A$', law: 'Fair Work Act 2009, ASIC' },
  { country: 'UAE', currency: 'AED', symbol: 'AED', law: 'UAE Labour Law Decree No.33' },
  { country: 'Saudi Arabia', currency: 'SAR', symbol: 'SAR', law: 'Saudi Labour Law, MHRSD' },
  { country: 'United Kingdom', currency: 'GBP', symbol: '£', law: 'Employment Rights Act 1996' },
  { country: 'USA', currency: 'USD', symbol: '$', law: 'FLSA, EEOC' },
  { country: 'Canada', currency: 'CAD', symbol: 'C$', law: 'Canada Labour Code' },
  { country: 'India', currency: 'INR', symbol: '₹', law: 'Shops & Establishments Act' },
] as const;

const CASE_TYPES = ['Employment Dispute', 'Contract Review', 'Compliance Audit', 'Financial Claim', 'Termination Case', 'Business Dispute', 'Labour Law Review', 'International Contract'] as const;

export default function DocumentReviewProPage() {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savedDoc, setSavedDoc] = useState<SavedDoc | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<(typeof COUNTRIES)[number]>(COUNTRIES[0]);
  const [form, setForm] = useState({
    applicantName: '', caseType: 'Employment Dispute',
    summary: '', findings: '', risks: '', financialImpact: '',
    amount: '50000', recommendations: '', jurisdiction: ''
  });

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
    if (!form.summary.trim()) { setError('Executive Summary required'); return; }
    setLoading(true); setError('');
    try {
      const payload = {
        documentType: 'judgement-review', type: 'judgement-review',
        template: `${selectedCountry.country} Legal Review`,
        country: selectedCountry.country, currency: selectedCountry.currency,
        expectedSalary: form.amount, salary: form.amount,
        name: form.applicantName, applicantName: form.applicantName,
        caseType: form.caseType, summary: form.summary, content: form.summary,
        findings: form.findings, risks: form.risks,
        financialImpact: form.financialImpact, amount: form.amount,
        recommendations: form.recommendations,
        jurisdiction: form.jurisdiction || selectedCountry.country
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
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#D4AF37]">Legal • International</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900">Document Review</h1>
            <p className="mt-2 text-sm text-zinc-500 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#D4AF37]" />
              {selectedCountry.country} • {selectedCountry.symbol} {selectedCountry.currency} • {selectedCountry.law}
            </p>
          </div>
          <Link href="/dashboard/cvs" className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold">My Documents</Link>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <select value={selectedCountry.country} onChange={e => setSelectedCountry(COUNTRIES.find(x => x.country === e.target.value) || COUNTRIES[0])} className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium">
            {COUNTRIES.map(c => <option key={c.country} value={c.country}>{c.country} — {c.currency}</option>)}
          </select>
          <select value={form.caseType} onChange={e => setForm({ ...form, caseType: e.target.value })} className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm">
            {CASE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <span className="rounded-full bg-zinc-900 text-white px-3 py-2 text-xs font-bold">{selectedCountry.symbol} Legal</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mt-8">
          <div className="rounded-[24px] border border-zinc-200 bg-white p-6 md:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.04)] space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">Case Details</h3>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <input placeholder="Applicant Name" className="rounded-[12px] border border-zinc-200 bg-zinc-50 p-3 text-sm focus:bg-white focus:border-zinc-900 focus:outline-none" value={form.applicantName} onChange={e => setForm({ ...form, applicantName: e.target.value })} />
                <input placeholder={`Amount ${selectedCountry.symbol}`} className="rounded-[12px] border border-zinc-200 bg-white p-3 text-sm font-semibold focus:border-zinc-900 focus:outline-none" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
              </div>
              <input placeholder="Jurisdiction (optional)" className="mt-3 w-full rounded-[12px] border border-zinc-200 bg-zinc-50 p-3 text-sm focus:bg-white focus:border-zinc-900 focus:outline-none" value={form.jurisdiction} onChange={e => setForm({ ...form, jurisdiction: e.target.value })} />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-zinc-900">Review Content</h3>
              <div className="mt-3 space-y-3">
                <textarea placeholder="Executive Summary *" className="w-full rounded-[12px] border border-zinc-200 bg-zinc-50 p-3 text-sm h-24 focus:bg-white focus:border-zinc-900 focus:outline-none" value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} />
                <textarea placeholder="Key Findings & Legal Analysis" className="w-full rounded-[12px] border border-zinc-200 bg-zinc-50 p-3 text-sm h-20 focus:bg-white focus:border-zinc-900 focus:outline-none" value={form.findings} onChange={e => setForm({ ...form, findings: e.target.value })} />
                <div className="grid grid-cols-2 gap-3">
                  <textarea placeholder="Risks" className="rounded-[12px] border border-zinc-200 bg-zinc-50 p-3 text-sm h-20 focus:bg-white focus:border-zinc-900 focus:outline-none" value={form.risks} onChange={e => setForm({ ...form, risks: e.target.value })} />
                  <textarea placeholder={`Financial Impact (${selectedCountry.symbol})`} className="rounded-[12px] border border-zinc-200 bg-zinc-50 p-3 text-sm h-20 focus:bg-white focus:border-zinc-900 focus:outline-none" value={form.financialImpact} onChange={e => setForm({ ...form, financialImpact: e.target.value })} />
                </div>
                <textarea placeholder="Recommendations & Compliance" className="w-full rounded-[12px] border border-zinc-200 bg-zinc-50 p-3 text-sm h-20 focus:bg-white focus:border-zinc-900 focus:outline-none" value={form.recommendations} onChange={e => setForm({ ...form, recommendations: e.target.value })} />
              </div>
            </div>

            <button onClick={handleGenerate} disabled={loading} className="w-full rounded-full bg-zinc-900 text-white py-3.5 text-sm font-semibold hover:bg-black disabled:opacity-50">
              {loading ? 'Generating Review...' : `Generate — ${selectedCountry.country} • ${selectedCountry.symbol} ${form.amount}`}
            </button>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <AiDataNotice />
          </div>

          <div className="rounded-[24px] border border-zinc-200 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            {!savedDoc ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-20">
                <div className="h-14 w-14 rounded-[16px] bg-zinc-900 grid place-items-center">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#D4AF37]" />
                </div>
                <h3 className="mt-5 font-semibold text-zinc-900">Legal Review Preview</h3>
                <p className="text-sm text-zinc-500 mt-2 max-w-[280px]">Jurisdiction: {selectedCountry.country}<br />Currency: {selectedCountry.symbol} {selectedCountry.currency}<br />Law: {selectedCountry.law}</p>
                <span className="mt-4 text-xs rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-zinc-600">{form.caseType}</span>
              </div>
            ) : (
              <div>
                <h3 className="text-sm font-semibold text-emerald-700 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500" />Review Generated</h3>
                {pdfBlobUrl && <iframe src={pdfBlobUrl} className="w-full h-[600px] rounded-[16px] border border-zinc-200 mt-4 bg-white" />}
                <div className="flex gap-2 mt-4">
                  {pdfBlobUrl && <a href={pdfBlobUrl} download={`${form.applicantName || 'Review'}-${selectedCountry.country}.pdf`} className="rounded-full bg-zinc-900 text-white px-5 py-2.5 text-sm font-semibold">Download PDF</a>}
                  <button onClick={() => { setSavedDoc(null); setPdfBlobUrl(''); }} className="rounded-full border border-zinc-200 px-5 py-2.5 text-sm">New Review</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}