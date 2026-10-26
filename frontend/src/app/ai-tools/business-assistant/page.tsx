'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import AiDataNotice from '../ai-data-notice';

const COUNTRIES = [
  { country: 'Qatar', currency: 'QAR', symbol: 'QAR', law: 'Qatar Labour Law, QFC', tax: 'No Income Tax' },
  { country: 'Australia', currency: 'AUD', symbol: 'A$', law: 'Fair Work Act 2009, ASIC', tax: 'GST 10%' },
  { country: 'UAE', currency: 'AED', symbol: 'AED', law: 'UAE Labour Law', tax: '5% VAT' },
  { country: 'Saudi Arabia', currency: 'SAR', symbol: 'SAR', law: 'Saudi Labour Law', tax: '15% VAT' },
  { country: 'United Kingdom', currency: 'GBP', symbol: '£', law: 'Employment Rights Act 1996', tax: 'PAYE' },
  { country: 'USA', currency: 'USD', symbol: '$', law: 'FLSA, SBA', tax: 'Federal/State' },
  { country: 'Canada', currency: 'CAD', symbol: 'C$', law: 'Canada Labour Code', tax: 'GST/HST' },
  { country: 'India', currency: 'INR', symbol: '₹', law: 'Companies Act', tax: 'GST 18%' },
] as const;

type Message = { role: 'user' | 'assistant'; content: string; country?: string; currency?: string; };

export default function BusinessAssistantPage() {
  const [selectedCountry, setSelectedCountry] = useState<(typeof COUNTRIES)[number]>(COUNTRIES[0]);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: `Welcome to TMG Business Assistant.\n\nI advise across 8 markets with local compliance:\n\n• Qatar — QAR — Qatar Labour Law, QFC\n• Australia — A$ — Fair Work Act 2009, ASIC\n• UAE — AED — MOHRE\n• UK — £ — Employment Rights Act\n• USA — $ — FLSA, SBA\n\nCurrently set to ${COUNTRIES[0].country} (${COUNTRIES[0].currency}). All figures will be in ${COUNTRIES[0].symbol} and compliant with ${COUNTRIES[0].law}.\n\nHow can I help with your ${COUNTRIES[0].country} business?`, country: 'Qatar', currency: 'QAR' }
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
          message: userMsg.content,
          country: selectedCountry.country,
          currency: selectedCountry.currency,
          symbol: selectedCountry.symbol,
          law: selectedCountry.law,
          tax: selectedCountry.tax,
          compliance: selectedCountry.law,
        })
      });
      const data = await res.json();
      const assistantContent = data.message || data.response || data.content || `Here is guidance for ${selectedCountry.country} under ${selectedCountry.law} in ${selectedCountry.symbol}.`;
      setMessages(prev => [...prev, { role: 'assistant', content: assistantContent, country: selectedCountry.country, currency: selectedCountry.currency }]);
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Connection issue. I can still advise for ${selectedCountry.country} under ${selectedCountry.law} in ${selectedCountry.symbol} ${selectedCountry.currency}. Please try again.`, country: selectedCountry.country, currency: selectedCountry.currency }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#FCFCF9]">
      <div className="max-w-4xl mx-auto px-6 py-10 md:py-14">
        {/* Header */}
        <div className="flex justify-between items-start gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#D4AF37]">AI Tools</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900">Business Assistant</h1>
            <p className="mt-2 text-sm text-zinc-500 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#D4AF37]" />
              {selectedCountry.country} • {selectedCountry.currency} ({selectedCountry.symbol}) • {selectedCountry.law}
            </p>
          </div>
          <Link href="/documents" className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50">Documents</Link>
        </div>

        {/* Country Selector - Premium */}
        <div className="mt-6 flex flex-wrap gap-2 items-center">
          <div className="rounded-full border border-zinc-200 bg-white p-1 flex gap-1 shadow-sm">
            <select value={selectedCountry.country} onChange={e => handleCountryChange(e.target.value)} className="bg-transparent rounded-full px-4 py-1.5 text-sm font-medium text-zinc-900 focus:outline-none cursor-pointer">
              {COUNTRIES.map(c => <option key={c.country} value={c.country}>{c.country} — {c.currency} ({c.symbol})</option>)}
            </select>
          </div>
          <span className="text-xs rounded-full bg-zinc-900 text-white px-3 py-1.5 font-medium">{selectedCountry.symbol} {selectedCountry.currency}</span>
          <span className="text-xs rounded-full bg-white border border-zinc-200 text-zinc-600 px-3 py-1.5">{selectedCountry.tax}</span>
        </div>

        {/* Chat - Premium Card */}
        <div className="mt-6 rounded-[24px] border border-zinc-200 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col h-[640px] overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-[18px] px-4 py-3 text-[14px] leading-6 whitespace-pre-wrap break-words [overflow-wrap:anywhere] leading-relaxed ${m.role === 'user' ? 'bg-zinc-900 text-white rounded-br-[6px]' : 'bg-zinc-50 border border-zinc-100 text-zinc-800 rounded-bl-[6px]'}`}>
                  <div className="text-[10px] font-bold uppercase tracking-[0.15em] opacity-50 mb-1">{m.role === 'user' ? 'You' : `TMG • ${m.country || selectedCountry.country}`}</div>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-[18px] rounded-bl-[6px] bg-zinc-50 border border-zinc-100 px-4 py-3 text-sm text-zinc-500 animate-pulse">
                  Thinking for {selectedCountry.country} in {selectedCountry.symbol}...
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="border-t border-zinc-100 p-3 bg-white">
            <div className="flex gap-2 items-center rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1.5 focus-within:bg-white focus-within:border-zinc-900 transition-colors">
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder={`Ask about ${selectedCountry.country} business in ${selectedCountry.symbol}...`} className="flex-1 bg-transparent px-4 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none" />
              <button onClick={handleSend} disabled={loading || !input.trim()} className="rounded-full bg-zinc-900 text-white px-6 py-2.5 text-sm font-semibold hover:bg-black disabled:opacity-40 transition-all">Send</button>
            </div>
          </div>
        </div>

        <div className="mt-4"><AiDataNotice /></div>
        <div className="mt-3 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-[11px] text-zinc-500">
            {selectedCountry.law} • Tax: {selectedCountry.tax} • {selectedCountry.symbol} {selectedCountry.currency}
          </span>
        </div>
      </div>
    </div>
  );
}

