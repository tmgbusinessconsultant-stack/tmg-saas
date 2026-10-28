"use client";
import { useState } from "react";

export type AssetType = "image" | "code" | "trading" | "document" | "video" | string;

export interface AssetPayload {
  type: AssetType;
  url?: string;
  prompt?: string;
  code?: string;
  answer?: string;
  data?: any;
}

interface PreviewPanelProps {
  asset: AssetPayload | null | undefined;
  onSendEmail?: (email: string) => void;
  onActionTrigger?: (actionType: "download" | "copy" | "video" | "variations" | "whatsapp") => void;
  compact?: boolean;
}

export default function PreviewPanel({ asset, onSendEmail, onActionTrigger, compact }: PreviewPanelProps) {
  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "sent" | "invalid">("idle");

  const handleEmailDispatch = () => {
    const trimmedEmail = email.trim();
    // Strict production regex verification
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(trimmedEmail)) {
      setEmailStatus("invalid");
      return;
    }

    onSendEmail?.(trimmedEmail);
    setEmailStatus("sent");
    setTimeout(() => setEmailStatus("idle"), 3000);
  };

  const handleClipboardCopy = async () => {
    let copyText = asset?.url || asset?.code || asset?.answer || "";
    if (typeof copyText === "object") copyText = JSON.stringify(copyText, null, 2);
    
    try {
      await navigator.clipboard.writeText(copyText);
      onActionTrigger?.("copy");
    } catch (err) {
      console.error("Failed to copy asset payload to clipboard:", err);
    }
  };

  if (!asset) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white border border-slate-200 rounded-2xl m-2 shadow-sm">
        <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-2xl mb-4 shadow-inner">
          👁️
        </div>
        <h3 className="font-bold text-sm text-[#0A3D62] tracking-wide">Live Preview Engine</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-[220px] leading-relaxed">
          Synthesized output visualizations will stream here in real time.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-2 w-full max-w-sm">
          {[
            { tag: "🎨 Image", status: "Active" },
            { tag: "📄 PDF", status: "Ready" },
            { tag: "💻 Code", status: "Ready" },
            { tag: "📈 Forex", status: "Active" },
          ].map((item) => (
            <div key={item.tag} className="text-xs bg-slate-50 border border-slate-100 rounded-xl p-3 text-center transition-all hover:bg-slate-100/50">
              <span className="font-medium text-slate-700">{item.tag}</span>
              <br />
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 animate-pulse">{item.status}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white border-l border-slate-200">
      {/* Header Context Bar */}
      <div className="p-3 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
        <h3 className="font-bold text-xs uppercase tracking-wider text-[#0A3D62]">
          {(asset.type || "Asset").toUpperCase()} Sandbox Preview
        </h3>
        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200/50 uppercase tracking-wide">
          Ready
        </span>
      </div>

      {/* Main Sandbox Canvas Wrapper */}
      <div className="flex-1 overflow-auto p-4 space-y-4 bg-slate-50/30">
        {/* IMAGE PREVIEW PIPELINE */}
        {asset.type === "image" && (
          <div className="space-y-3">
            {asset.url ? (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                <img src={asset.url} alt={asset.prompt || "AI Output"} className="w-full h-auto object-contain rounded-lg" loading="lazy" />
              </div>
            ) : (
              <div className="w-full h-48 bg-slate-100 border border-dashed rounded-xl flex items-center justify-center text-xs text-slate-400 font-mono">
                [Media Buffer Stream Empty]
              </div>
            )}
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Cleaned Pipeline Prompt</p>
              <p className="text-xs text-slate-700 mt-1 font-medium leading-relaxed">{asset.prompt || "No prompt meta mapped."}</p>
            </div>
          </div>
        )}

        {/* COMPILER CODE PIPELINE */}
        {asset.type === "code" && (
          <div className="space-y-3">
            <div className="bg-[#0D1117] border border-slate-900 rounded-xl p-3 text-[11px] font-mono overflow-auto max-h-80 whitespace-pre shadow-lg scrollbar-thin text-slate-200">
              <code>{asset.code?.substring(0, 5000) || "// No source string available."}</code>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Isolated Sandbox Sandbox Mock</p>
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-lg">
                <h1 className="font-bold text-sm text-slate-800">{asset.prompt || "Dynamic Application Component"}</h1>
                <p className="text-[11px] text-slate-400 mt-0.5">Enterprise Execution Subsystem — Generated by TMG Super App</p>
              </div>
            </div>
          </div>
        )}

        {/* METRICS & TRADING PIPELINE */}
        {asset.type === "trading" && (
          <div className="space-y-3">
            <div className="bg-gradient-to-br from-[#0A3D62] to-[#145385] text-white rounded-xl p-4 shadow-md border border-[#0A3D62]">
              <p className="text-[9px] text-[#F5B400] font-bold uppercase tracking-widest">Execution Matrix Signal</p>
              <p className="text-base font-bold mt-0.5 tracking-tight">EUR / USD — MACD Bullish Momentum</p>
              <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                <div className="bg-white/10 backdrop-blur-md rounded-lg p-2 border border-white/5">
                  <p className="text-[9px] text-slate-300 font-medium">ENTRY</p>
                  <p className="font-mono font-bold text-xs text-white mt-0.5">1.0850</p>
                </div>
                <div className="bg-rose-500/20 backdrop-blur-md rounded-lg p-2 border border-rose-500/20">
                  <p className="text-[9px] text-rose-300 font-medium">STOP LOSS</p>
                  <p className="font-mono font-bold text-xs text-rose-200 mt-0.5">1.0820</p>
                </div>
                <div className="bg-emerald-500/20 backdrop-blur-md rounded-lg p-2 border border-emerald-500/20">
                  <p className="text-[9px] text-emerald-300 font-medium">TAKE PROFIT</p>
                  <p className="font-mono font-bold text-xs text-emerald-200 mt-0.5">1.0880</p>
                </div>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-600 shadow-sm leading-relaxed space-y-1">
              <div className="flex justify-between border-b pb-1 text-[11px] font-mono"><span className="text-slate-400">SESSION</span><span className="font-bold text-slate-700">DOHA / LOND</span></div>
              <div className="flex justify-between border-b pb-1 text-[11px] font-mono"><span className="text-slate-400">INDICATORS</span><span className="font-bold text-slate-700">RSI 62 / MACD CROSS</span></div>
            </div>
          </div>
        )}

        {/* COGNITIVE GENERAL FALLBACK */}
        {asset.type !== "image" && asset.type !== "code" && asset.type !== "trading" && (
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed shadow-sm font-mono max-h-[400px] overflow-auto">
            {asset.answer || JSON.stringify(asset.data || asset, null, 2)}
          </div>
        )}
      </div>

      {/* Control Console Action Deck */}
      <div className="p-3 border-t border-slate-200 space-y-2 bg-slate-50">
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => onActionTrigger?.("download")} className="bg-[#0A3D62] text-white py-2 rounded-xl text-xs font-bold hover:bg-[#0d4d7a] transition-all shadow-sm active:scale-[0.98]">
            ⬇️ Download
          </button>
          <button onClick={handleClipboardCopy} className="bg-white border border-slate-200 text-slate-700 py-2 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all shadow-sm active:scale-[0.98]">
            📋 Copy
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => onActionTrigger?.("video")} className="bg-[#F5B400] text-[#0A3D62] py-2 rounded-xl text-xs font-bold hover:bg-[#e0a400] transition-all shadow-sm active:scale-[0.98]">
            🎥 Make Video
          </button>
          <button onClick={() => onActionTrigger?.("variations")} className="bg-white border border-slate-200 text-slate-700 py-2 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all shadow-sm active:scale-[0.98]">
            ✨ Variations
          </button>
        </div>
        
        {/* Core Distribution Router Console */}
        <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-sm">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Omni Distribution Core</p>
          <div className="flex gap-1.5">
            <input 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              type="email" 
              placeholder="Enter email..."
              className={`flex-1 text-xs px-3 py-2 rounded-xl border ${emailStatus === "invalid" ? "border-rose-500" : "border-slate-200"} focus:outline-none focus:ring-2 focus:ring-[#0A3D62]/30`}
            />
            <button 
              onClick={handleEmailDispatch}
              className="bg-[#0A3D62] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#0d4d7a] transition-all shadow-sm active:scale-[0.98]"
            >
              📧 Send
            </button>
          </div>
          {emailStatus === "invalid" && <p className="text-[10px] text-rose-500 mt-1">Invalid email address.</p>}
          {emailStatus === "sent" && <p className="text-[10px] text-emerald-600 mt-1">Email sent successfully!</p>}
        </div>
      </div>
    </div>
  );
}