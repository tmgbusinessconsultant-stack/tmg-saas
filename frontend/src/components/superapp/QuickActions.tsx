"use client";
export default function QuickActions({ onAction }: { onAction: (msg: string) => void }) {
  const actions = [
    { label: "Generate Logo", prompt: "Generate logo for TMG luxury navy gold" },
    { label: "Create Video", prompt: "Create a video of two people dancing in Doha desert cinematic" },
    { label: "Business Plan PDF", prompt: "Create business plan PDF for TMG" },
    { label: "Pitch Deck", prompt: "Create pitch deck for startup" },
    { label: "Landing Page", prompt: "Create landing page for gym Doha" },
    { label: "Forex Signal", prompt: "Forex signal EURUSD" },
    { label: "Boat Docs", prompt: "Create boat shipping docs" },
    { label: "Voiceover", prompt: "Create voiceover for ad" },
  ];
  return (
    <div className="space-y-2">
      <h3 className="font-bold text-xs text-gray-500">QUICK ACTIONS</h3>
      {actions.map(a=>(
        <button key={a.label} onClick={()=>onAction(a.prompt)} className="w-full text-left px-3 py-2 rounded-lg bg-white border hover:bg-[#0A3D62] hover:text-white text-sm transition">
          {a.label}
        </button>
      ))}
    </div>
  );
}
