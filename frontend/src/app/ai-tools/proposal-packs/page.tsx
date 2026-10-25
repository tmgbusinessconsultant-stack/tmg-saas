'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/project-delivery';
import AiDataNotice from '../ai-data-notice';

type SavedDoc = { id: string; title: string; content: string; createdAt: string; };

const COUNTRIES = [
  { country: 'Qatar', currency: 'QAR', symbol: 'QAR', law: 'QFC Business Setup', tax: 'No Income Tax' },
  { country: 'Australia', currency: 'AUD', symbol: 'A$', law: 'ASIC, Fair Work Act 2009', tax: 'GST 10%' },
  { country: 'UAE', currency: 'AED', symbol: 'AED', law: 'UAE Free Zone Law', tax: '5% VAT' },
  { country: 'Saudi Arabia', currency: 'SAR', symbol: 'SAR', law: 'MISA, Saudi Companies Law', tax: '15% VAT' },
  { country: 'United Kingdom', currency: 'GBP', symbol: '£', law: 'UK Companies Act', tax: 'PAYE' },
  { country: 'USA', currency: 'USD', symbol: '$', law: 'US SBA, FLSA', tax: 'Federal/State' },
] as const;

const PROPOSAL_TYPES = ['Business Proposal', 'Investment Proposal', 'Sales Proposal', 'Partnership Proposal', 'Grant Proposal', 'Project Proposal', 'Consulting Proposal', 'Marketing Proposal'] as const;

