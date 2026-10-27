"use client";
import { useState, useRef, useEffect } from "react";
export default function SuperAppPage() {
  const [messages, setMessages] = useState<{role:'user'|'assistant', content:string}[]>([
    {role:'assistant', content:'Welcome to TMG Super App! Admin Brain. I understand any language.\nTry: Show homepage / List projects / Settings'}
  ]);
  const [input, setInput] = useState('');
  const [lang, setLang] = useState('auto');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:'smooth'}); }, [messages]);
  async function send() {
    if(!input.trim()) return;
    const userMsg = input;
    setInput('');
    setMessages(m => [...m, {role:'user', content:userMsg}]);
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token') || '';
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const res = await fetch(base + '/admin/superapp/chat', {
        method:'POST',
        headers:{'Content-Type':'application/json', Authorization:'Bearer ' + token},
        body: JSON.stringify({ message: userMsg, language: lang, history: messages.slice(-10) })
      });
      const data = await res.json();
      setMessages(m => [...m, {role:'assistant', content: data.answer || data.answer_en || JSON.stringify(data)}]);
    } catch(e:any) {
      setMessages(m => [...m, {role:'assistant', content:'Error: ' + e.message}]);
    }
    setLoading(false);
  }
  return (
    <div className="min-h-screen bg-[#0f1115] text-white flex flex-col">
      <header className="p-4 border-b border-white/10 flex justify-between items-center">
        <h1 className="text-xl font-bold">TMG Super App - Admin Brain</h1>
        <select value={lang} onChange={e=>setLang(e.target.value)} className="bg-white/10 px-3 py-1 rounded text-sm">
          <option value="auto">Auto Detect</option>
          <option value="en">English</option>
          <option value="ar">Arabic</option>
        </select>
      </header>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-4xl mx-auto w-full">
        {messages.map((m,i)=>(
          <div key={i} className={`p-4 rounded-2xl whitespace-pre-wrap ${m.role==='user' ? 'bg-blue-600 ml-12' : 'bg-white/10 mr-12'}`}>
            <div className="text-xs opacity-50 mb-1">{m.role}</div>{m.content}
          </div>
        ))}
        {loading && <div className="p-4 bg-white/5 rounded-2xl animate-pulse">Thinking...</div>}
        <div ref={bottomRef}/>
      </div>
      <div className="p-4 border-t border-white/10 bg-black/20 sticky bottom-0">
        <div className="max-w-4xl mx-auto flex gap-2">
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter' && send()} placeholder="Ask anything..." className="flex-1 bg-white/10 rounded-full px-5 py-3 outline-none" />
          <button onClick={send} disabled={loading} className="bg-white text-black px-6 py-3 rounded-full font-bold">Send</button>
        </div>
      </div>
    </div>
  );
}
