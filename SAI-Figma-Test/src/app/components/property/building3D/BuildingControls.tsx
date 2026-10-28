import React from "react";
import {
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sun,
  Moon,
  Sunset,
  Layers,
  Eye,
  Camera
} from "lucide-react";

export type CameraPreset = "front" | "back" | "left" | "right" | "top" | "reset";
export type LightingMode = "day" | "sunset" | "night";

interface BuildingControlsProps {
  onPresetChange: (preset: CameraPreset) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  lightingMode: LightingMode;
  onLightingChange: (mode: LightingMode) => void;
  explodedView: boolean;
  onToggleExplodedView: () => void;
  onResetView: () => void;
}

export const BuildingControls: React.FC<BuildingControlsProps> = ({
  onPresetChange,
  onZoomIn,
  onZoomOut,
  lightingMode,
  onLightingChange,
  explodedView,
  onToggleExplodedView,
  onResetView,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2 bg-slate-900/85 backdrop-blur-md border border-slate-700/60 p-2 rounded-2xl shadow-xl select-none text-xs">
      {/* Preset View Buttons */}
      <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
        <span className="text-[10px] font-bold text-slate-400 uppercase px-1.5 flex items-center gap-1">
          <Camera size={11} className="text-teal-400" /> View
        </span>
        <button
          onClick={() => onPresetChange("front")}
          className="px-2.5 py-1 font-bold text-slate-200 hover:text-white hover:bg-slate-800 rounded-lg transition-colors active:scale-95"
          title="Front Elevation"
        >
          FRONT
        </button>
        <button
          onClick={() => onPresetChange("back")}
          className="px-2.5 py-1 font-bold text-slate-200 hover:text-white hover:bg-slate-800 rounded-lg transition-colors active:scale-95"
          title="Back View"
        >
          BACK
        </button>
        <button
          onClick={() => onPresetChange("left")}
          className="px-2.5 py-1 font-bold text-slate-200 hover:text-white hover:bg-slate-800 rounded-lg transition-colors active:scale-95"
          title="Left Elevation"
        >
          LEFT
        </button>
        <button
          onClick={() => onPresetChange("right")}
          className="px-2.5 py-1 font-bold text-slate-200 hover:text-white hover:bg-slate-800 rounded-lg transition-colors active:scale-95"
          title="Right Elevation"
        >
          RIGHT
        </button>
        <button
          onClick={() => onPresetChange("top")}
          className="px-2.5 py-1 font-bold text-slate-200 hover:text-white hover:bg-slate-800 rounded-lg transition-colors active:scale-95"
          title="Top Down Floor Plan"
        >
          TOP
        </button>
        <button
          onClick={onResetView}
          className="px-2.5 py-1 font-bold text-teal-300 hover:text-teal-200 hover:bg-teal-950/60 rounded-lg transition-colors flex items-center gap-1 active:scale-95"
          title="Reset Camera"
        >
          <RotateCcw size={11} /> RESET
        </button>
      </div>

      {/* Zoom Controls */}
      <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
        <button
          onClick={onZoomIn}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors active:scale-95"
          title="Zoom In"
        >
          <ZoomIn size={14} />
        </button>
        <button
          onClick={onZoomOut}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors active:scale-95"
          title="Zoom Out"
        >
          <ZoomOut size={14} />
        </button>
      </div>

      {/* Lighting Toggle (Day, Sunset, Night) */}
      <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800">
        <button
          onClick={() => onLightingChange("day")}
          className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold active:scale-95 ${
            lightingMode === "day"
              ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30 font-black"
              : "text-slate-400 hover:text-white hover:bg-slate-800/60"
          }`}
          title="Bright Day Mode (Sun Lit Sky)"
        >
          <Sun size={13} className={lightingMode === "day" ? "text-slate-950" : "text-amber-400"} />
          <span>Day</span>
        </button>
        <button
          onClick={() => onLightingChange("sunset")}
          className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold active:scale-95 ${
            lightingMode === "sunset"
              ? "bg-orange-500 text-white shadow-md shadow-orange-500/30 font-black"
              : "text-slate-400 hover:text-white hover:bg-slate-800/60"
          }`}
          title="Sunset Dusk Mode (Golden Hour)"
        >
          <Sunset size={13} className={lightingMode === "sunset" ? "text-white" : "text-orange-400"} />
          <span>Sunset</span>
        </button>
        <button
          onClick={() => onLightingChange("night")}
          className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold active:scale-95 ${
            lightingMode === "night"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-black"
              : "text-slate-400 hover:text-white hover:bg-slate-800/60"
          }`}
          title="Blackish Night Mode (Moon & Stars Lit)"
        >
          <Moon size={13} className={lightingMode === "night" ? "text-indigo-100" : "text-indigo-400"} />
          <span>Night</span>
        </button>
      </div>

      {/* Exploded Floor Stacking View Toggle */}
      <button
        onClick={onToggleExplodedView}
        className={`px-2.5 py-1.5 rounded-xl border transition-colors flex items-center gap-1.5 font-bold ${
          explodedView
            ? "bg-teal-500/20 border-teal-500/50 text-teal-300"
            : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white"
        }`}
        title="Toggle Floor Stack Expansion"
      >
        <Layers size={13} />
        <span>{explodedView ? "Compact" : "Expand Floors"}</span>
      </button>
    </div>
  );
};
