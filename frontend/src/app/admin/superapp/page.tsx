"use client";
import { useState, useEffect, useRef } from "react";
import ChatPanel from "@/components/superapp/ChatPanel";
import PreviewPanel from "@/components/superapp/PreviewPanel";
import SidebarPanel from "@/components/superapp/SidebarPanel";

export default function SuperAppPage() {
  const [messages, setMessages] = useState<any[]>([
    { role: 'assistant', content: '🌟 TMG Super App V4 - Omnipotent OS\n\nI can generate ANYTHING:\n🎨 Images/Logos (DALL-E 3)\n🎥 Videos (Runway)\n📄 PDFs/DOCX\n📊 PPTX Presentations\n💻 Landing Pages (React code)\n📈 Forex Signals + Bot Code\n🚢 Boat/Shipping Docs\n🔊 Voiceovers\n\nAnd SEND ANYWHERE: Email, WhatsApp, Project, Drive\n\nTry: "Generate luxury logo for TMG, blue gold" or "Create landing page for gym Doha" or "Forex signal EURUSD"\n\nAny language - Arabic, English', engine: 'welcome', timestamp: new Date() }
  ]);
  const [currentAsset, setCurrentAsset] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [gallery, setGallery] = useState<any[]>([]);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://tmg-saas.onrender.com/api';

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    
    const userMsg = { role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/admin/superapp/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ prompt: text, engine: 'auto', context: messages.slice(-6) }),
      });
      const data = await res.json();
      
      const assistantMsg = {
        role: 'assistant',
        content: data.answer || data.answer_en || JSON.stringify(data, null, 2),
        data: data.data,
        engine: data.engine,
        version: data.version,
        timestamp: new Date(),
        raw: data,
      };
      
      setMessages(prev => [...prev, assistantMsg]);
      
      // Update preview panel if asset generated
      if (data.data?.imageUrl || data.data?.professionalPrompt || data.engine === 'image') {
        setCurrentAsset({
          type: 'image',
          url: data.data?.imageUrl,
          prompt: data.data?.professionalPrompt || data.data?.prompt,
          original: text,
          ...data.data,
        });
      } else if (data.engine === 'code' || data.data?.code) {
        setCurrentAsset({ type: 'code', code: data.data?.code || data.answer, prompt: text });
      } else if (data.engine === 'trading' || data.engine === 'forex') {
        setCurrentAsset({ type: 'trading', data: data.data, prompt: text });
      } else if (data.data) {
        setCurrentAsset({ type: data.engine || 'general', data: data.data, prompt: text, answer: data.answer });
      }

      // Refresh gallery if new asset
      if (data.data?.imageUrl) {
        setGallery(prev => [{ url: data.data.imageUrl, prompt: text, createdAt: new Date() }, ...prev]);
      }

    } catch (e:any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `❌ Error: ${e.message}\nCheck backend is live: ${API_URL}`, timestamp: new Date() }]);
    }
    setIsLoading(false);
  };

  return (
    <div className="h-screen flex flex-col bg-[#f8f9fa] text-black">
      {/* HEADER */}
      <div className="h-14 bg-white border-b flex items-center justify-between px-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#0A3D62] rounded-lg flex items-center justify-center text-[#F5B400] font-bold">TMG</div>
          <div>
            <h1 className="font-bold text-[#0A3D62]">Super App V4</h1>
            <p className="text-xs text-gray-500">Omnipotent OS - 12 Engines</p>
          </div>
        </div>
        <div className="flex gap-2">
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">● LIVE</span>
          <span className="text-xs bg-[#0A3D62] text-white px-2 py-1 rounded-full">V3.5</span>
        </div>
      </div>

      {/* 3 PANEL LAYOUT */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT - SIDEBAR */}
        <div className="w-64 bg-white border-r hidden md:flex flex-col">
          <SidebarPanel onSelectChat={(m)=>{}} gallery={gallery} onSelectAsset={setCurrentAsset} />
        </div>

        {/* CENTER - CHAT */}
        <div className="flex-1 flex flex-col bg-[#fcfcfc]">
          <ChatPanel messages={messages} isLoading={isLoading} onSend={sendMessage} />
        </div>

        {/* RIGHT - PREVIEW */}
        <div className="w-[420px] bg-white border-l hidden lg:flex flex-col shadow-lg">
          <PreviewPanel asset={currentAsset} onSendEmail={(email)=>sendMessage(`Send last asset to ${email}`)} />
        </div>
      </div>

      {/* MOBILE PREVIEW - Bottom sheet on mobile */}
      <div className="lg:hidden">
        {currentAsset && (
          <div className="fixed bottom-20 left-2 right-2 bg-white rounded-2xl shadow-2xl border p-3 max-h-[40vh] overflow-auto">
            <PreviewPanel asset={currentAsset} compact />
          </div>
        )}
      </div>
    </div>
  );
}

