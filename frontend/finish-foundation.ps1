
@'
import "./globals.css";
import Link from "next/link";
import Image from "next/image";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#F8FAFC] text-[#0F172A]">
        <header className="sticky top-0 z-50 bg-[#0F172A] text-white p-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.png" alt="TMG" width={140} height={40} className="h-8 w-auto bg-white rounded px-1" />
            <span className="font-bold text-sm hidden md:inline">TMG <span className="text-[#D4AF37]">Business Consulting</span></span>
          </Link>
          <nav className="flex gap-4 text-xs md:text-sm items-center">
            <Link href="/services">Services</Link>
            <Link href="/ai-tools/business-assistant">AI Tools</Link>
            <Link href="/documents">Documents</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/admin" className="bg-[#D4AF37] text-black px-3 py-1 rounded font-bold">Admin</Link>
          </nav>
        </header>
        <main className="min-h-screen">{children}</main>
        <footer className="bg-[#0F172A] text-white p-8 mt-10 text-xs">
          <div className="max-w-7xl mx-auto flex justify-between">
            <div>TMG Business Consulting - Doha, Qatar<br/>AI • Training • Growth</div>
            <div>Visa | Mastercard | PayPal | Apple Pay</div>
          </div>
        </footer>
      </body>
    </html>
  );
}
'@ | Set-Content src/app/layout.tsx -Encoding utf8

# === 2. CLEAN AI TOOL PAGE THAT NEVER BREAKS ===
@'
'use client';
import { useState } from 'react';
export default function BusinessAssistant(){
  const [input,setInput]=useState('');
  const [messages,setMessages]=useState([{role:'assistant', content:'Hello! I am TMG AI Consultant. How can I help your Qatar business today?'}]);
  const [loading,setLoading]=useState(false);
  async function send(){
    if(!input.trim()) return;
    const newMsgs=[...messages,{role:'user',content:input}];
    setMessages(newMsgs); setInput(''); setLoading(true);
    try{
      const res=await fetch('/api/ai/business-assistant',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:newMsgs})});
      const data=await res.json();
      setMessages([...newMsgs,{role:'assistant',content:data.message}]);
    }catch(e){ setMessages([...newMsgs,{role:'assistant',content:'Error connecting to AI'}]); }
    setLoading(false);
  }
  return (
    <div className='max-w-3xl mx-auto p-6'>
      <h1 className='text-3xl font-bold'>AI Business Assistant</h1>
      <div className='mt-6 border rounded-xl h-[500px] overflow-y-auto p-4 bg-gray-50 space-y-3'>
        {messages.map((m,i)=>(
          <div key={i} className={m.role==='user' ? 'text-right' : 'text-left'}>
            <span className={m.role==='user' ? 'inline-block px-4 py-2 rounded-xl text-sm bg-[#0F172A] text-white' : 'inline-block px-4 py-2 rounded-xl text-sm bg-white border'}>
              {m.content}
            </span>
          </div>
        ))}
        {loading && <p className='text-sm text-gray-400'>Thinking...</p>}
      </div>
      <div className='mt-4 flex gap-2'>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} className='flex-1 border p-3 rounded-lg' placeholder='Ask about Qatar business setup...' />
        <button onClick={send} className='bg-[#0F172A] text-white px-6 rounded-lg'>Send</button>
      </div>
    </div>
  )
}
'@ | Set-Content src/app/ai-tools/business-assistant/page.tsx -Encoding utf8

Write-Host "Foundation fixed - now run npm run dev"