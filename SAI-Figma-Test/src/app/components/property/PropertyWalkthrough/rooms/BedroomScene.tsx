import React from "react";
import { BedDouble, Sun, Sparkles } from "lucide-react";

interface BedroomSceneProps {
  roomName: string;
  bedroomNumber?: number;
  roomData?: Record<string, any>;
  dimensions?: string;
}

export const BedroomScene: React.FC<BedroomSceneProps> = ({
  roomName,
  bedroomNumber = 1,
  roomData,
  dimensions,
}) => {
  const isMaster = bedroomNumber === 1 || roomName.toLowerCase().includes("master");
  const dim = roomData?.dimensions || dimensions || (isMaster ? "14'0\" × 12'0\"" : "12'0\" × 11'0\"");
  const furnishing = roomData?.furnishing;

  return (
    <div className="relative w-full h-full overflow-hidden bg-gradient-to-b from-[#091522] via-[#0d2235] to-[#08111c] flex items-center justify-center select-none">
      {/* 2.5D Perspective Bedroom Container */}
      <div 
        className="relative w-full max-w-4xl h-full max-h-[520px] flex items-center justify-center"
        style={{ perspective: "1000px" }}
      >
        {/* Back Wall with Ambient Bedroom Glow */}
        <div className="absolute inset-x-8 top-8 bottom-28 bg-gradient-to-b from-[#13283c] to-[#0a1826] rounded-t-3xl border-t border-x border-teal-500/20 shadow-2xl overflow-hidden">
          {/* Subtle Textured Wall Pattern */}
          <div 
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage: "linear-gradient(#38bdf8 1px, transparent 1px), linear-gradient(90deg, #38bdf8 1px, transparent 1px)",
              backgroundSize: "36px 36px",
            }}
          />

          {/* Warm Sconce Lights on Headboard Wall */}
          <div className="absolute top-0 inset-x-0 h-12 bg-gradient-to-b from-amber-200/20 via-amber-200/5 to-transparent blur-md" />

          {/* Large Scenic Bedroom Window on Left */}
          <div className="absolute top-10 left-16 w-56 h-44 rounded-xl border-4 border-slate-700 bg-gradient-to-b from-sky-300 via-sky-100 to-amber-100 shadow-inner overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent pointer-events-none" />
            <div className="absolute bottom-4 inset-x-0 h-10 bg-gradient-to-t from-emerald-600/30 to-transparent" />
            <div className="absolute top-4 right-4 w-9 h-9 rounded-full bg-amber-200/90 blur-xs flex items-center justify-center">
              <Sun className="w-5 h-5 text-amber-500 animate-pulse" />
            </div>
            {/* Window Mullions */}
            <div className="absolute inset-y-0 left-1/2 w-1 bg-slate-700" />
            <div className="absolute inset-x-0 top-1/2 h-1 bg-slate-700" />
            {/* Curtain Drapery Silhouettes on Window Sides */}
            <div className="absolute top-0 left-0 bottom-0 w-6 bg-gradient-to-r from-teal-900/80 to-transparent" />
            <div className="absolute top-0 right-0 bottom-0 w-6 bg-gradient-to-l from-teal-900/80 to-transparent" />
          </div>

          {/* Modern Wardrobe Unit on Right Wall */}
          <div className="absolute top-8 right-14 w-44 h-52 rounded-t-lg border-2 border-slate-700 bg-gradient-to-b from-slate-800 to-slate-900 shadow-xl p-1 flex">
            {/* Wardrobe Door 1 */}
            <div className="flex-1 h-full border-r border-slate-700 p-1 flex flex-col justify-center items-end">
              <div className="w-1.5 h-16 rounded-full bg-amber-400/80 shadow-sm mr-1" />
              <span className="text-[8px] uppercase tracking-wider text-slate-500 font-mono rotate-90 mt-4">WARDROBE</span>
            </div>
            {/* Wardrobe Door 2 (Mirrored Panel) */}
            <div className="flex-1 h-full bg-gradient-to-tr from-slate-800 via-teal-900/40 to-slate-800 p-1 flex flex-col justify-center items-start">
              <div className="w-1.5 h-16 rounded-full bg-amber-400/80 shadow-sm ml-1" />
            </div>
          </div>

          {/* Wall Art Frame above Bed */}
          <div className="absolute top-12 left-1/2 -translate-x-1/2 w-48 h-20 rounded-lg border border-teal-400/30 bg-slate-900/70 shadow-lg flex items-center justify-center p-2 backdrop-blur-sm">
            <div className="text-center">
              <span className="text-[10px] font-bold tracking-widest text-teal-300 uppercase block">
                {isMaster ? "MASTER SANCTUARY" : `BEDROOM #${bedroomNumber}`}
              </span>
              <span className="text-[9px] text-slate-400 font-mono">{dim}</span>
            </div>
          </div>
        </div>

        {/* 2.5D Architectural Floor Plane */}
        <div 
          className="absolute inset-x-4 bottom-0 h-44 origin-bottom bg-gradient-to-b from-[#102436] via-[#152e45] to-[#0a1824] border-t-2 border-teal-400/40 shadow-2xl"
          style={{
            transform: "rotateX(58deg)",
            transformStyle: "preserve-3d",
            backgroundImage: "linear-gradient(rgba(56, 189, 248, 0.22) 1px, transparent 1px), linear-gradient(90deg, rgba(56, 189, 248, 0.22) 1px, transparent 1px)",
            backgroundSize: "46px 46px",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-teal-400/10" />
        </div>

        {/* 2.5D Bed and Nightstands Silhouettes */}
        <div className="absolute inset-x-8 bottom-10 h-48 flex items-end justify-center pointer-events-none">
          {/* Left Nightstand with Lamp */}
          <div className="relative mb-2 mr-3 flex flex-col items-center">
            {/* Table Lamp */}
            <div className="w-8 h-6 rounded-t-full bg-amber-300/80 shadow-[0_0_16px_rgba(251,191,36,0.6)] border border-amber-200" />
            <div className="w-1 h-8 bg-slate-600" />
            {/* Nightstand Box */}
            <div className="w-14 h-14 rounded-md border border-slate-700 bg-slate-800/90 shadow-lg p-1">
              <div className="w-full h-1 bg-amber-400/50 rounded-full mt-2" />
            </div>
          </div>

          {/* Central Plush King/Queen Bed */}
          <div className="relative flex flex-col items-center">
            {/* Tufted Headboard */}
            <div className="w-[300px] h-20 rounded-t-2xl bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 border-t-2 border-x-2 border-teal-400/30 shadow-2xl flex items-center justify-around px-4">
              {[1, 2, 3, 4].map((tIdx) => (
                <div key={tIdx} className="w-1 h-8 bg-slate-600/40 rounded-full" />
              ))}
            </div>

            {/* Pillows Array */}
            <div className="relative -mt-2 flex gap-3 z-10">
              <div className="w-24 h-9 rounded-xl bg-slate-200/90 border border-slate-300 shadow-md transform -rotate-3" />
              <div className="w-24 h-9 rounded-xl bg-slate-200/90 border border-slate-300 shadow-md transform rotate-3" />
            </div>

            {/* Mattress & Quilt / Duvet */}
            <div className="relative -mt-3 w-[330px] h-18 rounded-xl bg-gradient-to-b from-slate-750 via-slate-800 to-slate-950 border-2 border-teal-400/40 shadow-2xl p-2 flex flex-col justify-end">
              {/* Duvet Runner */}
              <div className="w-full h-8 rounded-lg bg-gradient-to-r from-teal-800/80 via-teal-700/80 to-teal-800/80 border border-teal-400/30 flex items-center justify-center">
                <div className="w-20 h-0.5 bg-teal-300/40 rounded-full" />
              </div>
            </div>
          </div>

          {/* Right Nightstand with Lamp */}
          <div className="relative mb-2 ml-3 flex flex-col items-center">
            <div className="w-8 h-6 rounded-t-full bg-amber-300/80 shadow-[0_0_16px_rgba(251,191,36,0.6)] border border-amber-200" />
            <div className="w-1 h-8 bg-slate-600" />
            <div className="w-14 h-14 rounded-md border border-slate-700 bg-slate-800/90 shadow-lg p-1">
              <div className="w-full h-1 bg-amber-400/50 rounded-full mt-2" />
            </div>
          </div>
        </div>

        {/* Architectural Overlay Tag */}
        <div className="absolute top-4 left-6 px-3 py-1.5 rounded-xl bg-slate-900/85 backdrop-blur-md border border-teal-500/40 flex items-center gap-2 shadow-lg">
          <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
          <span className="text-[11px] font-bold text-teal-200 uppercase tracking-wider">
            2.5D Room Architecture • {roomName}
          </span>
          <span className="text-[10px] text-slate-400 border-l border-slate-700 pl-2">
            {dim}
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
