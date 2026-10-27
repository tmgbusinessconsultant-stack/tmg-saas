"use client";
import { useState, useRef, useEffect } from "react";

export default function ChatPanel({ messages, isLoading, onSend }: any) {
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(()=>{ scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const startVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice not supported - use Chrome browser');
      return;
    }
    const rec = new SpeechRecognition();
    rec.lang = 'en-US';
    rec.continuous = false;
    rec.interimResults = false;
    rec.onstart = () => setIsListening(true);
    rec.onend = () => setIsListening(false);
    rec.onresult = (e:any) => {
      const text = e.results[0][0].transcript;
      setInput("");
      onSend(text);
    };
    rec.onerror = () => setIsListening(false);
    rec.start();
  };

  const quickChips = ["Generate logo", "Create landing page for gym Doha", "Forex EURUSD", "Business plan PDF", "صمم لوجو", "Boat shipping docs"];

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.map((m:any, i:number)=>(
          <div key={i} className={`flex ${m.role==='user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${m.role==='user' ? 'bg-[#0A3D62] text-white rounded-br-sm' : 'bg-white border shadow-sm rounded-bl-sm'}`}>
              {m.engine && m.role==='assistant' && (
                <div className="text-[10px] font-bold text-[#F5B400] bg-[#0A3D62] inline-block px-2 py-0.5 rounded-full mb-1">{m.engine?.toUpperCase()} • {m.version || 'V3.5'}</div>
              )}
              <div>{m.content}</div>
              {m.data?.imageUrl && (
                <img src={m.data.imageUrl} alt="generated" className="mt-2 rounded-xl max-h-64 w-auto border" />
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border rounded-2xl px-4 py-3 text-sm shadow-sm">⏳ Generating... Super App thinking with 12 engines...</div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <div className="px-4 py-2 flex gap-2 overflow-auto">
        {quickChips.map((c)=>(
          <button key={c} onClick={()=>onSend(c)} className="text-xs whitespace-nowrap bg-white border px-3 py-1.5 rounded-full hover:bg-[#0A3D62] hover:text-white transition">{c}</button>
        ))}
      </div>

      <div className="p-3 bg-white border-t">
        <div className="flex items-end gap-2 bg-gray-100 rounded-2xl px-3 py-2">
          <button onClick={startVoice} title="Voice input" className={`w-9 h-9 rounded-full flex items-center justify-center text-lg ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-white border hover:bg-gray-50'}`}>🎤</button>
          <textarea
            value={input}
            onChange={(e)=>setInput(e.target.value)}
            onKeyDown={(e)=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); onSend(input); setInput(''); } }}
            placeholder={isListening ? "🎤 Listening... speak now" : "Generate anything... or click mic 🎤"}
            className="flex-1 bg-transparent resize-none outline-none text-sm max-h-24 min-h-[24px]"
            rows={1}
          />
          <button onClick={()=>{ onSend(input); setInput(''); }} className="w-9 h-9 bg-[#0A3D62] text-white rounded-full flex items-center justify-center hover:bg-[#0d4d7a] font-bold">↑</button>
        </div>
        <div className="text-[10px] text-gray-400 text-center mt-1">🎤 Voice enabled - Click mic - Any language - Arabic, English</div>
      </div>
    </div>
  );
}
