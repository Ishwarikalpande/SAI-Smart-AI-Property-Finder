import React from "react";
import { Sparkles, KeyRound } from "lucide-react";

interface DoorTransitionProps {
  isOpen: boolean;
  targetRoomName: string;
  onTransitionComplete?: () => void;
}

export const DoorTransition: React.FC<DoorTransitionProps> = ({
  isOpen,
  targetRoomName,
  onTransitionComplete,
}) => {
  return (
    <div
      className={`absolute inset-0 z-40 bg-slate-950 flex flex-col items-center justify-center overflow-hidden transition-all duration-1000 ${
        isOpen ? "opacity-0 pointer-events-none scale-125" : "opacity-100"
      }`}
      style={{ perspective: "1200px" }}
    >
      {/* Background Room Light Spill (Glow through opening doors) */}
      <div
        className={`absolute inset-0 bg-gradient-to-b from-teal-500/30 via-amber-200/40 to-teal-900/40 blur-2xl transition-opacity duration-1000 ${
          isOpen ? "opacity-100 scale-150" : "opacity-20"
        }`}
      />

      {/* Door Frame & Header Architrave */}
      <div className="relative w-80 sm:w-96 h-[460px] border-4 border-slate-700 bg-slate-900/90 rounded-t-2xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col justify-between p-2">
        {/* Top Transom */}
        <div className="w-full h-12 rounded-t-xl bg-gradient-to-b from-amber-950/60 to-slate-900 border-b border-amber-500/30 flex items-center justify-center">
          <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold tracking-widest text-amber-300 uppercase">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>SAI MAIN ENTRANCE PORTAL</span>
          </div>
        </div>

        {/* 3D Double Doors with Perspective Swing */}
        <div className="relative flex-1 w-full flex overflow-hidden" style={{ perspective: "1000px" }}>
          {/* Left Door Leaf */}
          <div
            className="flex-1 h-full bg-gradient-to-r from-amber-950 via-stone-900 to-stone-950 border-r-2 border-amber-900/80 p-3 shadow-2xl origin-left transition-transform duration-1000 ease-in-out flex flex-col justify-between"
            style={{
              transform: isOpen ? "rotateY(-85deg)" : "rotateY(0deg)",
              transformStyle: "preserve-3d",
            }}
          >
            {/* Recessed Inlays */}
            <div className="w-full h-24 rounded border border-amber-900/40 bg-stone-900/70" />
            <div className="w-full h-24 rounded border border-amber-900/40 bg-stone-900/70" />
            {/* Left Vertical Bar Handle */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-20 rounded-full bg-gradient-to-b from-amber-300 via-slate-200 to-amber-400 border border-amber-200 shadow-md" />
          </div>

          {/* Right Door Leaf */}
          <div
            className="flex-1 h-full bg-gradient-to-l from-amber-950 via-stone-900 to-stone-950 border-l-2 border-amber-900/80 p-3 shadow-2xl origin-right transition-transform duration-1000 ease-in-out flex flex-col justify-between"
            style={{
              transform: isOpen ? "rotateY(85deg)" : "rotateY(0deg)",
              transformStyle: "preserve-3d",
            }}
          >
            {/* Recessed Inlays */}
            <div className="w-full h-24 rounded border border-amber-900/40 bg-stone-900/70" />
            <div className="w-full h-24 rounded border border-amber-900/40 bg-stone-900/70" />
            {/* Right Vertical Bar Handle with Digital Lock */}
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center">
              <div className="w-2 h-20 rounded-full bg-gradient-to-b from-amber-300 via-slate-200 to-amber-400 border border-amber-200 shadow-md" />
              <div className="w-3.5 h-6 -ml-3 rounded-sm bg-slate-950 border border-teal-400/80 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-teal-300 animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Door Sill / Threshold */}
        <div className="w-full h-4 bg-gradient-to-r from-slate-700 via-amber-300/40 to-slate-700 border-t border-slate-600 rounded-b-md" />
      </div>

      {/* Cinematic Transition Caption */}
      <div className="relative mt-6 text-center z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/20 border border-teal-400/40 text-teal-300 text-xs font-bold uppercase tracking-widest backdrop-blur-md mb-2">
          <KeyRound className="w-3.5 h-3.5 text-teal-300 animate-bounce" />
          <span>{isOpen ? "Entering Residence" : "Approaching Main Door"}</span>
        </div>
        <h3 className="text-xl sm:text-2xl font-black text-white tracking-wide drop-shadow-md">
          {isOpen ? `Entering ${targetRoomName}...` : "Opening Main Entrance..."}
        </h3>
      </div>
    </div>
  );
};
