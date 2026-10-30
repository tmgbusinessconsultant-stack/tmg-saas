'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import AiDataNotice from '../ai-data-notice';

const COUNTRIES = [
  { country: 'Qatar', currency: 'QAR', symbol: 'QAR', law: 'Qatar Labour Law, QFC', tax: 'No Income Tax', suggestions: ['Check QFC LLC Requirements', 'Calculate End of Service Gratuity', 'Qatar Corporate Tax Rules'] },
  { country: 'Australia', currency: 'AUD', symbol: 'A$', law: 'Fair Work Act 2009, ASIC', tax: 'GST 10%', suggestions: ['Fair Work Compliance Checklist', 'ASIC Company Registration', 'Superannuation Guarantee Rates'] },
  { country: 'UAE', currency: 'AED', symbol: 'AED', law: 'UAE Labour Law', tax: '5% VAT', suggestions: ['MOHRE Contract Guidelines', 'Freezone vs Mainland setup', 'Corporate Tax 9% Threshold'] },
  { country: 'Saudi Arabia', currency: 'SAR', symbol: 'SAR', law: 'Saudi Labour Law', tax: '15% VAT', suggestions: ['Qiwa Portal Compliance', 'Saudization Nitaqat Calculator', 'MHRSD Regulations Overview'] },
  { country: 'United Kingdom', currency: 'GBP', symbol: '£', law: 'Employment Rights Act 1996', tax: 'PAYE', suggestions: ['PAYE Employer Registration', 'IR35 Determination Guide', 'UK Right to Work Audits'] },
  { country: 'USA', currency: 'USD', symbol: '$', law: 'FLSA, SBA', tax: 'Federal/State', suggestions: ['FLSA Exempt vs Non-Exempt', 'SBA Loan Frameworks', 'Delaware LLC Formations'] },
  { country: 'Canada', currency: 'CAD', symbol: 'C$', law: 'Canada Labour Code', tax: 'GST/HST', suggestions: ['Federal vs Provincial laws', 'LMIA Hiring Processes', 'GST/HST Filing Schedules'] },
  { country: 'India', currency: 'INR', symbol: '₹', law: 'Companies Act', tax: 'GST 18%', suggestions: ['MCA Company Incorporation', 'PF & ESI Statutory Compliance', 'GST Input Tax Credit Guide'] },
] as const;

type Message = { role: 'user' | 'assistant'; content: string; country?: string; currency?: string; };

export default function BusinessAssistantPage() {
  const [selectedCountry, setSelectedCountry] = useState<(typeof COUNTRIES)[number]>(COUNTRIES[0]);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: `Welcome to TMG Business Assistant.\n\nCurrently set to ${COUNTRIES[0].country} (${COUNTRIES[0].currency}). All figures will be in ${COUNTRIES[0].symbol} and compliant with ${COUNTRIES[0].law}.\n\nHow can I help with your ${COUNTRIES[0].country} business?`, country: 'Qatar', currency: 'QAR' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const handleCountryChange = (countryName: string) => {
    const c = COUNTRIES.find(x => x.country === countryName) || COUNTRIES[0];
    setSelectedCountry(c);
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: `Market switched to ${c.country}.\n\nCurrency: ${c.symbol} ${c.currency}\nLaw: ${c.law}\nTax: ${c.tax}\n\nAll advice now tailored to ${c.country} with figures in ${c.symbol}.`,
      country: c.country, currency: c.currency
    }]);
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: input, country: selectedCountry.country, currency: selectedCountry.currency };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/ai/business-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userMsg.content,
          country: selectedCountry.country,
          currency: selectedCountry.currency,
          symbol: selectedCountry.symbol,
          law: selectedCountry.law,
          tax: selectedCountry.tax,
          compliance: selectedCountry.law,
        })
      });
      const data = await res.json();
      const assistantContent = data.message || `Guidance compiled for ${selectedCountry.country} under ${selectedCountry.law}.`;
      setMessages(prev => [...prev, { role: 'assistant', content: assistantContent, country: selectedCountry.country, currency: selectedCountry.currency }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection issue encountered. Please try your request again shortly.', country: selectedCountry.country, currency: selectedCountry.currency }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-zinc-900 antialiased font-sans">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200 pb-6">
          <div>
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-800 ring-1 ring-amber-600/20">AI Advisory Workspace</span>
            <h1 className="text-3xl font-black tracking-tight text-zinc-900 mt-2">Business Assistant Console</h1>
          </div>
          <Link href="/documents" className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-bold shadow-sm hover:bg-zinc-50 transition-all">Repository</Link>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 items-center bg-white p-3 rounded-2xl border border-zinc-200 shadow-sm">
          <select value={selectedCountry.country} onChange={e => handleCountryChange(e.target.value)} className="border border-zinc-200 bg-zinc-50 rounded-xl px-3 py-1.5 text-sm font-bold text-zinc-800 focus:outline-none cursor-pointer">
            {COUNTRIES.map(c => <option key={c.country} value={c.country}>{c.country} — {c.currency}</option>)}
          </select>
          <span className="text-xs rounded-xl bg-zinc-900 text-white px-3 py-2 font-bold">{selectedCountry.symbol} Framework Matrix</span>
        </div>

        <div className="mt-6 rounded-3xl border border-zinc-200 bg-white shadow-sm flex flex-col h-[550px] overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-zinc-50/30">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${m.role === 'user' ? 'bg-zinc-900 text-white rounded-br-none' : 'bg-white border border-zinc-200 text-zinc-800 rounded-bl-none'}`}>
                  <div className="text-[9px] font-bold uppercase tracking-wider opacity-40 mb-1 border-b pb-0.5">{m.role === 'user' ? 'Authorized Client' : `Advisor Pro &bull; ${m.country}`}</div>
                  <div className="whitespace-pre-wrap">{m.content}</div>
                </div>
              </div>
            ))}
            {loading && <div className="text-xs text-zinc-400 font-bold animate-pulse">Compiling localized regional parameters...</div>}
            <div ref={endRef} />
          </div>

          <div className="px-4 py-2 bg-zinc-50/50 border-t border-zinc-100 flex flex-wrap gap-2">
            {selectedCountry.suggestions.map((s, idx) => (
              <button key={idx} onClick={() => setInput(s)} className="text-[11px] font-bold text-zinc-500 bg-white border border-zinc-200 px-2.5 py-1 rounded-lg hover:border-zinc-950 hover:text-zinc-950 transition-all">{s}</button>
            ))}
          </div>

          <div className="border-t border-zinc-200 p-3 bg-white">
            <div className="flex gap-2 items-center rounded-xl border border-zinc-200 bg-zinc-50 px-2 py-1.5 focus-within:bg-white focus-within:border-zinc-900 transition-all">
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder={`Ask regarding ${selectedCountry.country} compliance criteria...`} className="flex-1 bg-transparent px-3 py-1.5 text-sm text-zinc-900 focus:outline-none" />
              <button onClick={handleSend} disabled={!input.trim() || loading} className="rounded-xl bg-zinc-900 hover:bg-black text-white px-5 py-2 text-sm font-bold disabled:opacity-30">Execute</button>
            </div>
          </div>
        </div>
        <div className="mt-6"><AiDataNotice /></div>
      </div>
    </div>
  );
}

