'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/project-delivery';
import AiDataNotice from '../ai-data-notice';

type SavedDoc = { id: string; title: string; content: string; createdAt: string; };

const COUNTRIES = [
  { country: 'Qatar', currency: 'QAR', symbol: 'QAR ', law: 'QFC Business Setup', flag: '🇶🇦', tax: 'No Income Tax' },
  { country: 'Australia', currency: 'AUD', symbol: 'A$', law: 'ASIC, Fair Work Act 2009', flag: '🇦🇺', tax: 'GST 10%' },
  { country: 'UAE', currency: 'AED', symbol: 'AED ', law: 'UAE Free Zone Law', flag: '🇦🇪', tax: '5% VAT' },
  { country: 'Saudi Arabia', currency: 'SAR', symbol: 'SAR ', law: 'MISA, Saudi Companies Law', flag: '🇸🇦', tax: '15% VAT' },
  { country: 'United Kingdom', currency: 'GBP', symbol: '£', law: 'UK Companies Act', flag: '🇬🇧', tax: 'PAYE' },
  { country: 'USA', currency: 'USD', symbol: '$', law: 'US SBA, FLSA', flag: '🇺🇸', tax: 'Federal/State' },
  { country: 'Canada', currency: 'CAD', symbol: 'C$', law: 'CBCA', flag: '🇨🇦', tax: 'GST/HST' },
  { country: 'India', currency: 'INR', symbol: '₹', law: 'Companies Act 2013', flag: '🇮🇳', tax: 'GST 18%' },
] as const;

const PROPOSAL_TYPES = ['Business Proposal', 'Investment Proposal', 'Sales Proposal', 'Partnership Proposal', 'Grant Proposal', 'Project Proposal', 'Consulting Proposal', 'Marketing Proposal'] as const;

