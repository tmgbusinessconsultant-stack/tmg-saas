"use client";
import { useState, useRef, useEffect } from "react";

export interface MessageData {
  imageUrl?: string;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  engine?: string;
  version?: string;
  data?: MessageData;
}

interface ChatPanelProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSend: (text: string) => void;
}

export default function ChatPanel({ messages, isLoading, onSend }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Smoothly snaps the panel view container downward upon message array hydration changes
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleDispatch = () => {
    const trimmedInput = input.trim();
    if (!trimmedInput) return; // Safeguard against blank dispatch cycles
    onSend(trimmedInput);
    setInput("");
  };

  const startVoice = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser. Please switch to Google Chrome.");
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = "en-US";
    rec.continuous = false;
    rec.interimResults = false;

    rec.onstart = () => setIsListening(true);
    rec.onend = () => setIsListening(false);
    rec.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      if (text?.trim()) {
        onSend(text.trim());
      }
    };
    rec.onerror = () => setIsListening(false);
    rec.start();
  };

  const quickChips = [
    "Generate logo",
    "Create landing page for gym Doha",
    "Forex EURUSD",
    "Business plan PDF",
    "صمم لوجو",
    "Boat shipping docs",
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50 font-sans">
      {/* Scrollable Message History Track */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${m.role === "user"
                  ? "bg-[#0A3D62] text-white rounded-br-sm shadow-md"
                  : "bg-white border text-slate-800 shadow-sm rounded-bl-sm"
                }`}
            >
              {/* Context Engine Flagging Header Block */}
              {m.engine && m.role === "assistant" && (
                <div className="text-[10px] font-bold text-[#F5B400] bg-[#0A3D62] inline-block px-2 py-0.5 rounded-full mb-1 tracking-wider uppercase">
                  {m.engine} • {m.version || "V7.0"}
                </div>
              )}

              <div className="leading-relaxed">{m.content}</div>

              {/* Dynamic Engine Visual Media Rendering Asset Output */}
              {m.data?.imageUrl && (
                <div className="mt-3 overflow-hidden rounded-xl border bg-slate-100">
                  <img
                    src={m.data.imageUrl}
                    alt="AI Synthesized Output"
                    loading="lazy"
                    className="max-h-72 w-auto object-contain mx-auto"
                  />
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Active Async Generation Skeleton Placeholder */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border rounded-2xl px-4 py-3 text-sm shadow-sm text-slate-500 animate-pulse flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-[#0A3D62] animate-bounce" />
              Super App thinking with 12 engines...
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Recommended Sourcing Prompt Filters Row */}
      <div className="px-4 py-2 flex gap-2 overflow-x-auto scrollbar-none bg-slate-50 border-t border-slate-100">
        {quickChips.map((c) => (
          <button
            key={c}
            onClick={() => onSend(c)}
            className="text-xs text-slate-600 whitespace-nowrap bg-white border border-slate-200 px-3 py-1.5 rounded-full hover:bg-[#0A3D62] hover:border-[#0A3D62] hover:text-white transition-all duration-200 shadow-sm"
          >
            {c}
          </button>
        ))}
      </div>

      {/* Master Interaction Boundary Form Console */}
      <div className="p-3 bg-white border-t border-slate-200 shadow-inner">
        <div className="flex items-end gap-2 bg-slate-100 rounded-2xl px-3 py-2 border border-slate-200 focus-within:border-slate-300 transition-colors">
          <button
            onClick={startVoice}
            type="button"
            title="Voice input"
            className={`w-9 h-9 rounded-full flex items-center justify-center text-lg transition-transform active:scale-95 ${isListening
                ? "bg-red-500 text-white animate-pulse"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm"
              }`}
          >
            🎤
          </button>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleDispatch();
              }
            }}
            placeholder={isListening ? "Listening... speak now" : "Generate anything... or click mic 🎤"}
            className="flex-1 bg-transparent resize-none outline-none text-sm text-slate-800 max-h-24 min-h-[24px] py-1.5"
            rows={1}
          />

          <button
            onClick={handleDispatch}
            type="button"
            disabled={!input.trim()}
            className="w-9 h-9 bg-[#0A3D62] text-white rounded-full flex items-center justify-center hover:bg-[#0d4d7a] transition-all disabled:opacity-40 disabled:hover:bg-[#0A3D62] font-bold shadow-sm"
          >
            ↑
          </button>
        </div>
        <div className="text-[10px] text-slate-400 text-center mt-1.5 tracking-wide">
          Multilingual Processing Active — Speaks Arabic & English fluently
        </div>
      </div>
    </div>
  );
}
