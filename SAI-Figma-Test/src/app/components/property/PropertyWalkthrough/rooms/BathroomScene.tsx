import React from "react";
import { Bath, Sparkles } from "lucide-react";

interface BathroomSceneProps {
  roomName: string;
  bathroomNumber?: number;
  roomData?: Record<string, any>;
  dimensions?: string;
}

export const BathroomScene: React.FC<BathroomSceneProps> = ({
  roomName,
  bathroomNumber = 1,
  roomData,
  dimensions,
}) => {
  const dim = roomData?.dimensions || dimensions || "8'0\" × 5'6\"";

  return (
    <div className="relative w-full h-full overflow-hidden bg-gradient-to-b from-[#091522] via-[#0d2235] to-[#08111c] flex items-center justify-center select-none">
      {/* 2.5D Perspective Bathroom Container */}
      <div 
        className="relative w-full max-w-4xl h-full max-h-[520px] flex items-center justify-center"
        style={{ perspective: "1000px" }}
      >
        {/* Back Wall with Luxury Marble/Ceramic Tile Grid Pattern */}
        <div className="absolute inset-x-8 top-8 bottom-28 bg-gradient-to-b from-[#112433] to-[#0a1824] rounded-t-3xl border-t border-x border-teal-500/20 shadow-2xl overflow-hidden">
          {/* Tile Grid */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: "linear-gradient(#06b6d4 1px, transparent 1px), linear-gradient(90deg, #06b6d4 1px, transparent 1px)",
              backgroundSize: "36px 36px",
            }}
          />

          {/* Vanity Backlit Mirror with Soft Halo Glow */}
          <div className="absolute top-12 left-28 w-40 h-40 rounded-full bg-gradient-to-tr from-cyan-400/20 via-teal-200/30 to-white/40 shadow-[0_0_36px_rgba(6,182,212,0.45)] border-2 border-cyan-300/60 p-2 flex items-center justify-center backdrop-blur-md">
            {/* Mirror Reflection Glare */}
            <div className="w-full h-full rounded-full border border-white/40 bg-gradient-to-tr from-transparent via-white/20 to-transparent flex flex-col items-center justify-center">
              <Sparkles className="w-5 h-5 text-cyan-200/80 mb-1" />
              <span className="text-[9px] uppercase tracking-widest text-cyan-200 font-bold">
                {roomName.toUpperCase()}
              </span>
              <span className="text-[8px] text-cyan-300/70 font-mono mt-0.5">{dim}</span>
            </div>
          </div>

          {/* Frosted Glass Shower Partition on Right */}
          <div className="absolute top-10 right-14 w-60 bottom-0 border-l-2 border-cyan-400/40 bg-gradient-to-r from-cyan-500/10 to-teal-500/15 backdrop-blur-sm p-4 flex flex-col justify-start items-center">
            {/* Shower Fixture / Rain Shower Head */}
            <div className="relative mt-2 flex flex-col items-center">
              {/* Wall Arm */}
              <div className="w-16 h-2 bg-gradient-to-r from-cyan-300 to-slate-400 rounded-full" />
              {/* Rain Head Disc */}
              <div className="w-12 h-3 -mt-1 rounded-full bg-gradient-to-r from-slate-300 via-cyan-200 to-slate-400 shadow-md border border-cyan-300" />
              {/* Subtle Rain Droplets Animation (SVG) */}
              <svg width="40" height="70" viewBox="0 0 40 70" className="mt-1 opacity-60">
                <line x1="10" y1="5" x2="10" y2="18" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="2 3" />
                <line x1="20" y1="2" x2="20" y2="24" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 4" />
                <line x1="30" y1="8" x2="30" y2="20" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="2 3" />
                <line x1="15" y1="30" x2="15" y2="45" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" />
                <line x1="25" y1="28" x2="25" y2="50" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 4" />
              </svg>
            </div>

            {/* Towel Bar with Folded Towel */}
            <div className="absolute bottom-6 right-6 w-24 flex flex-col items-center">
              <div className="w-full h-1.5 rounded-full bg-cyan-300/80 shadow-sm" />
              <div className="w-16 h-10 -mt-1 rounded-b-md bg-teal-900/80 border border-teal-500/40 shadow-md" />
            </div>
          </div>
        </div>

        {/* 2.5D Architectural Floor Plane */}
        <div 
          className="absolute inset-x-4 bottom-0 h-44 origin-bottom bg-gradient-to-b from-[#102436] via-[#152e45] to-[#0a1824] border-t-2 border-teal-400/40 shadow-2xl"
          style={{
            transform: "rotateX(58deg)",
            transformStyle: "preserve-3d",
            backgroundImage: "linear-gradient(rgba(6, 182, 212, 0.22) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.22) 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-cyan-400/10" />
        </div>

        {/* 2.5D Floating Vanity & Sink Silhouette */}
        <div className="absolute inset-x-8 bottom-12 h-36 flex items-end justify-between px-16 pointer-events-none">
          {/* Floating Modern Vanity Counter */}
          <div className="relative w-64 flex flex-col items-center">
            {/* Chrome Faucet */}
            <div className="relative -mb-1 flex flex-col items-center">
              <div className="w-3 h-8 border-t-2 border-r-2 border-cyan-200 rounded-tr-full" />
              <div className="w-5 h-1.5 rounded-full bg-slate-300" />
            </div>

            {/* Vessel Ceramic Sink Top */}
            <div className="w-48 h-6 rounded-b-xl bg-gradient-to-b from-slate-200 via-white to-slate-300 border-2 border-slate-300 shadow-xl flex items-center justify-center">
              <div className="w-24 h-1.5 rounded-full bg-slate-400/40" />
            </div>

            {/* Wall-Hung Wooden Vanity Cabinet */}
            <div className="w-56 h-18 mt-1 rounded-lg bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-cyan-500/30 shadow-2xl p-2 flex justify-between items-center px-4">
              <div className="w-16 h-1 rounded-full bg-amber-400/60 shadow-sm" />
              <div className="w-16 h-1 rounded-full bg-amber-400/60 shadow-sm" />
            </div>
          </div>
        </div>

        {/* Architectural Overlay Tag */}
        <div className="absolute top-4 left-6 px-3 py-1.5 rounded-xl bg-slate-900/85 backdrop-blur-md border border-cyan-500/40 flex items-center gap-2 shadow-lg">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-[11px] font-bold text-cyan-200 uppercase tracking-wider">
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
