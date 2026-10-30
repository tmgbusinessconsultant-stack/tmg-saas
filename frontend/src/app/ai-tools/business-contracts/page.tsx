'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/project-delivery';
import AiDataNotice from '../ai-data-notice';

type SavedDoc = { id: string; title: string; content: string; createdAt: string; currency?: string; };

const COUNTRIES = [
  { country: 'Qatar', currency: 'QAR', symbol: 'QAR ', law: 'Qatar Commercial Law No.7/2005, QFC Contract Law', flag: '🇶🇦', tax: 'No Income Tax' },
  { country: 'Australia', currency: 'AUD', symbol: 'A$', law: 'Australian Consumer Law 2010, Corporations Act 2001, ASIC', flag: '🇦🇺', tax: 'GST 10%' },
  { country: 'UAE', currency: 'AED', symbol: 'AED ', law: 'UAE Commercial Transactions Law, Federal Decree No.32/2021', flag: '🇦🇪', tax: '5% VAT' },
  { country: 'Saudi Arabia', currency: 'SAR', symbol: 'SAR ', law: 'Saudi Companies Law, MHRSD', flag: '🇸🇦', tax: '15% VAT' },
  { country: 'United Kingdom', currency: 'GBP', symbol: '£', law: 'English Contract Law, Consumer Rights Act 2015', flag: '🇬🇧', tax: 'PAYE' },
  { country: 'USA', currency: 'USD', symbol: '$', law: 'UCC, Common Law, FLSA', flag: '🇺🇸', tax: 'Federal/State' },
  { country: 'Canada', currency: 'CAD', symbol: 'C$', law: 'Common Law / Civil Code Quebec, Canada Labour Code', flag: '🇨🇦', tax: 'GST/HST' },
  { country: 'India', currency: 'INR', symbol: '₹', law: 'Indian Contract Act 1872, Companies Act 2013', flag: '🇮🇳', tax: 'GST 18%' },
  { country: 'Singapore', currency: 'SGD', symbol: 'S$', law: 'Singapore Contract Law, Employment Act', flag: '🇸🇬', tax: '7% GST' },
  { country: 'EU', currency: 'EUR', symbol: '€', law: 'EU Contract Law, GDPR', flag: '🇪🇺', tax: '19-25%' },
] as const;

const CONTRACT_TYPES = ['Service Agreement', 'NDA / Non-Disclosure', 'Employment Contract', 'Consulting Agreement', 'Partnership Agreement', 'Sales Contract', 'Lease Agreement', 'Freelancer Agreement', 'Joint Venture', 'MSA / Master Service'] as const;