export default function ProposalPacksPage() {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savedDoc, setSavedDoc] = useState<SavedDoc | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<any>(COUNTRIES[0]);
  const [form, setForm] = useState({ companyName: '', clientName: '', proposalType: 'Business Proposal', projectTitle: '', executiveSummary: '', problem: '', solution: '', deliverables: '', timeline: '', investment: '100000', roi: '' });

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

  const handleGenerate = async () => {
    if (!token) { setError('Sign in required'); return; }
    if (!form.companyName || !form.executiveSummary) { setError('Company and Executive Summary required'); return; }
    setLoading(true); setError('');
    try {
      const payload = {
        documentType: 'proposal-pack',
        type: 'proposal',
        template: selectedCountry.country + ' Proposal',
        country: selectedCountry.country,
        currency: selectedCountry.currency,
        companyName: form.companyName,
        name: form.companyName,
        clientName: form.clientName,
        proposalType: form.proposalType,
        projectTitle: form.projectTitle,
        executiveSummary: form.executiveSummary,
        summary: form.executiveSummary,
        problem: form.problem,
        solution: form.solution,
        deliverables: form.deliverables,
        timeline: form.timeline,
        investment: form.investment,
        expectedSalary: form.investment,
        roi: form.roi,
        content: form.executiveSummary
      };
      const result = await apiRequest<SavedDoc>('/cv-documents', token, { method: 'POST', body: JSON.stringify(payload) });
      setSavedDoc(result);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex justify-between items-center"><div><h1 className="text-3xl font-bold">Proposal Packs Pro — Global Ready</h1><p className="text-sm text-gray-600 mt-1">{selectedCountry.flag} {selectedCountry.country} | {selectedCountry.currency} ({selectedCountry.symbol}) | {selectedCountry.law} | {selectedCountry.tax}</p></div><Link href="/documents" className="text-sm underline">Documents</Link></div>
      <div className="mt-4 flex flex-wrap gap-3 items-center">
        <select value={selectedCountry.country} onChange={e => setSelectedCountry(COUNTRIES.find(x => x.country === e.target.value) || COUNTRIES[0])} className="border rounded-full px-3 py-1.5 text-xs bg-white font-semibold">{COUNTRIES.map(c => <option key={c.country} value={c.country}>{c.flag} {c.country} - {c.currency} ({c.symbol})</option>)}</select>
        <select value={form.proposalType} onChange={e => setForm({ ...form, proposalType: e.target.value })} className="border rounded-full px-3 py-1.5 text-xs bg-white">{PROPOSAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select>
        <span className="text-xs bg-[#D4AF37] text-black px-2 py-1 rounded-full font-bold">{selectedCountry.symbol} {selectedCountry.currency} Premium</span>
      </div>
      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <div className="border rounded-xl p-5 bg-white shadow-sm space-y-4">
          <h3 className="font-bold text-sm">Client & Project — {selectedCountry.flag} {selectedCountry.country}</h3>
          <div className="grid grid-cols-2 gap-2"><input placeholder="Your Company *" className="border p-2 rounded w-full font-semibold text-sm" value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })} /><input placeholder="Client Name" className="border p-2 rounded w-full text-sm" value={form.clientName} onChange={e => setForm({ ...form, clientName: e.target.value })} /></div>
          <input placeholder="Project Title" className="border p-2 rounded w-full text-sm" value={form.projectTitle} onChange={e => setForm({ ...form, projectTitle: e.target.value })} />
          <textarea placeholder="Executive Summary *" className="w-full border p-2 rounded h-20 text-sm" value={form.executiveSummary} onChange={e => setForm({ ...form, executiveSummary: e.target.value })} />
          <div className="grid grid-cols-2 gap-2"><textarea placeholder="Problem Statement" className="w-full border p-2 rounded h-20 text-sm" value={form.problem} onChange={e => setForm({ ...form, problem: e.target.value })} /><textarea placeholder="Your Solution" className="w-full border p-2 rounded h-20 text-sm bg-blue-50/50" value={form.solution} onChange={e => setForm({ ...form, solution: e.target.value })} /></div>
          <textarea placeholder="Deliverables" className="w-full border p-2 rounded h-16 text-sm" value={form.deliverables} onChange={e => setForm({ ...form, deliverables: e.target.value })} />
          <div className="grid grid-cols-3 gap-2"><input placeholder="Timeline" className="border p-2 rounded text-sm" value={form.timeline} onChange={e => setForm({ ...form, timeline: e.target.value })} /><label className="text-xs">Investment ({selectedCountry.symbol} {selectedCountry.currency})<input className="border p-2 rounded w-full mt-1 font-bold bg-amber-50 text-sm" value={form.investment} onChange={e => setForm({ ...form, investment: e.target.value })} /></label><input placeholder="ROI / Benefits" className="border p-2 rounded text-sm" value={form.roi} onChange={e => setForm({ ...form, roi: e.target.value })} /></div>
          <button onClick={handleGenerate} disabled={loading} className="bg-[#0F172A] text-white px-5 py-3 rounded w-full font-bold">{loading ? 'Generating Proposal...' : `Generate ${form.proposalType} — ${selectedCountry.flag} ${selectedCountry.symbol} ${form.investment} ${selectedCountry.currency}`}</button>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <AiDataNotice />
        </div>
        <div className="border rounded-xl p-5 bg-white shadow-sm">
          {!savedDoc ? <div className="text-center py-20"><div className="text-5xl mb-4">📊 {selectedCountry.flag}</div><h3 className="font-bold">Premium International Proposal</h3><p className="text-sm text-gray-600 mt-2">{selectedCountry.country} | {selectedCountry.currency} ({selectedCountry.symbol})<br/>{selectedCountry.law}<br/>Investment: {selectedCountry.symbol} {form.investment} {selectedCountry.currency}<br/>{form.proposalType}</p><div className="mt-4 text-xs bg-gray-100 px-3 py-1 rounded-full">{form.proposalType} | {selectedCountry.country}</div></div> : <div><h3 className="font-bold text-green-700">Proposal Generated — {selectedCountry.flag} {selectedCountry.country} | {selectedCountry.symbol} {selectedCountry.currency}</h3>{pdfBlobUrl && <iframe src={pdfBlobUrl} className="w-full h-[600px] border rounded mt-3" />}<div className="flex gap-2 mt-3">{pdfBlobUrl && <a href={pdfBlobUrl} download={`${form.companyName}-${form.proposalType}.pdf`} className="bg-black text-white px-4 py-2 rounded text-sm">Download PDF — {selectedCountry.symbol} {selectedCountry.currency}</a>}<button onClick={() => setSavedDoc(null)} className="border px-4 py-2 rounded text-sm">New Proposal</button></div></div>}
        </div>
      </div>
    </div>
  );
}



