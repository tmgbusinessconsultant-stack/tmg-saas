"use client";
import { useState } from "react";
import ChatPanel from "@/components/superapp/ChatPanel";
import type { ChatMessage } from "@/components/superapp/ChatPanel";
import PreviewPanel from "@/components/superapp/PreviewPanel";
import type { AssetPayload } from "@/components/superapp/PreviewPanel";
import SidebarPanel from "@/components/superapp/SidebarPanel";

type GalleryAsset = { url: string; prompt: string; createdAt: Date };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export default function SuperAppPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: '🌟 TMG Super App V4 - Omnipotent OS\n\nI can generate ANYTHING:\n🎨 Images/Logos (DALL-E 3)\n🎥 Videos (Runway)\n📄 PDFs/DOCX\n📊 PPTX Presentations\n💻 Landing Pages (React code)\n📈 Forex Signals + Bot Code\n🚢 Boat/Shipping Docs\n🔊 Voiceovers\n\nAnd SEND ANYWHERE: Email, WhatsApp, Project, Drive\n\nTry: "Generate luxury logo for TMG, blue gold" or "Create landing page for gym Doha" or "Forex signal EURUSD"\n\nAny language - Arabic, English', engine: 'welcome', timestamp: new Date() }
  ]);
  const [currentAsset, setCurrentAsset] = useState<AssetPayload | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [gallery, setGallery] = useState<GalleryAsset[]>([]);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://tmg-saas.onrender.com/api';

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    
    const userMsg: ChatMessage = { role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/admin/superapp/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ prompt: text, engine: 'auto', context: messages.slice(-6) }),
      });
      const response: unknown = await res.json();
      if (!res.ok) throw new Error(`The assistant request failed (${res.status}).`);
      if (!isRecord(response)) throw new Error("The assistant returned an invalid response.");
      const responseData = isRecord(response.data) ? response.data : null;
      const engine = typeof response.engine === "string" ? response.engine : "general";
      const answer = typeof response.answer === "string" ? response.answer
        : typeof response.answer_en === "string" ? response.answer_en
          : JSON.stringify(response, null, 2);
      
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: answer,
        data: responseData && typeof responseData.imageUrl === "string" ? { imageUrl: responseData.imageUrl } : undefined,
        engine,
        version: typeof response.version === "string" ? response.version : undefined,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, assistantMsg]);
      
      // Update preview panel if asset generated
      if (responseData?.imageUrl || responseData?.professionalPrompt || engine === 'image') {
        setCurrentAsset({
          type: 'image',
          url: typeof responseData?.imageUrl === "string" ? responseData.imageUrl : undefined,
          prompt: typeof responseData?.professionalPrompt === "string" ? responseData.professionalPrompt
            : typeof responseData?.prompt === "string" ? responseData.prompt : undefined,
          data: responseData,
        });
      } else if (engine === 'code' || typeof responseData?.code === "string") {
        setCurrentAsset({ type: 'code', code: typeof responseData?.code === "string" ? responseData.code : answer, prompt: text });
      } else if (engine === 'trading' || engine === 'forex') {
        setCurrentAsset({ type: 'trading', data: responseData, prompt: text });
      } else if (responseData) {
        setCurrentAsset({ type: engine, data: responseData, prompt: text, answer });
      }

      // Refresh gallery if new asset
      const generatedImageUrl = typeof responseData?.imageUrl === "string" ? responseData.imageUrl : null;
      if (generatedImageUrl) {
        setGallery(prev => [{ url: generatedImageUrl, prompt: text, createdAt: new Date() }, ...prev]);
      }

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unexpected error";
      setMessages(prev => [...prev, { role: 'assistant', content: `❌ Error: ${message}\nCheck backend is live: ${API_URL}`, timestamp: new Date() }]);
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
          <SidebarPanel gallery={gallery} onSelectAsset={setCurrentAsset} />
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