export default function BusinessContractsPage() {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savedDoc, setSavedDoc] = useState<SavedDoc | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<any>(COUNTRIES[0]);
  const [form, setForm] = useState({ 
    companyName: '', 
    clientName: '', 
    contractType: 'Service Agreement',
    contractValue: '75000',
    startDate: '', 
    endDate: '',
    scope: '', 
    paymentTerms: '', 
    confidentiality: '',
    termination: '',
    governingLaw: ''
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

  const handleCountryChange = (countryName: string) => {
    const c = COUNTRIES.find(x => x.country === countryName) || COUNTRIES[0];
    setSelectedCountry(c);
    setForm(prev => ({ ...prev, governingLaw: c.law }));
  };

  const handleGenerate = async () => {
    if (!token) { setError('Sign in required'); return; }
    if (!form.companyName || !form.clientName || !form.scope) { setError('Company, Client, Scope required'); return; }
    setLoading(true); setError('');
    try {
      const payload = {
        documentType: 'business-contract',
        type: 'contract',
        template: selectedCountry.country + ' Contract',
        country: selectedCountry.country,
        currency: selectedCountry.currency,
        companyName: form.companyName,
        name: form.companyName,
        clientName: form.clientName,
        contractType: form.contractType,
        contractValue: form.contractValue,
        expectedSalary: form.contractValue,
        salary: form.contractValue,
        startDate: form.startDate,
        endDate: form.endDate,
        scope: form.scope,
        summary: form.scope,
        paymentTerms: form.paymentTerms,
        confidentiality: form.confidentiality,
        termination: form.termination,
        governingLaw: form.governingLaw || selectedCountry.law,
        content: form.scope
      };
      const result = await apiRequest<SavedDoc>('/cv-documents', token, { method: 'POST', body: JSON.stringify(payload) });
      setSavedDoc(result);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex justify-between items-center"><div><h1 className="text-3xl font-bold">Business Contracts Pro</h1><p className="text-sm text-gray-600 mt-1">{selectedCountry.flag} {selectedCountry.country} | {selectedCountry.currency} ({selectedCountry.symbol}) | {selectedCountry.law} | {selectedCountry.tax}</p></div><Link href="/documents" className="text-sm underline">Documents</Link></div>
      <div className="mt-4 flex flex-wrap gap-3 items-center">
        <select value={selectedCountry.country} onChange={e => handleCountryChange(e.target.value)} className="border rounded-full px-3 py-1.5 text-xs bg-white font-semibold">{COUNTRIES.map(c => <option key={c.country} value={c.country}>{c.flag} {c.country} - {c.currency} ({c.symbol}) | {c.law.substring(0,30)}</option>)}</select>
        <select value={form.contractType} onChange={e => setForm({ ...form, contractType: e.target.value })} className="border rounded-full px-3 py-1.5 text-xs bg-white">{CONTRACT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select>
        <span className="text-xs bg-black text-white px-2 py-1 rounded-full">{selectedCountry.symbol} {selectedCountry.currency} Legal</span>
      </div>
      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <div className="border rounded-xl p-5 bg-white shadow-sm space-y-4">
          <h3 className="font-bold text-sm">Parties & Value — {selectedCountry.flag} {selectedCountry.country}</h3>
          <div className="grid grid-cols-2 gap-2"><input placeholder="Your Company Name *" className="border p-2 rounded w-full font-semibold text-sm" value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })} /><input placeholder="Client / Second Party *" className="border p-2 rounded w-full text-sm" value={form.clientName} onChange={e => setForm({ ...form, clientName: e.target.value })} /></div>
          <div className="grid grid-cols-3 gap-2">
            <label className="text-xs">Contract Value ({selectedCountry.symbol} {selectedCountry.currency})<input className="border p-2 rounded w-full mt-1 font-bold bg-amber-50 text-sm" value={form.contractValue} onChange={e => setForm({ ...form, contractValue: e.target.value })} /></label>
            <label className="text-xs">Start Date<input type="date" className="border p-2 rounded w-full mt-1 text-sm" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} /></label>
            <label className="text-xs">End Date<input type="date" className="border p-2 rounded w-full mt-1 text-sm" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} /></label>
          </div>
          <h3 className="font-bold text-sm mt-2">Contract Terms — {selectedCountry.law}</h3>
          <textarea placeholder="Scope of Work / Services *" className="w-full border p-2 rounded h-24 text-sm" value={form.scope} onChange={e => setForm({ ...form, scope: e.target.value })} />
          <textarea placeholder={`Payment Terms - in ${selectedCountry.symbol} ${selectedCountry.currency}`} className="w-full border p-2 rounded h-20 text-sm bg-green-50/50" value={form.paymentTerms} onChange={e => setForm({ ...form, paymentTerms: e.target.value })} />
          <textarea placeholder="Confidentiality & IP" className="w-full border p-2 rounded h-16 text-sm" value={form.confidentiality} onChange={e => setForm({ ...form, confidentiality: e.target.value })} />
          <textarea placeholder="Termination & Liability" className="w-full border p-2 rounded h-16 text-sm" value={form.termination} onChange={e => setForm({ ...form, termination: e.target.value })} />
          <input placeholder="Governing Law" className="border p-2 rounded w-full text-sm" value={form.governingLaw} onChange={e => setForm({ ...form, governingLaw: e.target.value })} />
          <button onClick={handleGenerate} disabled={loading} className="bg-[#0F172A] text-white px-5 py-3 rounded w-full font-bold">{loading ? 'Generating Contract...' : `Generate ${form.contractType} — ${selectedCountry.flag} ${selectedCountry.symbol} ${form.contractValue} ${selectedCountry.currency}`}</button>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <AiDataNotice />
        </div>
        <div className="border rounded-xl p-5 bg-white shadow-sm">
          {!savedDoc ? <div className="text-center py-20"><div className="text-5xl mb-4">📄 {selectedCountry.flag}</div><h3 className="font-bold">Premium International Contract</h3><p className="text-sm text-gray-600 mt-2">{selectedCountry.country} | {selectedCountry.currency} ({selectedCountry.symbol})<br/>{selectedCountry.law}<br/>Value: {selectedCountry.symbol} {form.contractValue} {selectedCountry.currency}<br/>{form.contractType}</p><div className="mt-4 text-xs bg-gray-100 px-3 py-1 rounded-full">{form.contractType} | {selectedCountry.country}</div></div> : <div><h3 className="font-bold text-green-700">Contract Generated — {selectedCountry.flag} {selectedCountry.country} | {selectedCountry.symbol} {selectedCountry.currency}</h3>{pdfBlobUrl && <iframe src={pdfBlobUrl} className="w-full h-[600px] border rounded mt-3" />}<div className="flex gap-2 mt-3">{pdfBlobUrl && <a href={pdfBlobUrl} download={`${form.companyName}-${form.contractType}-${selectedCountry.country}.pdf`} className="bg-black text-white px-4 py-2 rounded text-sm">Download PDF — {selectedCountry.symbol} {selectedCountry.currency}</a>}<button onClick={() => { setSavedDoc(null); setPdfBlobUrl(''); }} className="border px-4 py-2 rounded text-sm">New Contract</button></div><div className="mt-3 text-xs text-gray-500 p-2 bg-gray-50 rounded">Governing Law: {form.governingLaw} | Value: {selectedCountry.symbol} {form.contractValue} {selectedCountry.currency} | TMG Premium</div></div>}
        </div>
      </div>
    </div>
  );
}




