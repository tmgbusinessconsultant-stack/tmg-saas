'use client';

import { useState, type FormEvent } from 'react';
import AiDataNotice from '../ai-data-notice';
import TurnstileChallenge from '@/components/turnstile-challenge';

type Message = { role: 'user' | 'assistant'; content: string };

export default function BusinessAssistant() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I can help with general questions about TMG services and business topics. What would you like to explore?' },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [captchaRevision, setCaptchaRevision] = useState(0);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const prompt = input.trim();
    if (!prompt || loading || prompt.length > 4000) return;
    if (!turnstileToken) {
      setError('Complete the bot verification challenge before sending.');
      return;
    }

    const nextMessages: Message[] = [...messages, { role: 'user', content: prompt }];
    const requestMessages = nextMessages.slice(-20);
    setMessages(nextMessages);
    setInput('');
    setError('');
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "");
      if (!apiUrl) throw new Error('The AI service is not configured.');
      const response = await fetch(`${apiUrl}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ messages: requestMessages, turnstileToken }),
      });
      const data: unknown = await response.json();
      if (!response.ok || typeof data !== 'object' || data === null || !('message' in data) || typeof data.message !== 'string') {
        const responseMessage = typeof data === 'object' && data !== null && 'message' in data ? data.message : undefined;
        const detail = typeof responseMessage === 'string'
          ? responseMessage
          : Array.isArray(responseMessage) && responseMessage.every((item) => typeof item === 'string')
            ? responseMessage.join(' ')
          : 'The assistant could not answer right now.';
        throw new Error(detail);
      }
      setMessages([...nextMessages, { role: 'assistant', content: data.message }]);
    } catch (sendError: unknown) {
      setError(sendError instanceof Error ? sendError.message : 'The assistant could not answer right now.');
      setMessages(nextMessages);
    } finally {
      setLoading(false);
      setTurnstileToken('');
      setCaptchaRevision((revision) => revision + 1);
    }
  }

  return (
    <section className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div aria-live="polite" className="h-[min(60vh,500px)] min-h-72 space-y-3 overflow-y-auto rounded-xl bg-slate-50 p-4">
        {messages.map((message, index) => (
          <div key={`${index}-${message.role}`} className={message.role === 'user' ? 'text-right' : 'text-left'}>
            <span className={`inline-block max-w-[90%] whitespace-pre-wrap rounded-xl px-4 py-3 text-left text-sm ${message.role === 'user' ? 'bg-[#0F172A] text-white' : 'border border-slate-200 bg-white text-slate-800'}`}>
              {message.content}
            </span>
          </div>
        ))}
        {loading && <p className="text-sm text-slate-500" role="status">Thinking…</p>}
      </div>
      {error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p>}
      <form onSubmit={send} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <label htmlFor="ai-question" className="sr-only">Ask TMG AI a question</label>
        <input id="ai-question" value={input} maxLength={4000} onChange={(event) => setInput(event.target.value)} className="min-w-0 flex-1 rounded-lg border border-slate-300 p-3" placeholder="Ask about consulting, automation, or data analysis…" />
        <button type="submit" disabled={loading || !input.trim() || !turnstileToken} className="rounded-lg bg-[#0F172A] px-6 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">Send</button>
      </form>
      <div className="mt-4">
        <TurnstileChallenge key={captchaRevision} onToken={setTurnstileToken} />
      </div>
      <AiDataNotice />
    </section>
  );
}
