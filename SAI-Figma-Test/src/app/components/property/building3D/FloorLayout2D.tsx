import React, { useState } from "react";
import { Unit3DItem } from "../../../../api/building3D";
import {
  Compass,
  CheckCircle,
  Eye,
  Layers,
  ArrowRight,
  Maximize2,
  FileText
} from "lucide-react";

interface FloorLayout2DProps {
  floorNumber: number;
  units: Unit3DItem[];
  selectedUnitId?: number;
  onSelectUnit: (unit: Unit3DItem) => void;
  onStartTour: (unit: Unit3DItem) => void;
}

export const FloorLayout2D: React.FC<FloorLayout2DProps> = ({
  floorNumber,
  units = [],
  selectedUnitId,
  onSelectUnit,
  onStartTour,
}) => {
  const [viewMode, setViewMode] = useState<"corridor" | "architectural">("corridor");
  const safeUnits = Array.isArray(units) ? units : [];

  // Separate units into North row and South row (or by position_z)
  const northUnits = safeUnits.filter((u) => (u.position?.z ?? 0) < 0 || ["A", "B", "C", "D", "1", "2", "3"].includes(u.unit_number));
  const southUnits = safeUnits.filter((u) => !northUnits.includes(u));

  const selectedUnit = safeUnits.find((u) => u.id === selectedUnitId);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Available</span>;
      case "reserved":
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">Reserved</span>;
      case "booked":
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">Booked</span>;
      case "sold":
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-400 border border-slate-500/30">Sold</span>;
      case "blocked":
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-500 border border-slate-700">Blocked</span>;
      default:
        return null;
    }
  };

  return (
    <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/60 rounded-3xl p-5 text-white shadow-2xl">
      {/* Header with Mode Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 mb-4 border-b border-slate-800 gap-2">
        <div>
          <h3 className="font-black text-base text-slate-100 flex items-center gap-2">
            <span>Floor {floorNumber} Layout & Units</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-950 text-teal-400 border border-teal-800">
              {safeUnits.length} Units Configured
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Click on any flat to highlight in 3D, inspect orientation, or launch interior virtual walkthrough.
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
          <button
            onClick={() => setViewMode("corridor")}
            className={`px-3 py-1 rounded-lg transition-colors ${
              viewMode === "corridor" ? "bg-teal-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Floor Units
          </button>
          <button
            onClick={() => setViewMode("architectural")}
            className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-1 ${
              viewMode === "architectural" ? "bg-teal-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            <FileText size={12} /> 2D Blueprint
          </button>
        </div>
      </div>

      {viewMode === "corridor" ? (
        <div className="space-y-4">
          {/* Corridor Architectural Diagram */}
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 relative overflow-hidden">
            {/* North Row */}
            <div className="mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 flex items-center gap-1">
                <Compass size={11} className="text-rose-400" /> North Wing / Facing
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {northUnits.map((u) => {
                  const isSelected = u.id === selectedUnitId;
                  return (
                    <button
                      key={u.id}
                      onClick={() => onSelectUnit(u)}
                      className={`p-3 rounded-xl border text-left transition-all relative ${
                        isSelected
                          ? "bg-teal-950/70 border-teal-400 shadow-lg shadow-teal-500/20 scale-102"
                          : "bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-850"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-black text-sm text-white">{u.unit_label || `${floorNumber}-${u.unit_number}`}</span>
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: u.status_color }}
                          title={`Status: ${u.status}`}
                        />
                      </div>
                      <div className="text-[11px] text-slate-400 space-y-0.5">
                        <p className="font-semibold text-slate-300">{u.bhk} BHK · {u.area_sqft} sq.ft</p>
                        <p className="text-teal-400 font-bold">{u.price_display}</p>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Compass size={10} /> {u.direction} Facing
                        </p>
                      </div>
                      <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between">
                        {getStatusBadge(u.status)}
                        {isSelected && <span className="text-[10px] font-bold text-teal-300">SELECTED</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Central Corridor Walkway Strip */}
            <div className="my-3 py-2 bg-slate-900/90 rounded-xl border border-dashed border-slate-700 flex items-center justify-between px-4 text-xs font-black tracking-widest text-slate-400 uppercase">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                CENTRAL LIFT LOBBY & STAIRCASE
              </span>
              <span>↔ CORRIDOR WALKWAY ↔</span>
              <span>EXIT / FIRE ESCAPE</span>
            </div>

            {/* South Row */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 flex items-center gap-1">
                <Compass size={11} className="text-teal-400" /> South Wing / Facing
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {southUnits.map((u) => {
                  const isSelected = u.id === selectedUnitId;
                  return (
                    <button
                      key={u.id}
                      onClick={() => onSelectUnit(u)}
                      className={`p-3 rounded-xl border text-left transition-all relative ${
                        isSelected
                          ? "bg-teal-950/70 border-teal-400 shadow-lg shadow-teal-500/20 scale-102"
                          : "bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-850"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-black text-sm text-white">{u.unit_label || `${floorNumber}-${u.unit_number}`}</span>
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: u.status_color }}
                          title={`Status: ${u.status}`}
                        />
                      </div>
                      <div className="text-[11px] text-slate-400 space-y-0.5">
                        <p className="font-semibold text-slate-300">{u.bhk} BHK · {u.area_sqft} sq.ft</p>
                        <p className="text-teal-400 font-bold">{u.price_display}</p>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Compass size={10} /> {u.direction} Facing
                        </p>
                      </div>
                      <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between">
                        {getStatusBadge(u.status)}
                        {isSelected && <span className="text-[10px] font-bold text-teal-300">SELECTED</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Detailed 2D Blueprint Architectural Plan */
        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col items-center">
          <div className="w-full max-w-2xl bg-[#0F1E2E] border-2 border-teal-500/40 rounded-xl p-6 font-mono text-xs text-teal-300 relative shadow-2xl">
            {/* Architectural Blueprint Graphics */}
            <div className="absolute top-2 right-3 text-[10px] font-bold tracking-widest text-teal-400/80">
              ARCHITECTURAL SPECIFICATION · TOWER A · LEVEL {floorNumber}
            </div>
            <div className="border border-teal-500/20 p-4 rounded-lg">
              <div className="text-center font-bold text-sm tracking-wider mb-4 text-white">
                STANDARD HIGH-RISE CORRIDOR CLUSTER PLAN
              </div>

              <div className="grid grid-cols-4 gap-2 mb-3">
                {northUnits.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => onSelectUnit(u)}
                    className={`border border-teal-400/40 p-2.5 rounded text-center cursor-pointer transition-colors ${
                      u.id === selectedUnitId ? "bg-teal-600/30 border-teal-300" : "hover:bg-teal-900/20"
                    }`}
                  >
                    <span className="font-bold block text-white">{u.unit_number}</span>
                    <span className="text-[10px] text-teal-200">{u.bhk} BHK</span>
                    <span className="text-[9px] text-slate-400 block">{u.area_sqft} sqft</span>
                  </div>
                ))}
              </div>

              <div className="bg-teal-950/50 border border-teal-500/30 py-2.5 text-center text-[11px] font-bold tracking-widest text-teal-300 mb-3 rounded">
                ══ CENTRAL VENTILATED CORRIDOR ══
              </div>

              <div className="grid grid-cols-4 gap-2">
                {southUnits.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => onSelectUnit(u)}
                    className={`border border-teal-400/40 p-2.5 rounded text-center cursor-pointer transition-colors ${
                      u.id === selectedUnitId ? "bg-teal-600/30 border-teal-300" : "hover:bg-teal-900/20"
                    }`}
                  >
                    <span className="font-bold block text-white">{u.unit_number}</span>
                    <span className="text-[10px] text-teal-200">{u.bhk} BHK</span>
                    <span className="text-[9px] text-slate-400 block">{u.area_sqft} sqft</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-teal-500/20 flex items-center justify-between text-[11px]">
              <span>Dimensions: Standard 36m x 24m structural footprint</span>
              <span>Floor Height: 3.2m Clear Slab</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
