'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/project-delivery';
import AiDataNotice from '../ai-data-notice';

type SavedDoc = { id: string; title: string; content: string; createdAt: string; };

const COUNTRIES = [
  { country: 'Qatar', currency: 'QAR', symbol: 'QAR ', law: 'Qatar Labour Law, QFC', flag: '🇶🇦' },
  { country: 'Australia', currency: 'AUD', symbol: 'A$', law: 'Fair Work Act 2009, WHS Act', flag: '🇦🇺' },
  { country: 'UAE', currency: 'AED', symbol: 'AED ', law: 'UAE Labour Law', flag: '🇦🇪' },
  { country: 'UK', currency: 'GBP', symbol: '£', law: 'Employment Rights Act', flag: '🇬🇧' },
  { country: 'USA', currency: 'USD', symbol: '$', law: 'OSHA, FLSA', flag: '🇺🇸' },
] as const;

const SOP_TYPES = ['Operations SOP', 'HR SOP', 'Finance SOP', 'Sales SOP', 'Customer Service SOP', 'Quality SOP', 'Safety SOP', 'IT SOP'] as const;

export default function SOPBuilderPage() {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savedDoc, setSavedDoc] = useState<SavedDoc | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [form, setForm] = useState({ companyName: '', sopType: 'Operations SOP', department: '', purpose: '', steps: '', tools: '' });

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
    if (!form.companyName || !form.purpose) { setError('Company and Purpose required'); return; }
    setLoading(true); setError('');
    try {
      const payload = {
        documentType: 'sop-builder',
        type: 'sop',
        template: selectedCountry.country + ' SOP',
        country: selectedCountry.country,
        currency: selectedCountry.currency,
        companyName: form.companyName,
        name: form.companyName,
        sopType: form.sopType,
        department: form.department,
        purpose: form.purpose,
        summary: form.purpose,
        steps: form.steps,
        tools: form.tools,
        content: form.purpose
      };
      const result = await apiRequest<SavedDoc>('/cv-documents', token, { method: 'POST', body: JSON.stringify(payload) });
      setSavedDoc(result);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex justify-between items-center"><div><h1 className="text-3xl font-bold">SOP Builder Pro</h1><p className="text-sm text-gray-600 mt-1">{selectedCountry.flag} {selectedCountry.country} | {selectedCountry.law}</p></div><Link href="/documents" className="text-sm underline">Documents</Link></div>
      <div className="mt-4 flex gap-3 items-center">
        <select value={selectedCountry.country} onChange={e => setSelectedCountry(COUNTRIES.find(x => x.country === e.target.value) || COUNTRIES[0])} className="border rounded-full px-3 py-1.5 text-xs bg-white font-semibold">{COUNTRIES.map(c => <option key={c.country} value={c.country}>{c.flag} {c.country}</option>)}</select>
        <select value={form.sopType} onChange={e => setForm({ ...form, sopType: e.target.value })} className="border rounded-full px-3 py-1.5 text-xs bg-white">{SOP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select>
      </div>
      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <div className="border rounded-xl p-5 bg-white shadow-sm space-y-4">
          <input placeholder="Company Name *" className="border p-2 rounded w-full font-semibold" value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })} />
          <input placeholder="Department" className="border p-2 rounded w-full text-sm" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} />
          <textarea placeholder="Purpose / Objective *" className="w-full border p-2 rounded h-20 text-sm" value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} />
          <textarea placeholder="Step by Step Procedure" className="w-full border p-2 rounded h-32 text-sm bg-blue-50/50" value={form.steps} onChange={e => setForm({ ...form, steps: e.target.value })} />
          <textarea placeholder="Tools / Systems Required" className="w-full border p-2 rounded h-16 text-sm" value={form.tools} onChange={e => setForm({ ...form, tools: e.target.value })} />
          <button onClick={handleGenerate} disabled={loading} className="bg-[#0F172A] text-white px-5 py-3 rounded w-full font-bold">{loading ? 'Generating SOP...' : `Generate ${form.sopType} — ${selectedCountry.flag} ${selectedCountry.country}`}</button>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <AiDataNotice />
        </div>
        <div className="border rounded-xl p-5 bg-white shadow-sm">
          {!savedDoc ? <div className="text-center py-20"><div className="text-5xl mb-4">⚙️ {selectedCountry.flag}</div><h3 className="font-bold">Premium International SOP</h3><p className="text-sm text-gray-600 mt-2">{selectedCountry.country} | {selectedCountry.law}<br/>{form.sopType}</p></div> : <div><h3 className="font-bold text-green-700">SOP Generated — {selectedCountry.country}</h3>{pdfBlobUrl && <iframe src={pdfBlobUrl} className="w-full h-[600px] border rounded mt-3" />}<div className="flex gap-2 mt-3">{pdfBlobUrl && <a href={pdfBlobUrl} download={`${form.companyName}-${form.sopType}.pdf`} className="bg-black text-white px-4 py-2 rounded text-sm">Download PDF</a>}<button onClick={() => setSavedDoc(null)} className="border px-4 py-2 rounded text-sm">New SOP</button></div></div>}
        </div>
      </div>
    </div>
  );
}
