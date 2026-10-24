'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/project-delivery';
import AiDataNotice from '../ai-data-notice';

type SavedDoc = { id: string; title: string; content: string; createdAt: string; currency?: string; symbol?: string; country?: string; };

const COUNTRIES = [
  { country: 'Qatar', currency: 'QAR', symbol: 'QAR ', law: 'Qatar Labour Law No.14/2004, QFC Regulations', flag: '🇶🇦' },
  { country: 'Australia', currency: 'AUD', symbol: 'A$', law: 'Fair Work Act 2009, ASIC Compliance, ABN/ACN', flag: '🇦🇺' },
  { country: 'UAE', currency: 'AED', symbol: 'AED ', law: 'UAE Labour Law Federal Decree No.33/2021, MOHRE', flag: '🇦🇪' },
  { country: 'Saudi Arabia', currency: 'SAR', symbol: 'SAR ', law: 'Saudi Labour Law, MHRSD, Qiwa/Mudad', flag: '🇸🇦' },
  { country: 'United Kingdom', currency: 'GBP', symbol: '£', law: 'Employment Rights Act 1996, Equality Act 2010', flag: '🇬🇧' },
  { country: 'USA', currency: 'USD', symbol: '$', law: 'FLSA, Title VII, EEOC, USCIS', flag: '🇺🇸' },
  { country: 'Canada', currency: 'CAD', symbol: 'C$', law: 'Canada Labour Code, Human Rights Act', flag: '🇨🇦' },
  { country: 'India', currency: 'INR', symbol: '₹', law: 'Shops & Establishments Act, ID Act', flag: '🇮🇳' },
  { country: 'Singapore', currency: 'SGD', symbol: 'S$', law: 'Employment Act, MOM Regulations', flag: '🇸🇬' },
  { country: 'EU', currency: 'EUR', symbol: '€', law: 'EU Labour Directive, GDPR', flag: '🇪🇺' },
] as const;

const CASE_TYPES = ['Employment Dispute', 'Contract Review', 'Compliance Audit', 'Financial Claim', 'Termination Case', 'Business Dispute', 'Labour Law Review', 'International Contract'] as const;

