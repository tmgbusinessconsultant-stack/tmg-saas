'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import AiDataNotice from '../ai-data-notice';

const COUNTRIES = [
  { country: 'Qatar', currency: 'QAR', symbol: 'QAR ', law: 'Qatar Labour Law, QFC', tax: 'No Income Tax', flag: '🇶🇦', compliance: 'QFC LLC' },
  { country: 'Australia', currency: 'AUD', symbol: 'A$', law: 'Fair Work Act 2009, ASIC', tax: 'GST 10%', flag: '🇦🇺', compliance: 'ABN/ACN' },
  { country: 'UAE', currency: 'AED', symbol: 'AED ', law: 'UAE Labour Law', tax: '5% VAT', flag: '🇦🇪', compliance: 'MOHRE' },
  { country: 'Saudi Arabia', currency: 'SAR', symbol: 'SAR ', law: 'Saudi Labour Law', tax: '15% VAT', flag: '🇸🇦', compliance: 'Qiwa' },
  { country: 'United Kingdom', currency: 'GBP', symbol: '£', law: 'Employment Rights Act 1996', tax: 'PAYE', flag: '🇬🇧', compliance: 'UKVI' },
  { country: 'USA', currency: 'USD', symbol: '$', law: 'FLSA, SBA', tax: 'Federal/State', flag: '🇺🇸', compliance: 'SBA 7(a)' },
  { country: 'Canada', currency: 'CAD', symbol: 'C$', law: 'Canada Labour Code', tax: 'GST/HST', flag: '🇨🇦', compliance: 'LMIA' },
  { country: 'India', currency: 'INR', symbol: '₹', law: 'Companies Act', tax: 'GST 18%', flag: '🇮🇳', compliance: 'PF/ESI' },
] as const;

type Message = { role: 'user' | 'assistant'; content: string; country?: string; currency?: string; };

