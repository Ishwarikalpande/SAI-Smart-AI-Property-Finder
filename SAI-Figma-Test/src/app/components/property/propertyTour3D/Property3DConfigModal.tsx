import React, { useState } from "react";
import { X, Check, Sliders, RefreshCw, Layers, Move } from "lucide-react";
import { Property3DTourData, Property3DRoom } from "./PropertyScene";
import { saveProperty3DTour } from "../../../../api/properties";

interface Property3DConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  tourData: Property3DTourData;
  onConfigSaved: (updatedData: Property3DTourData) => void;
}

export const Property3DConfigModal: React.FC<Property3DConfigModalProps> = ({
  isOpen,
  onClose,
  tourData,
  onConfigSaved
}) => {
  const [bhk, setBhk] = useState<number>(tourData.bhk || 2);
  const [rooms, setRooms] = useState<Property3DRoom[]>(tourData.rooms || []);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDimensionChange = (
    index: number,
    field: "width" | "length",
    value: number
  ) => {
    const next = [...rooms];
    next[index] = {
      ...next[index],
      dimensions: {
        ...next[index].dimensions,
        [field]: Math.max(1.5, Math.min(12, value))
      }
    };
    setRooms(next);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSuccessMsg(null);
    try {
      const payload: Partial<Property3DTourData> = {
        ...tourData,
        bhk,
        bedrooms: bhk,
        rooms
      };
      const res = await saveProperty3DTour(tourData.property_id, payload);
      setSuccessMsg("3D Configuration saved successfully!");
      onConfigSaved(res as Property3DTourData);
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1200);
    } catch (e) {
      console.error("Failed to save 3D config:", e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-teal-500/30 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 text-white max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-teal-400" />
            <h3 className="text-lg font-bold">Property 3D Structure Configuration</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BHK Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Property BHK Configuration
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((n) => (
              <button
                key={n}
                onClick={() => setBhk(n)}
                className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  bhk === n
                    ? "bg-teal-500 text-slate-950 border-teal-400 font-black shadow-lg"
                    : "bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700"
                }`}
              >
                {n} BHK
              </button>
            ))}
          </div>
        </div>

        {/* Room Dimensions & Order List */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Room Dimensions (Meters)
            </label>
            <span className="text-[10px] text-teal-400">{rooms.length} Rooms Configured</span>
          </div>

          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
            {rooms.map((room, idx) => (
              <div
                key={room.id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="font-mono text-xs font-bold text-teal-400">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-200 truncate">{room.name}</p>
                    <p className="text-[10px] text-slate-400 capitalize">{room.type}</p>
                  </div>
                </div>

                {/* Dimension inputs */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-400">W:</span>
                    <input
                      type="number"
                      step="0.2"
                      value={room.dimensions.width}
                      onChange={(e) =>
                        handleDimensionChange(idx, "width", parseFloat(e.target.value) || 3.0)
                      }
                      className="w-14 px-1.5 py-1 rounded bg-slate-900 border border-slate-700 text-xs font-mono text-center text-teal-300"
                    />
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-400">L:</span>
                    <input
                      type="number"
                      step="0.2"
                      value={room.dimensions.length}
                      onChange={(e) =>
                        handleDimensionChange(idx, "length", parseFloat(e.target.value) || 3.0)
                      }
                      className="w-14 px-1.5 py-1 rounded bg-slate-900 border border-slate-700 text-xs font-mono text-center text-teal-300"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Success alert message */}
        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-lg active:scale-95 transition-all"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Save 3D Structure</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
