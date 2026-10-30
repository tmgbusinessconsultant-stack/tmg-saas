"use client";
export default function SidebarPanel({ gallery, onSelectAsset, onSelectChat }: any) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-3">
        <button className="w-full bg-[#0A3D62] text-white py-2.5 rounded-xl font-medium hover:bg-[#0d4d7a] transition">+ New Chat</button>
      </div>
      
      <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Quick Actions</div>
      <div className="px-2 space-y-1">
        {[
          { icon: '🎨', label: 'Generate Logo' },
          { icon: '🎥', label: 'Create Video' },
          { icon: '📄', label: 'Business Plan PDF' },
          { icon: '📊', label: 'Pitch Deck' },
          { icon: '💻', label: 'Landing Page' },
          { icon: '📈', label: 'Forex Signal' },
          { icon: '🚢', label: 'Boat Docs' },
          { icon: '🔊', label: 'Voiceover' },
        ].map((a)=>(
          <button key={a.label} className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 text-sm flex items-center gap-2">
            <span>{a.icon}</span> {a.label}
          </button>
        ))}
      </div>

      <div className="px-3 py-2 mt-4 text-xs font-semibold text-gray-500 uppercase">Recent Assets ({gallery.length})</div>
      <div className="flex-1 overflow-auto px-2 space-y-2">
        {gallery.length === 0 ? (
          <p className="text-xs text-gray-400 px-3">No assets yet. Generate a logo!</p>
        ) : (
          gallery.map((g:any, i:number)=>(
            <div key={i} onClick={()=>onSelectAsset({ type: 'image', url: g.url, prompt: g.prompt })} className="cursor-pointer rounded-lg border overflow-hidden hover:shadow-md transition">
              <img src={g.url} alt={g.prompt} className="w-full h-24 object-cover" />
              <p className="text-[10px] p-1 truncate">{g.prompt?.substring(0,30)}</p>
            </div>
          ))
        )}
      </div>

      <div className="p-3 border-t text-[10px] text-gray-400">
        TMG Super App V4<br/>12 Engines • Send Anywhere
      </div>
    </div>
  );
}