export default function BusinessAssistantPage() {
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [messages, setMessages] = useState<Message[]>([{ role: 'assistant', content: `Hello! I am TMG Business Consultant — Premium International 🌍\n\nI support 10 countries with local law compliance:\n🇶🇦 Qatar QAR — QFC, No Income Tax\n🇦🇺 Australia AUD A$ — Fair Work Act 2009, ASIC, ABN/ACN, GST 10%\n🇦🇪 UAE AED — MOHRE, 5% VAT\n🇸🇦 Saudi SAR — Qiwa/Mudad, 15% VAT\n🇬🇧 UK GBP £ — Equality Act, PAYE\n🇺🇸 USA USD $ — FLSA, SBA 7(a)\n🇨🇦 Canada CAD C$ — LMIA\n🇮🇳 India INR ₹ — GST 18%\n\nSelected: ${COUNTRIES[0].flag} ${COUNTRIES[0].country} | ${COUNTRIES[0].currency} (${COUNTRIES[0].symbol}) | ${COUNTRIES[0].law}\n\nAsk me anything about business setup, compliance, funding in ${COUNTRIES[0].currency}, or document generation.`, country: 'Qatar', currency: 'QAR' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCountryChange = (countryName: string) => {
    const c = COUNTRIES.find(x => x.country === countryName) || COUNTRIES[0];
    setSelectedCountry(c);
    setMessages(prev => [...prev, { role: 'assistant', content: `Switched to ${c.flag} ${c.country} — ${c.currency} (${c.symbol})\n\nLaw: ${c.law}\nTax: ${c.tax}\nCompliance: ${c.compliance}\n\nAll business advice will now be tailored to ${c.country} market with figures in ${c.symbol} ${c.currency} and compliance under ${c.law}. How can I help with ${c.country} business?`, country: c.country, currency: c.currency }]);
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg: Message = { role: 'user', content: input, country: selectedCountry.country, currency: selectedCountry.currency };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/ai/business-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: input, 
          country: selectedCountry.country,
          currency: selectedCountry.currency,
          symbol: selectedCountry.symbol,
          law: selectedCountry.law,
          tax: selectedCountry.tax,
          compliance: selectedCountry.compliance,
          context: `You are TMG Business Consultant Premium International. User is in ${selectedCountry.country} market. Use currency ${selectedCountry.currency} (${selectedCountry.symbol}), comply with ${selectedCountry.law}, tax ${selectedCountry.tax}, compliance ${selectedCountry.compliance}. Always show financial figures in ${selectedCountry.symbol} ${selectedCountry.currency}. Mention local law ${selectedCountry.law} in advice.`
        })
      });
      const data = await res.json();
      const assistantContent = data.message || data.response || data.content || `Advice for ${selectedCountry.country} (${selectedCountry.currency}): ${input} — Under ${selectedCountry.law}, with tax ${selectedCountry.tax}, figures in ${selectedCountry.symbol} ${selectedCountry.currency}. Compliance: ${selectedCountry.compliance}.`;
      setMessages(prev => [...prev, { role: 'assistant', content: assistantContent, country: selectedCountry.country, currency: selectedCountry.currency }]);
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${e.message}. But for ${selectedCountry.country} under ${selectedCountry.law}, advice in ${selectedCountry.symbol} ${selectedCountry.currency} still available. Compliance: ${selectedCountry.compliance}`, country: selectedCountry.country, currency: selectedCountry.currency }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex justify-between items-center">
        <div><h1 className="text-3xl font-bold">Business Assistant Pro — International</h1><p className="text-sm text-gray-600 mt-1">{selectedCountry.flag} {selectedCountry.country} | {selectedCountry.currency} ({selectedCountry.symbol}) | {selectedCountry.law} | {selectedCountry.tax}</p></div>
        <Link href="/documents" className="text-sm underline">Documents</Link>
      </div>

      <div className="mt-4 flex gap-3 items-center">
        <select value={selectedCountry.country} onChange={e => handleCountryChange(e.target.value)} className="border rounded-full px-3 py-1.5 text-xs bg-white font-semibold shadow-sm">{COUNTRIES.map(c => <option key={c.country} value={c.country}>{c.flag} {c.country} - {c.currency} ({c.symbol}) | {c.law.substring(0,25)}</option>)}</select>
        <span className="text-xs bg-black text-white px-2 py-1 rounded-full">{selectedCountry.symbol} {selectedCountry.currency} | {selectedCountry.compliance}</span>
      </div>

      <div className="mt-6 border rounded-xl bg-white shadow-sm flex flex-col h-[600px]">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`p-3 rounded-xl max-w-[85%] text-sm whitespace-pre-wrap ${m.role === 'user' ? 'bg-black text-white ml-auto' : 'bg-gray-100 text-black'}`}>
              <div className="text-[10px] opacity-60 mb-1">{m.role === 'user' ? 'You' : `TMG Assistant — ${m.country || selectedCountry.country} | ${m.currency || selectedCountry.currency}`} {m.role === 'assistant' ? `${selectedCountry.flag}` : ''}</div>
              {m.content}
            </div>
          ))}
          {loading && <div className="p-3 rounded-xl bg-gray-100 text-sm animate-pulse">Thinking for {selectedCountry.country} in {selectedCountry.currency} under {selectedCountry.law}...</div>}
        </div>
        <div className="border-t p-3 flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder={`Ask about ${selectedCountry.country} business in ${selectedCountry.currency} (${selectedCountry.symbol}) — ${selectedCountry.law}...`} className="flex-1 border rounded-full px-4 py-2 text-sm" />
          <button onClick={handleSend} disabled={loading} className="bg-black text-white px-5 py-2 rounded-full text-sm font-bold">Send — {selectedCountry.flag}</button>
        </div>
      </div>
      <div className="mt-4"><AiDataNotice /></div>
      <div className="mt-3 text-xs text-gray-500 p-2 bg-gray-50 rounded">Compliance: {selectedCountry.law} | Tax: {selectedCountry.tax} | Currency: {selectedCountry.symbol} {selectedCountry.currency} | TMG Premium International — 10 Countries</div>
    </div>
  );
}
