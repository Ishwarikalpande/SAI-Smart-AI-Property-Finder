import React from "react";
import { Sparkles, MapPin, Eye, ShieldCheck, Cpu } from "lucide-react";
import { Property3DRoom } from "./PropertyScene";

interface RoomLabelsProps {
  currentRoom?: Property3DRoom;
  currentStepLabel: string;
  stepIndex: number;
  totalSteps: number;
  city?: string;
  locality?: string;
  isVerifiedFloorplan?: boolean;
  hasActualPhoto?: boolean;
  onViewActualPhoto?: () => void;
}

export const RoomLabels: React.FC<RoomLabelsProps> = ({
  currentRoom,
  currentStepLabel,
  stepIndex,
  totalSteps,
  city = "Pune",
  locality = "City Center",
  isVerifiedFloorplan = false,
  hasActualPhoto = false,
  onViewActualPhoto
}) => {
  const roomName = currentStepLabel || currentRoom?.name || "Virtual Walkthrough";
  const subtitle = currentRoom?.subtitle || "Real-time 3D Architectural Walkthrough";

  return (
    <div className="absolute top-4 left-4 sm:left-6 z-20 pointer-events-none flex flex-col gap-2 max-w-sm sm:max-w-md select-none animate-in fade-in slide-in-from-top-2 duration-300">
      {/* 1. Verified vs AI Badge & City Location */}
      <div className="flex items-center gap-2 flex-wrap">
        {isVerifiedFloorplan ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-lg">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>PROPERTY 3D WALKTHROUGH</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/85 border border-teal-500/40 text-teal-300 text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-lg">
            <Cpu className="w-3.5 h-3.5 text-teal-400" />
            <span>AI 3D VISUALIZATION</span>
          </div>
        )}

        {/* Real City & Locality (No hardcoding) */}
        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 border border-white/10 text-white/80 text-[10px] font-medium backdrop-blur-md">
          <MapPin className="w-3 h-3 text-teal-300" />
          <span>
            {locality ? `${locality}, ` : ""}
            {city}
          </span>
        </div>
      </div>

      {/* 2. Main Room Title Card */}
      <div className="rounded-2xl bg-slate-900/85 border border-white/15 backdrop-blur-xl p-3.5 shadow-2xl">
        <div className="flex items-center justify-between gap-4 mb-1">
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase drop-shadow-md">
            {roomName}
          </h2>
          <span className="font-mono text-xs font-bold text-teal-300 bg-teal-500/15 px-2 py-0.5 rounded border border-teal-500/30">
            {String(stepIndex + 1).padStart(2, "0")} / {String(totalSteps).padStart(2, "0")}
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed font-medium">
          {subtitle}
        </p>

        {/* Optional View Actual Photo button if property photo exists for room */}
        {hasActualPhoto && onViewActualPhoto && (
          <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between">
            <button
              onClick={onViewActualPhoto}
              className="pointer-events-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 border border-teal-400/50 text-teal-200 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-md"
            >
              <Eye className="w-3.5 h-3.5 text-teal-300" />
              <span>View Actual Room Photo</span>
            </button>
            <span className="text-[10px] text-teal-400/80 font-mono">Verified Media</span>
          </div>
        )}
      </div>
    </div>
  );
};
