import React from "react";
import { ChevronUp, ChevronDown, Layers, Building2, CheckCircle2 } from "lucide-react";
import { Floor3DItem } from "../../../../api/building3D";

interface FloorSelectorProps {
  buildingName: string;
  floors: Floor3DItem[];
  selectedFloorNumber: number;
  onSelectFloor: (floorNumber: number) => void;
  selectedUnitLabel?: string;
}

export const FloorSelector: React.FC<FloorSelectorProps> = ({
  buildingName,
  floors = [],
  selectedFloorNumber,
  onSelectFloor,
  selectedUnitLabel,
}) => {
  const safeFloors = Array.isArray(floors) ? floors : [];
  const currentFloor = safeFloors.find((f) => f.floor_number === selectedFloorNumber) || safeFloors[0];
  const maxFloor = safeFloors.length > 0 ? Math.max(...safeFloors.map((f) => f.floor_number)) : 20;
  const minFloor = safeFloors.length > 0 ? Math.min(...safeFloors.map((f) => f.floor_number)) : 1;

  const handleStepUp = () => {
    if (selectedFloorNumber < maxFloor) {
      onSelectFloor(selectedFloorNumber + 1);
    }
  };

  const handleStepDown = () => {
    if (selectedFloorNumber > minFloor) {
      onSelectFloor(selectedFloorNumber - 1);
    }
  };

  return (
    <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/60 rounded-2xl p-4 text-white shadow-2xl select-none w-72">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Building2 size={16} className="text-teal-400" />
          <span className="font-black text-sm tracking-wide text-slate-100 uppercase">{buildingName}</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full">
          <CheckCircle2 size={11} />
          <span>{currentFloor?.available_units ?? 0} Available</span>
        </div>
      </div>

      {/* Main Floor Stepper */}
      <div className="flex items-center justify-between gap-3 bg-slate-950/70 p-3 rounded-xl border border-slate-800 mb-3">
        <div className="flex-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
            Active Floor
          </label>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-teal-300">
              {selectedFloorNumber}
            </span>
            <span className="text-xs text-slate-400 font-semibold truncate">
              {currentFloor?.floor_label || `Floor ${selectedFloorNumber}`}
            </span>
          </div>
        </div>

        {/* Up / Down Controls */}
        <div className="flex flex-col gap-1">
          <button
            onClick={handleStepUp}
            disabled={selectedFloorNumber >= maxFloor}
            className="p-1.5 bg-slate-800 hover:bg-teal-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-slate-200 hover:text-white rounded-lg transition-colors active:scale-95"
            title="Next Higher Floor"
          >
            <ChevronUp size={16} />
          </button>
          <button
            onClick={handleStepDown}
            disabled={selectedFloorNumber <= minFloor}
            className="p-1.5 bg-slate-800 hover:bg-teal-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-slate-200 hover:text-white rounded-lg transition-colors active:scale-95"
            title="Next Lower Floor"
          >
            <ChevronDown size={16} />
          </button>
        </div>
      </div>

      {/* Selected Unit Badge */}
      {selectedUnitLabel && (
        <div className="bg-teal-950/40 border border-teal-700/50 rounded-xl px-3 py-1.5 flex items-center justify-between text-xs mb-3">
          <span className="text-slate-400 text-[11px]">Selected Flat:</span>
          <span className="font-bold text-teal-300">{selectedUnitLabel}</span>
        </div>
      )}

      {/* Quick Floor Chips (Top to bottom order) */}
      <div>
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center justify-between">
          <span>Quick Select ({safeFloors.length} Floors)</span>
          <span className="text-slate-500 font-normal">Top to Ground</span>
        </label>
        <div className="grid grid-cols-5 gap-1.5 max-h-36 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700">
          {[...safeFloors]
            .sort((a, b) => b.floor_number - a.floor_number)
            .map((fl) => {
              const isSelected = fl.floor_number === selectedFloorNumber;
              const hasAvailable = fl.available_units > 0;
              return (
                <button
                  key={fl.id}
                  onClick={() => onSelectFloor(fl.floor_number)}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all relative ${
                    isSelected
                      ? "bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/30 scale-105"
                      : "bg-slate-800/80 hover:bg-slate-700 text-slate-300"
                  }`}
                >
                  <span>{fl.floor_number}</span>
                  {hasAvailable && (
                    <span
                      className={`absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full ${
                        isSelected ? "bg-slate-950" : "bg-emerald-400"
                      }`}
                    />
                  )}
                </button>
              );
            })}
        </div>
      </div>
    </div>
  );
};
