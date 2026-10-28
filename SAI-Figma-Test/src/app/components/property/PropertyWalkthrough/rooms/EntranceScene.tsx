import React from "react";
import { KeyRound, Sparkles } from "lucide-react";

interface EntranceSceneProps {
  roomData?: Record<string, any>;
}

export const EntranceScene: React.FC<EntranceSceneProps> = ({ roomData }) => {
  const title = roomData?.title || "Welcome Home";
  const subtitle = roomData?.subtitle || "Private entryway & foyer";

  return (
    <div className="relative w-full h-full overflow-hidden bg-gradient-to-b from-[#091522] via-[#0d2235] to-[#08111c] flex items-center justify-center select-none">
      {/* 2.5D Perspective Entrance / Foyer Container */}
      <div 
        className="relative w-full max-w-4xl h-full max-h-[520px] flex items-center justify-center"
        style={{ perspective: "1000px" }}
      >
        {/* Back Wall with Warm Welcoming Foyer Atmosphere */}
        <div className="absolute inset-x-8 top-8 bottom-28 bg-gradient-to-b from-[#14283c] to-[#0a1824] rounded-t-3xl border-t border-x border-teal-500/20 shadow-2xl overflow-hidden flex items-center justify-center">
          {/* Subtle Textured Wall Pattern */}
          <div 
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage: "linear-gradient(#f59e0b 1px, transparent 1px), linear-gradient(90deg, #f59e0b 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />

          {/* Warm Pendant Chandelier Light */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center">
            {/* Wire */}
            <div className="w-0.5 h-16 bg-amber-400/80" />
            {/* Geometric Modern Light Shade */}
            <div className="w-16 h-12 rounded-b-2xl bg-gradient-to-b from-amber-300 via-amber-400 to-amber-500 shadow-[0_0_36px_rgba(251,191,36,0.8)] border border-amber-200 flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-white blur-xs" />
            </div>
          </div>

          {/* Architectural Solid Hardwood Entrance Main Door Silhouette */}
          <div className="relative top-6 w-56 h-72 rounded-t-xl bg-gradient-to-b from-amber-950 via-stone-900 to-stone-950 border-4 border-amber-900/80 shadow-2xl p-2 flex flex-col justify-between">
            {/* Door Top Transom / Inlay Paneling */}
            <div className="w-full h-12 rounded-t-lg border border-amber-800/40 bg-gradient-to-b from-amber-900/30 to-transparent flex items-center justify-center">
              <span className="text-[10px] tracking-widest text-amber-400/80 font-mono font-bold">WELCOME</span>
            </div>

            {/* Recessed Door Panel Inlays */}
            <div className="flex-1 my-2 flex flex-col justify-around px-2">
              <div className="w-full h-12 rounded border border-amber-900/50 bg-stone-900/60" />
              <div className="w-full h-12 rounded border border-amber-900/50 bg-stone-900/60" />
            </div>

            {/* Sleek Modern Vertical Handle Bar with Digital Lock Silhouette */}
            <div className="absolute top-36 right-4 flex flex-col items-center">
              <div className="w-2 h-20 rounded-full bg-gradient-to-b from-amber-300 via-slate-200 to-amber-300 shadow-md border border-amber-200" />
              <div className="w-3 h-5 -mt-12 rounded-sm bg-slate-900 border border-teal-400/80 shadow-xs flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-teal-300 animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* 2.5D Architectural Foyer Floor Plane */}
        <div 
          className="absolute inset-x-4 bottom-0 h-44 origin-bottom bg-gradient-to-b from-[#102436] via-[#152e45] to-[#0a1824] border-t-2 border-teal-400/40 shadow-2xl"
          style={{
            transform: "rotateX(58deg)",
            transformStyle: "preserve-3d",
            backgroundImage: "linear-gradient(rgba(245, 158, 11, 0.22) 1px, transparent 1px), linear-gradient(90deg, rgba(245, 158, 11, 0.22) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        >
          {/* Welcome Runner Mat on Floor */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 w-48 h-24 rounded-lg bg-gradient-to-b from-amber-900/40 to-amber-950/80 border border-amber-500/40 flex items-center justify-center shadow-lg">
            <span className="text-[10px] tracking-widest text-amber-300 font-bold uppercase font-mono">SAI VERIFIED</span>
          </div>
        </div>

        {/* Key Console & Decorative Silhouette on Left */}
        <div className="absolute left-16 bottom-16 w-28 flex flex-col items-center pointer-events-none">
          <div className="w-full h-3 rounded-full bg-amber-400/60 border border-amber-300 shadow-md" />
          <div className="w-1 h-20 bg-slate-700" />
        </div>

        {/* Architectural Overlay Tag */}
        <div className="absolute top-4 left-6 px-3 py-1.5 rounded-xl bg-slate-900/85 backdrop-blur-md border border-amber-500/40 flex items-center gap-2 shadow-lg">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-[11px] font-bold text-amber-200 uppercase tracking-wider">
            2.5D Architecture • Entrance & Foyer
          </span>
        </div>
      </div>
    </div>
  );
};
