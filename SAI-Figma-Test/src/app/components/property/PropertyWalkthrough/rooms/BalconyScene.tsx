import React from "react";
import { Sun, Wind } from "lucide-react";

interface BalconySceneProps {
  roomName?: string;
  balconyNumber?: number;
  roomData?: Record<string, any>;
  dimensions?: string;
}

export const BalconyScene: React.FC<BalconySceneProps> = ({
  roomName = "Balcony",
  balconyNumber = 1,
  roomData,
  dimensions,
}) => {
  const dim = roomData?.dimensions || dimensions || "11'0\" × 4'6\"";

  return (
    <div className="relative w-full h-full overflow-hidden bg-gradient-to-b from-[#091522] via-[#0d2235] to-[#08111c] flex items-center justify-center select-none">
      {/* 2.5D Perspective Balcony Container */}
      <div 
        className="relative w-full max-w-4xl h-full max-h-[520px] flex items-center justify-center"
        style={{ perspective: "1000px" }}
      >
        {/* Open Skyline Backdrop (Outdoor View) */}
        <div className="absolute inset-x-8 top-8 bottom-28 bg-gradient-to-b from-sky-400 via-sky-200 to-amber-100 rounded-t-3xl border-t border-x border-teal-500/20 shadow-2xl overflow-hidden">
          {/* Distant City Skyline Silhouettes */}
          <div className="absolute bottom-6 inset-x-0 h-28 flex items-end justify-around opacity-40">
            <div className="w-12 h-20 bg-slate-700/80 rounded-t-sm" />
            <div className="w-8 h-26 bg-slate-800/80 rounded-t-sm" />
            <div className="w-16 h-16 bg-slate-700/80 rounded-t-sm" />
            <div className="w-10 h-24 bg-slate-800/80 rounded-t-sm" />
            <div className="w-14 h-18 bg-slate-700/80 rounded-t-sm" />
            <div className="w-9 h-28 bg-slate-800/80 rounded-t-sm" />
          </div>

          {/* Golden Sunlight & Gentle Sun Beam */}
          <div className="absolute top-6 right-16 flex items-center gap-2">
            <div className="w-16 h-16 rounded-full bg-amber-300/80 blur-sm flex items-center justify-center shadow-[0_0_40px_rgba(251,191,36,0.8)]">
              <Sun className="w-8 h-8 text-amber-500 animate-pulse" />
            </div>
          </div>

          {/* Floating Gentle Breeze Particle Lines */}
          <div className="absolute inset-0 pointer-events-none opacity-50 overflow-hidden">
            <div className="absolute top-20 left-10 flex items-center gap-2 text-sky-700/40">
              <Wind className="w-6 h-6 animate-pulse" />
              <span className="text-[10px] uppercase font-bold tracking-widest">Natural Cross-Ventilation</span>
            </div>
          </div>
        </div>

        {/* 2.5D Architectural Weatherproof Deck Floor Plane */}
        <div 
          className="absolute inset-x-4 bottom-0 h-44 origin-bottom bg-gradient-to-b from-[#1b2f29] via-[#10231d] to-[#07130f] border-t-2 border-emerald-400/40 shadow-2xl"
          style={{
            transform: "rotateX(58deg)",
            transformStyle: "preserve-3d",
            backgroundImage: "linear-gradient(rgba(52, 211, 153, 0.22) 1px, transparent 1px), linear-gradient(90deg, rgba(52, 211, 153, 0.22) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-emerald-300/10" />
        </div>

        {/* 2.5D Balcony Railing & Plants Silhouettes */}
        <div className="absolute inset-x-8 bottom-12 h-44 flex flex-col justify-end pointer-events-none px-6">
          {/* Sit-out Bistro Chairs & Planters Layer */}
          <div className="flex justify-between items-end mb-1 px-4">
            {/* Potted Cascading Plants on Left */}
            <div className="flex flex-col items-center">
              <svg width="60" height="70" viewBox="0 0 60 70" className="opacity-90">
                <path d="M30 65 Q15 40 8 20 Q22 25 30 50" fill="#10b981" fillOpacity="0.5" stroke="#34d399" strokeWidth="1.5" />
                <path d="M30 65 Q45 35 52 15 Q38 20 30 45" fill="#059669" fillOpacity="0.5" stroke="#34d399" strokeWidth="1.5" />
                <path d="M30 65 Q25 30 30 8 Q35 30 30 50" fill="#047857" fillOpacity="0.6" stroke="#6ee7b7" strokeWidth="1.5" />
              </svg>
              <div className="w-12 h-9 rounded-b-lg bg-gradient-to-b from-stone-700 to-stone-900 border-t border-stone-500 shadow-md" />
            </div>

            {/* Balcony Sit-Out Bistro Table & Coffee Mug Silhouette */}
            <div className="flex items-end gap-3">
              {/* Chair 1 */}
              <div className="w-8 h-16 border-t-2 border-l-2 border-emerald-400/60 rounded-tl-md flex flex-col justify-end">
                <div className="w-8 h-1 bg-emerald-400/80" />
                <div className="w-1 h-8 bg-emerald-400/60" />
              </div>
              {/* Coffee Table */}
              <div className="flex flex-col items-center">
                <div className="w-14 h-2 rounded-full bg-emerald-300/80 border border-emerald-200 shadow-md" />
                <div className="w-1 h-10 bg-emerald-400/60" />
              </div>
              {/* Chair 2 */}
              <div className="w-8 h-16 border-t-2 border-r-2 border-emerald-400/60 rounded-tr-md flex flex-col justify-end items-end">
                <div className="w-8 h-1 bg-emerald-400/80" />
                <div className="w-1 h-8 bg-emerald-400/60" />
              </div>
            </div>

            {/* Potted Plant on Right */}
            <div className="flex flex-col items-center">
              <svg width="50" height="60" viewBox="0 0 50 60" className="opacity-90">
                <path d="M25 55 Q10 35 5 15 Q18 20 25 40" fill="#10b981" fillOpacity="0.5" stroke="#34d399" strokeWidth="1.5" />
                <path d="M25 55 Q40 30 45 12 Q32 18 25 38" fill="#059669" fillOpacity="0.5" stroke="#34d399" strokeWidth="1.5" />
              </svg>
              <div className="w-10 h-8 rounded-b-lg bg-gradient-to-b from-stone-700 to-stone-900 border-t border-stone-500 shadow-md" />
            </div>
          </div>

          {/* Tempered Glass Balcony Railing with Stainless Steel Handrail */}
          <div className="relative w-full h-16 rounded-t-md bg-gradient-to-b from-teal-400/25 via-emerald-400/10 to-transparent backdrop-blur-md border-t-4 border-slate-300/90 shadow-2xl flex items-center justify-between px-6">
            {/* Vertical Baluster Posts */}
            {[1, 2, 3, 4, 5, 6, 7].map((bIdx) => (
              <div key={bIdx} className="w-1 h-full bg-slate-400/60 shadow-sm" />
            ))}
          </div>
        </div>

        {/* Architectural Overlay Tag */}
        <div className="absolute top-4 left-6 px-3 py-1.5 rounded-xl bg-slate-900/85 backdrop-blur-md border border-emerald-500/40 flex items-center gap-2 shadow-lg">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider">
            2.5D Room Architecture • {roomName}
          </span>
          <span className="text-[10px] text-slate-400 border-l border-slate-700 pl-2">
            {dim}
          </span>
        </div>
      </div>
    </div>
  );
};