export default function ProposalPacksPage() {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savedDoc, setSavedDoc] = useState<SavedDoc | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<(typeof COUNTRIES)[number]>(COUNTRIES[0]);
  const [form, setForm] = useState({ companyName: '', clientName: '', proposalType: 'Business Proposal', projectTitle: '', executiveSummary: '', problem: '', solution: '', deliverables: '', timeline: '', investment: '100000', roi: '' });

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
    if (!form.companyName || !form.executiveSummary.trim()) { setError('Company and Executive Summary required'); return; }
    setLoading(true); setError('');
    try {
      const payload = {
        documentType: 'proposal-pack', type: 'proposal',
        template: `${selectedCountry.country} Proposal`,
        country: selectedCountry.country, currency: selectedCountry.currency,
        companyName: form.companyName, name: form.companyName,
        clientName: form.clientName, proposalType: form.proposalType,
        projectTitle: form.projectTitle, executiveSummary: form.executiveSummary,
        summary: form.executiveSummary, problem: form.problem, solution: form.solution,
        deliverables: form.deliverables, timeline: form.timeline,
        investment: form.investment, expectedSalary: form.investment, roi: form.roi,
        content: form.executiveSummary
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
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#D4AF37]">Proposals • Global</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900">Proposal Packs</h1>
            <p className="mt-2 text-sm text-zinc-500 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#D4AF37]" />
              {selectedCountry.country} • {selectedCountry.symbol} {selectedCountry.currency} • {selectedCountry.law}
            </p>
          </div>
          <Link href="/documents" className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold">Documents</Link>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <select value={selectedCountry.country} onChange={e => setSelectedCountry(COUNTRIES.find(x => x.country === e.target.value) || COUNTRIES[0])} className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium">
            {COUNTRIES.map(c => <option key={c.country} value={c.country}>{c.country} — {c.currency}</option>)}
          </select>
          <select value={form.proposalType} onChange={e => setForm({ ...form, proposalType: e.target.value })} className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm">
            {PROPOSAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <span className="rounded-full bg-[#D4AF37] text-zinc-900 px-3 py-2 text-xs font-bold">{selectedCountry.symbol} Premium</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mt-8">
          <div className="rounded-[24px] border border-zinc-200 bg-white p-6 md:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.04)] space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">Client & Project</h3>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <input placeholder="Your Company *" className="rounded-[12px] border border-zinc-200 bg-zinc-50 p-3 text-sm font-medium focus:bg-white focus:border-zinc-900 focus:outline-none" value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })} />
                <input placeholder="Client Name" className="rounded-[12px] border border-zinc-200 bg-zinc-50 p-3 text-sm focus:bg-white focus:border-zinc-900 focus:outline-none" value={form.clientName} onChange={e => setForm({ ...form, clientName: e.target.value })} />
              </div>
              <input placeholder="Project Title" className="mt-3 w-full rounded-[12px] border border-zinc-200 bg-zinc-50 p-3 text-sm focus:bg-white focus:border-zinc-900 focus:outline-none" value={form.projectTitle} onChange={e => setForm({ ...form, projectTitle: e.target.value })} />
            </div>

            <div className="space-y-3">
              <textarea placeholder="Executive Summary *" className="w-full rounded-[12px] border border-zinc-200 bg-zinc-50 p-3 text-sm h-20 focus:bg-white focus:border-zinc-900 focus:outline-none" value={form.executiveSummary} onChange={e => setForm({ ...form, executiveSummary: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <textarea placeholder="Problem" className="rounded-[12px] border border-zinc-200 bg-zinc-50 p-3 text-sm h-20 focus:bg-white focus:border-zinc-900 focus:outline-none" value={form.problem} onChange={e => setForm({ ...form, problem: e.target.value })} />
                <textarea placeholder="Solution" className="rounded-[12px] border border-zinc-200 bg-zinc-50 p-3 text-sm h-20 focus:bg-white focus:border-zinc-900 focus:outline-none" value={form.solution} onChange={e => setForm({ ...form, solution: e.target.value })} />
              </div>
              <textarea placeholder="Deliverables" className="w-full rounded-[12px] border border-zinc-200 bg-zinc-50 p-3 text-sm h-16 focus:bg-white focus:border-zinc-900 focus:outline-none" value={form.deliverables} onChange={e => setForm({ ...form, deliverables: e.target.value })} />
              <div className="grid grid-cols-3 gap-3">
                <input placeholder="Timeline" className="rounded-[12px] border border-zinc-200 bg-zinc-50 p-3 text-sm focus:bg-white focus:border-zinc-900 focus:outline-none" value={form.timeline} onChange={e => setForm({ ...form, timeline: e.target.value })} />
                <input placeholder={`Investment ${selectedCountry.symbol}`} className="rounded-[12px] border border-zinc-200 bg-white p-3 text-sm font-bold focus:border-zinc-900 focus:outline-none" value={form.investment} onChange={e => setForm({ ...form, investment: e.target.value })} />
                <input placeholder="ROI" className="rounded-[12px] border border-zinc-200 bg-zinc-50 p-3 text-sm focus:bg-white focus:border-zinc-900 focus:outline-none" value={form.roi} onChange={e => setForm({ ...form, roi: e.target.value })} />
              </div>
            </div>

            <button onClick={handleGenerate} disabled={loading} className="w-full rounded-full bg-zinc-900 text-white py-3.5 text-sm font-semibold hover:bg-black disabled:opacity-50">
              {loading ? 'Generating...' : `Generate ${form.proposalType} — ${selectedCountry.symbol} ${form.investment}`}
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
                <h3 className="mt-5 font-semibold text-zinc-900">Proposal Preview</h3>
                <p className="text-sm text-zinc-500 mt-2 max-w-[260px]">{selectedCountry.country} • {selectedCountry.symbol} {form.investment}<br />{form.proposalType} • {selectedCountry.law}</p>
              </div>
            ) : (
              <div>
                <h3 className="text-sm font-semibold text-emerald-700 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500" />Proposal Generated</h3>
                {pdfBlobUrl && <iframe src={pdfBlobUrl} className="w-full h-[600px] rounded-[16px] border border-zinc-200 mt-4 bg-white" />}
                <div className="flex gap-2 mt-4">
                  {pdfBlobUrl && <a href={pdfBlobUrl} download={`${form.companyName}-${form.proposalType}.pdf`} className="rounded-full bg-zinc-900 text-white px-5 py-2.5 text-sm font-semibold">Download PDF</a>}
                  <button onClick={() => { setSavedDoc(null); setPdfBlobUrl(''); }} className="rounded-full border border-zinc-200 px-5 py-2.5 text-sm">New Proposal</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}