export default function DocumentReviewProPage() {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savedDoc, setSavedDoc] = useState<SavedDoc | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<any>(COUNTRIES[0]);

  const [form, setForm] = useState({
    applicantName: 'Applicant',
    caseType: 'Employment Dispute',
    documentType: 'Judgement Review',
    summary: '',
    findings: '',
    risks: '',
    financialImpact: '',
    amount: '50000',
    recommendations: '',
    jurisdiction: ''
  });

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
    if (!form.summary) { setError('Summary required'); return; }
    setLoading(true); setError('');
    try {
      const payload = {
        documentType: 'judgement-review',
        type: 'judgement-review',
        template: selectedCountry.country + ' Legal Review',
        country: selectedCountry.country,
        currency: selectedCountry.currency,
        expectedSalary: form.amount,
        salary: form.amount,
        applicantName: form.applicantName,
        name: form.applicantName,
        caseType: form.caseType,
        summary: form.summary,
        content: form.summary,
        findings: form.findings,
        risks: form.risks,
        financialImpact: form.financialImpact,
        amount: form.amount,
        recommendations: form.recommendations,
        jurisdiction: form.jurisdiction || selectedCountry.country
      };
      const result = await apiRequest<SavedDoc>('/cv-documents', token, { method: 'POST', body: JSON.stringify(payload) });
      setSavedDoc(result);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Judgement Review / Document Review Pro</h1>
          <p className="text-sm text-gray-600 mt-1">{selectedCountry.flag} {selectedCountry.country} | {selectedCountry.currency} ({selectedCountry.symbol}) | {selectedCountry.law}</p>
        </div>
        <Link href="/dashboard/cvs" className="text-sm underline">My Documents</Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 items-center">
        <select value={selectedCountry.country} onChange={e => setSelectedCountry(COUNTRIES.find(x => x.country === e.target.value) || COUNTRIES[0])} className="border rounded-full px-3 py-1.5 text-xs bg-white font-semibold">
          {COUNTRIES.map(c => <option key={c.country} value={c.country}>{c.flag} {c.country} - {c.currency} ({c.symbol}) | {c.law.substring(0,40)}</option>)}
        </select>
        <span className="text-xs bg-red-900 text-white px-2 py-1 rounded-full">{selectedCountry.symbol} {selectedCountry.currency} Legal</span>
        <select value={form.caseType} onChange={e => setForm({ ...form, caseType: e.target.value })} className="border rounded-full px-3 py-1.5 text-xs bg-white">
          {CASE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <div className="border rounded-xl p-5 bg-white shadow-sm space-y-4">
          <h3 className="font-bold text-sm">Case Details — {selectedCountry.flag} {selectedCountry.country} ({selectedCountry.currency})</h3>
          <div className="grid grid-cols-2 gap-2">
            <input placeholder="Applicant Name" className="border p-2 rounded w-full text-sm" value={form.applicantName} onChange={e => setForm({ ...form, applicantName: e.target.value })} />
            <input placeholder={`Amount ${selectedCountry.symbol} ${selectedCountry.currency}`} className="border p-2 rounded w-full text-sm font-bold bg-amber-50" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
          </div>
          <input placeholder="Jurisdiction" className="border p-2 rounded w-full text-sm" value={form.jurisdiction} onChange={e => setForm({ ...form, jurisdiction: e.target.value })} />

          <h3 className="font-bold text-sm mt-2">Review Content — {selectedCountry.law}</h3>
          <textarea placeholder="Executive Summary *" className="w-full border p-2 rounded h-20 text-sm" value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} />
          <textarea placeholder="Key Findings & Legal Analysis" className="w-full border p-2 rounded h-20 text-sm bg-blue-50/50" value={form.findings} onChange={e => setForm({ ...form, findings: e.target.value })} />
          <textarea placeholder="Risks under local law" className="w-full border p-2 rounded h-16 text-sm" value={form.risks} onChange={e => setForm({ ...form, risks: e.target.value })} />
          <textarea placeholder={`Financial Impact - ${selectedCountry.symbol} ${selectedCountry.currency}`} className="w-full border p-2 rounded h-20 text-sm bg-red-50/50" value={form.financialImpact} onChange={e => setForm({ ...form, financialImpact: e.target.value })} />
          <textarea placeholder="Recommendations & Compliance" className="w-full border p-2 rounded h-20 text-sm" value={form.recommendations} onChange={e => setForm({ ...form, recommendations: e.target.value })} />

          <button onClick={handleGenerate} disabled={loading} className="bg-[#1E293B] text-white px-5 py-3 rounded w-full font-bold">
            {loading ? 'Generating Legal Review...' : `Generate Review — ${selectedCountry.flag} ${selectedCountry.country} | ${selectedCountry.symbol} ${form.amount} ${selectedCountry.currency}`}
          </button>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <AiDataNotice />
        </div>

        <div className="border rounded-xl p-5 bg-white shadow-sm">
          {!savedDoc ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-20">
              <div className="text-5xl mb-4">⚖️ {selectedCountry.flag}</div>
              <h3 className="font-bold">Premium International Legal Review</h3>
              <p className="text-sm text-gray-600 mt-2 max-w-sm">Jurisdiction: {selectedCountry.country}<br/>Currency: {selectedCountry.currency} ({selectedCountry.symbol})<br/>Law: {selectedCountry.law}<br/>Amount: {selectedCountry.symbol} {form.amount} {selectedCountry.currency}</p>
              <div className="mt-4 text-xs bg-gray-100 px-3 py-1 rounded-full">{form.caseType} | {selectedCountry.country}</div>
            </div>
          ) : (
            <div>
              <h3 className="font-bold text-green-700">Legal Review Generated — {savedDoc.country} | {savedDoc.symbol} {savedDoc.currency}</h3>
              {pdfBlobUrl && <iframe src={pdfBlobUrl} className="w-full h-[600px] border rounded mt-3" />}
              <div className="flex gap-2 mt-3">
                {pdfBlobUrl && <a href={pdfBlobUrl} download={`${form.applicantName}-Judgement-Review-${selectedCountry.country}.pdf`} className="bg-black text-white px-4 py-2 rounded text-sm">Download PDF — {selectedCountry.symbol}</a>}
                <button onClick={() => { setSavedDoc(null); setPdfBlobUrl(''); }} className="border px-4 py-2 rounded text-sm">New Review</button>
              </div>
              <div className="mt-3 text-xs text-gray-500 p-2 bg-gray-50 rounded">{selectedCountry.law} | Financial: {selectedCountry.symbol} {form.amount} {selectedCountry.currency} | TMG Premium</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



