import React from "react";
import { UtensilsCrossed, Sun } from "lucide-react";

interface KitchenSceneProps {
  roomData?: Record<string, any>;
  dimensions?: string;
}

export const KitchenScene: React.FC<KitchenSceneProps> = ({ roomData, dimensions }) => {
  const dim = roomData?.dimensions || dimensions || "10'6\" × 8'0\"";

  return (
    <div className="relative w-full h-full overflow-hidden bg-gradient-to-b from-[#091522] via-[#0d2235] to-[#08111c] flex items-center justify-center select-none">
      {/* 2.5D Perspective Kitchen Container */}
      <div 
        className="relative w-full max-w-4xl h-full max-h-[520px] flex items-center justify-center"
        style={{ perspective: "1000px" }}
      >
        {/* Back Wall with Subway Tile Grid Pattern */}
        <div className="absolute inset-x-8 top-8 bottom-28 bg-gradient-to-b from-[#12283a] to-[#0b1c2b] rounded-t-3xl border-t border-x border-teal-500/20 shadow-2xl overflow-hidden">
          {/* Subtle Tile Grid */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: "linear-gradient(#f97316 1px, transparent 1px), linear-gradient(90deg, #f97316 1px, transparent 1px)",
              backgroundSize: "28px 14px",
            }}
          />

          {/* Under-cabinet LED warm glow */}
          <div className="absolute top-28 inset-x-0 h-8 bg-gradient-to-b from-amber-300/25 to-transparent blur-md pointer-events-none" />

          {/* Upper Kitchen Cabinets Wall Array */}
          <div className="absolute top-6 inset-x-12 h-24 flex gap-2">
            {[1, 2, 3, 4, 5].map((idx) => (
              <div 
                key={idx}
                className="flex-1 h-full rounded-b-lg border-b-2 border-x border-slate-700 bg-gradient-to-b from-slate-800 to-slate-900 shadow-md relative p-2 flex flex-col justify-end"
              >
                {/* Cabinet Handle */}
                <div className="w-1.5 h-6 rounded-full bg-amber-400/80 self-end shadow-sm" />
                <div className="w-full h-0.5 bg-slate-700/50 mt-1" />
              </div>
            ))}
          </div>

          {/* Kitchen Window with Daylight above sink */}
          <div className="absolute top-32 right-16 w-52 h-36 rounded-lg border-2 border-slate-700 bg-gradient-to-b from-sky-200 via-sky-100 to-amber-50 shadow-inner overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/50 to-transparent pointer-events-none" />
            <div className="absolute bottom-2 inset-x-0 h-6 bg-gradient-to-t from-emerald-500/20 to-transparent" />
            <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-amber-200/90 blur-xs flex items-center justify-center">
              <Sun className="w-4 h-4 text-amber-500 animate-pulse" />
            </div>
            <div className="absolute inset-y-0 left-1/2 w-0.5 bg-slate-600" />
            <div className="absolute inset-x-0 top-1/2 h-0.5 bg-slate-600" />
          </div>

          {/* Kitchen Vent Hood / Chimney Silhouette */}
          <div className="absolute top-28 left-28 w-28 flex flex-col items-center">
            {/* Duct Flue */}
            <div className="w-12 h-8 bg-gradient-to-r from-slate-700 via-slate-600 to-slate-800 border-x border-slate-500 shadow-sm" />
            {/* Pyramid Canopy */}
            <div className="w-28 h-6 bg-gradient-to-b from-slate-600 to-slate-800 rounded-b-md border border-slate-500 shadow-lg flex items-center justify-center">
              <div className="w-16 h-1 bg-amber-300/80 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
            </div>
          </div>
        </div>

        {/* 2.5D Architectural Floor Plane */}
        <div 
          className="absolute inset-x-4 bottom-0 h-44 origin-bottom bg-gradient-to-b from-[#102436] via-[#152e45] to-[#0a1824] border-t-2 border-teal-400/40 shadow-2xl"
          style={{
            transform: "rotateX(58deg)",
            transformStyle: "preserve-3d",
            backgroundImage: "linear-gradient(rgba(249, 115, 22, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(249, 115, 22, 0.2) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-amber-300/10" />
        </div>

        {/* 2.5D Kitchen Counter, Sink & Refrigerator Silhouettes */}
        <div className="absolute inset-x-8 bottom-12 h-44 flex items-end justify-between px-10 pointer-events-none">
          {/* Refrigerator Silhouette on Left */}
          <div className="relative mb-1 flex flex-col items-center">
            <div className="w-24 h-48 rounded-t-xl bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 border-2 border-slate-600 shadow-2xl p-1.5 flex flex-col justify-between">
              {/* Top Freezer */}
              <div className="w-full h-16 rounded border border-slate-700 bg-slate-800/80 relative">
                <div className="absolute right-2 bottom-2 w-1.5 h-6 rounded-full bg-slate-500 shadow-sm" />
              </div>
              {/* Main Refrigerator Compartment */}
              <div className="w-full h-26 rounded border border-slate-700 bg-slate-800/80 relative">
                <div className="absolute right-2 top-2 w-1.5 h-10 rounded-full bg-slate-500 shadow-sm" />
              </div>
            </div>
          </div>

          {/* Main Kitchen Granite Countertop & Lower Cabinets */}
          <div className="relative flex-1 max-w-xl mx-4 flex flex-col items-center">
            {/* Polish Granite Countertop Slab */}
            <div className="w-full h-7 rounded-md bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 border-2 border-teal-400/40 shadow-xl flex items-center justify-around px-4">
              {/* Built-in Sink Silhouette with Arched Chrome Faucet */}
              <div className="relative w-24 h-5 rounded bg-slate-900 border border-slate-700 shadow-inner flex items-center justify-center">
                {/* Arched Faucet */}
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 w-4 h-7 border-t-2 border-r-2 border-teal-300 rounded-tr-full shadow-sm" />
                <div className="w-8 h-2 rounded bg-slate-800/90" />
              </div>

              {/* Cooktop Hob Silhouette */}
              <div className="w-28 h-5 rounded bg-slate-900/90 border border-slate-700 flex items-center justify-around px-2">
                <div className="w-3 h-3 rounded-full border border-orange-400/80 bg-orange-500/20" />
                <div className="w-3 h-3 rounded-full border border-orange-400/80 bg-orange-500/20" />
                <div className="w-3 h-3 rounded-full border border-orange-400/80 bg-orange-500/20" />
              </div>
            </div>

            {/* Lower Storage Cabinets & Drawers */}
            <div className="w-full h-24 bg-gradient-to-b from-slate-800 via-slate-850 to-slate-950 border-x-2 border-b-2 border-slate-700/80 shadow-2xl flex px-1 gap-1">
              {[1, 2, 3, 4].map((cIdx) => (
                <div key={cIdx} className="flex-1 h-full border-r border-slate-700 p-2 flex flex-col justify-start">
                  <div className="w-full h-1 bg-amber-400/60 rounded-full mb-3" />
                  <div className="flex-1 rounded border border-slate-700/60 bg-slate-900/50" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Architectural Overlay Tag */}
        <div className="absolute top-4 left-6 px-3 py-1.5 rounded-xl bg-slate-900/85 backdrop-blur-md border border-orange-500/40 flex items-center gap-2 shadow-lg">
          <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
          <span className="text-[11px] font-bold text-orange-200 uppercase tracking-wider">
            2.5D Room Architecture • Kitchen
          </span>
          <span className="text-[10px] text-slate-400 border-l border-slate-700 pl-2">
            {dim}
          </span>
        </div>
      </div>
    </div>
  );
};
