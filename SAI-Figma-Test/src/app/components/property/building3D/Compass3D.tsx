import React from "react";
import { Compass, Navigation } from "lucide-react";

interface Compass3DProps {
  buildingOrientation: number; // degrees
  unitDirection?: string;
  unitAngle?: number;
  entranceDirection?: string;
  balconyDirection?: string;
}

export const Compass3D: React.FC<Compass3DProps> = ({
  buildingOrientation,
  unitDirection,
  unitAngle = 90,
  entranceDirection,
  balconyDirection,
}) => {
  return (
    <div className="bg-slate-900/85 backdrop-blur-md border border-slate-700/60 rounded-2xl p-3 text-white shadow-xl flex flex-col items-center select-none w-48">
      <div className="flex items-center gap-1.5 text-xs font-bold text-teal-300 uppercase tracking-wider mb-2">
        <Compass size={14} className="text-teal-400 animate-spin-slow" />
        <span>3D Compass</span>
      </div>

      {/* Compass Dial */}
      <div className="relative w-28 h-28 rounded-full border-2 border-slate-700 bg-slate-950/70 flex items-center justify-center my-1 shadow-inner">
        {/* Cardinal Directions */}
        <span className="absolute top-1 text-[11px] font-black text-rose-400">N</span>
        <span className="absolute bottom-1 text-[11px] font-bold text-slate-400">S</span>
        <span className="absolute right-2 text-[11px] font-bold text-slate-400">E</span>
        <span className="absolute left-2 text-[11px] font-bold text-slate-400">W</span>

        {/* Degree ticks */}
        <div className="absolute inset-2 border border-dashed border-slate-800 rounded-full" />

        {/* Needle pointing North */}
        <div
          className="absolute w-1 h-14 bg-gradient-to-t from-transparent via-rose-500 to-rose-400 rounded-full origin-bottom transition-transform duration-500 ease-out"
          style={{ transform: `rotate(${buildingOrientation}deg) translateY(-50%)` }}
        />

        {/* Unit Direction Indicator Pointer */}
        {unitAngle !== undefined && (
          <div
            className="absolute w-1.5 h-12 bg-gradient-to-t from-transparent via-teal-400 to-emerald-300 rounded-full origin-bottom transition-transform duration-500 ease-out"
            style={{ transform: `rotate(${unitAngle}deg) translateY(-50%)` }}
          />
        )}

        {/* Center pin */}
        <div className="w-3.5 h-3.5 rounded-full bg-teal-400 border-2 border-slate-950 shadow z-10 flex items-center justify-center">
          <div className="w-1 h-1 rounded-full bg-white" />
        </div>
      </div>

      {/* Unit Directions Legend */}
      <div className="w-full mt-2 pt-2 border-t border-slate-800/80 text-[11px] space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-slate-400">Unit Facing:</span>
          <span className="font-bold text-teal-300">{unitDirection || "East"}</span>
        </div>
        {balconyDirection && (
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Balcony:</span>
            <span className="font-semibold text-emerald-400">{balconyDirection}</span>
          </div>
        )}
        {entranceDirection && (
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Entrance:</span>
            <span className="font-semibold text-slate-300">{entranceDirection}</span>
          </div>
        )}
      </div>
    </div>
  );
};
