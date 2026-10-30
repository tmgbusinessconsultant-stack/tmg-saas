"use client";

interface ActionItem {
  label: string;
  prompt: string;
  icon: string;
  category: "media" | "document" | "finance";
}

interface QuickActionsProps {
  onAction: (prompt: string) => void;
}

export default function QuickActions({ onAction }: QuickActionsProps) {
  const actions: ActionItem[] = [
    // Media & Visuals
    { label: "Generate Logo", prompt: "Generate logo for TMG luxury navy gold", icon: "🎨", category: "media" },
    { label: "Create Video", prompt: "Create a video of two people dancing in Doha desert cinematic", icon: "🎥", category: "media" },
    { label: "Voiceover Engine", prompt: "Create voiceover for ad", icon: "🎙️", category: "media" },
    { label: "Landing Page", prompt: "Create landing page for gym Doha", icon: "💻", category: "media" },

    // Business Documents
    { label: "Business Plan PDF", prompt: "Create business plan PDF for TMG", icon: "📄", category: "document" },
    { label: "Pitch Deck Layout", prompt: "Create pitch deck for startup", icon: "📊", category: "document" },
    { label: "Boat Shipping Docs", prompt: "Create boat shipping docs", icon: "🚢", category: "document" },

    // Financial & Analytics
    { label: "Forex Matrix Signal", prompt: "Forex signal EURUSD", icon: "📈", category: "finance" },
  ];

  // Group actions by their category for clear organization
  const categories = [
    { id: "media", title: "Creative & Media Engines" },
    { id: "document", title: "Corporate Documents & PDFs" },
    { id: "finance", title: "Financial Intelligence" },
  ];

  return (
    <div className="space-y-4 font-sans p-1">
      <div>
        <h3 className="font-bold text-[10px] text-slate-400 tracking-widest uppercase">
          Orchestration Center
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">Instant pipeline trigger vectors</p>
      </div>

      <div className="space-y-3">
        {categories.map((cat) => {
          const filteredActions = actions.filter((a) => a.category === cat.id);
          if (filteredActions.length === 0) return null;

          return (
            <div key={cat.id} className="space-y-1.5">
              <h4 className="text-[10px] font-bold text-slate-500 tracking-wide uppercase px-1">
                {cat.title}
              </h4>
              <div className="grid grid-cols-1 gap-1">
                {filteredActions.map((a) => (
                  <button
                    key={a.label}
                    onClick={() => onAction(a.prompt)}
                    type="button"
                    className="group w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-[#0A3D62] hover:border-[#0A3D62] hover:text-white text-xs font-medium transition-all duration-200 shadow-sm active:scale-[0.99]"
                  >
                    <span className="text-sm bg-slate-50 group-hover:bg-white/10 rounded-lg p-1 w-7 h-7 flex items-center justify-center transition-colors">
                      {a.icon}
                    </span>
                    <span className="flex-1 text-left tracking-wide">{a.label}</span>
                    <span className="text-[10px] opacity-0 group-hover:opacity-100 text-[#F5B400] transition-opacity font-bold font-mono">
                      ⚡ RUN
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

