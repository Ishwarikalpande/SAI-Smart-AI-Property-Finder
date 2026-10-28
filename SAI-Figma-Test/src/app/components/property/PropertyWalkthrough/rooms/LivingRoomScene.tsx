import React from "react";
import { Sparkles, Sun } from "lucide-react";

interface LivingRoomSceneProps {
  roomData?: Record<string, any>;
  dimensions?: string;
}

export const LivingRoomScene: React.FC<LivingRoomSceneProps> = ({ roomData, dimensions }) => {
  const dim = roomData?.dimensions || dimensions || "16'0\" × 12'6\"";
  const furnishing = roomData?.furnishing;

  return (
    <div className="relative w-full h-full overflow-hidden bg-gradient-to-b from-[#091522] via-[#0d2235] to-[#08111c] flex items-center justify-center select-none">
      {/* 2.5D Perspective Room Container */}
      <div 
        className="relative w-full max-w-4xl h-full max-h-[520px] flex items-center justify-center"
        style={{ perspective: "1000px" }}
      >
        {/* Back Wall with Ambient Glow */}
        <div className="absolute inset-x-8 top-8 bottom-28 bg-gradient-to-b from-[#132c42] to-[#0c1c2b] rounded-t-3xl border-t border-x border-teal-500/20 shadow-2xl overflow-hidden">
          {/* Subtle Wallpaper Grid Pattern */}
          <div 
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage: "linear-gradient(#2dd4bf 1px, transparent 1px), linear-gradient(90deg, #2dd4bf 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />

          {/* Accent Cove Lighting (Top Glow) */}
          <div className="absolute top-0 inset-x-0 h-10 bg-gradient-to-b from-amber-300/25 to-transparent blur-md" />

          {/* Large Picture Window with Scenic Outdoor Daylight Gradient */}
          <div className="absolute top-10 right-14 w-64 h-48 rounded-xl border-4 border-slate-700/80 bg-gradient-to-b from-sky-300 via-sky-100 to-amber-100 shadow-inner overflow-hidden">
            {/* Window Glass Glare */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent pointer-events-none" />
            {/* Subtle Horizon Line & Sunshine */}
            <div className="absolute bottom-6 inset-x-0 h-12 bg-gradient-to-t from-emerald-600/30 to-transparent" />
            <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-amber-200/80 blur-sm flex items-center justify-center">
              <Sun className="w-6 h-6 text-amber-500/70 animate-pulse" />
            </div>
            {/* Window Panes (Mullions) */}
            <div className="absolute inset-y-0 left-1/2 w-1 bg-slate-700/80" />
            <div className="absolute inset-x-0 top-1/2 h-1 bg-slate-700/80" />
            {/* Window Sill */}
            <div className="absolute bottom-0 inset-x-0 h-3 bg-slate-800" />
          </div>

          {/* Wall Art / Architectural Frame on Left Wall */}
          <div className="absolute top-14 left-16 w-36 h-28 rounded-lg border-2 border-amber-400/40 bg-slate-900/60 p-2 shadow-lg backdrop-blur-sm">
            <div className="w-full h-full rounded border border-teal-500/30 bg-gradient-to-br from-teal-900/50 to-slate-950 flex flex-col items-center justify-center text-center p-1">
              <div className="w-6 h-6 rounded-full bg-teal-400/20 flex items-center justify-center mb-1">
                <Sparkles className="w-3.5 h-3.5 text-teal-300" />
              </div>
              <span className="text-[9px] uppercase tracking-widest text-teal-300 font-bold">LIVING AREA</span>
              <span className="text-[8px] text-slate-400 font-mono mt-0.5">{dim}</span>
            </div>
          </div>

          {/* Wall Recessed Spotlights */}
          <div className="absolute top-0 left-28 w-20 h-28 bg-gradient-to-b from-amber-200/20 via-amber-200/5 to-transparent blur-sm pointer-events-none transform -skew-x-6" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-40 bg-gradient-to-b from-amber-200/25 via-amber-200/5 to-transparent blur-md pointer-events-none" />
        </div>

        {/* 2.5D Architectural Floor Plane */}
        <div 
          className="absolute inset-x-4 bottom-0 h-44 origin-bottom bg-gradient-to-b from-[#102436] via-[#152e45] to-[#0a1824] border-t-2 border-teal-400/40 shadow-2xl"
          style={{
            transform: "rotateX(58deg)",
            transformStyle: "preserve-3d",
            backgroundImage: "linear-gradient(rgba(45, 212, 191, 0.22) 1px, transparent 1px), linear-gradient(90deg, rgba(45, 212, 191, 0.22) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        >
          {/* Floor Reflection Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-amber-300/10" />
        </div>

        {/* 2.5D Living Room Furniture Silhouettes (Depth Layer) */}
        <div className="absolute inset-x-8 bottom-12 h-44 flex items-end justify-between px-10 pointer-events-none">
          {/* Indoor Plant Silhouette on Left */}
          <div className="relative mb-2 flex flex-col items-center">
            {/* Leaves SVG */}
            <svg width="64" height="96" viewBox="0 0 64 96" className="drop-shadow-lg opacity-85">
              <path d="M32 90 Q20 60 12 36 Q18 30 32 60" fill="#14b8a6" fillOpacity="0.4" stroke="#2dd4bf" strokeWidth="1.5" />
              <path d="M32 90 Q44 55 54 32 Q46 26 32 55" fill="#0d9488" fillOpacity="0.4" stroke="#2dd4bf" strokeWidth="1.5" />
              <path d="M32 90 Q32 40 32 10 Q38 20 32 50" fill="#0f766e" fillOpacity="0.5" stroke="#5eead4" strokeWidth="1.5" />
              <path d="M32 90 Q10 70 4 50 Q16 48 30 72" fill="#115e59" fillOpacity="0.4" stroke="#2dd4bf" strokeWidth="1.5" />
            </svg>
            {/* Ceramic Planter Pot */}
            <div className="w-10 h-10 rounded-b-xl border-t border-slate-600 bg-gradient-to-b from-slate-700 to-slate-900 shadow-md" />
          </div>

          {/* Central Modern Lounge Sectional Sofa Silhouette */}
          <div className="relative flex flex-col items-center">
            {/* Sofa Backrest */}
            <div className="flex gap-1.5 mb-[-4px]">
              <div className="w-28 h-16 rounded-t-xl bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 border-t border-x border-teal-400/30 shadow-lg" />
              <div className="w-28 h-16 rounded-t-xl bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 border-t border-x border-teal-400/30 shadow-lg" />
              <div className="w-28 h-16 rounded-t-xl bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 border-t border-x border-teal-400/30 shadow-lg" />
            </div>

            {/* Sofa Cushions & Seat Base */}
            <div className="relative w-[360px] h-14 rounded-xl bg-gradient-to-b from-slate-800 via-slate-850 to-slate-950 border-2 border-teal-500/30 shadow-2xl flex items-center justify-around px-3">
              <div className="flex-1 h-10 mx-1 rounded-lg bg-slate-800/80 border border-slate-700/60 shadow-inner" />
              <div className="flex-1 h-10 mx-1 rounded-lg bg-slate-800/80 border border-slate-700/60 shadow-inner" />
              <div className="flex-1 h-10 mx-1 rounded-lg bg-slate-800/80 border border-slate-700/60 shadow-inner" />
            </div>

            {/* Coffee Table with Glass Top & Chrome Legs */}
            <div className="relative -mt-3 flex flex-col items-center">
              <div className="w-48 h-6 rounded-lg bg-teal-400/20 backdrop-blur-md border border-teal-300/40 shadow-xl flex items-center justify-center">
                <div className="w-12 h-1 bg-amber-400/60 rounded-full" />
              </div>
              <div className="flex justify-between w-40 px-2 h-4">
                <div className="w-1 bg-teal-400/60 h-full" />
                <div className="w-1 bg-teal-400/60 h-full" />
              </div>
            </div>
          </div>

          {/* Modern Architectural Floor Lamp on Right */}
          <div className="relative mb-1 flex flex-col items-center">
            {/* Glowing Lamp Shade */}
            <div className="w-12 h-10 rounded-t-full bg-gradient-to-b from-amber-200 to-amber-400/80 shadow-[0_0_24px_rgba(251,191,36,0.6)] border border-amber-300 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-white blur-[1px]" />
            </div>
            {/* Lamp Stem */}
            <div className="w-1 h-32 bg-gradient-to-b from-amber-300 via-slate-600 to-slate-800" />
            {/* Lamp Base */}
            <div className="w-10 h-2 rounded-full bg-slate-900 border border-slate-700 shadow-md" />
          </div>
        </div>

        {/* Architectural Overlay Tag */}
        <div className="absolute top-4 left-6 px-3 py-1.5 rounded-xl bg-slate-900/85 backdrop-blur-md border border-teal-500/40 flex items-center gap-2 shadow-lg">
          <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
          <span className="text-[11px] font-bold text-teal-200 uppercase tracking-wider">
            2.5D Room Architecture • Living Room
          </span>
          {furnishing && (
            <span className="text-[10px] text-slate-400 border-l border-slate-700 pl-2">
              {furnishing}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
