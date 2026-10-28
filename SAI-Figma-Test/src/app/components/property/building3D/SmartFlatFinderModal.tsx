import React, { useState } from "react";
import { findMyFlats, SmartFlatFilterParams, Unit3DItem } from "../../../../api/building3D";
import {
  Search,
  Filter,
  X,
  Compass,
  CheckCircle,
  Building,
  Sparkles,
  ArrowRight,
  SlidersHorizontal
} from "lucide-react";

interface SmartFlatFinderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUnitResult: (unit: any) => void;
  defaultCity?: string;
}

export const SmartFlatFinderModal: React.FC<SmartFlatFinderModalProps> = ({
  isOpen,
  onClose,
  onSelectUnitResult,
  defaultCity = "Amravati",
}) => {
  const [city, setCity] = useState(defaultCity);
  const [bhk, setBhk] = useState<number | undefined>(3);
  const [floorPref, setFloorPref] = useState<"high" | "mid" | "low" | undefined>("high");
  const [direction, setDirection] = useState<string>("East");
  const [balconyDir, setBalconyDir] = useState<string>("");
  const [maxBudget, setMaxBudget] = useState<number>(10000000); // 1 Crore
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  if (!isOpen) return null;

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setHasSearched(true);
    try {
      const data = await findMyFlats({
        city: city || undefined,
        bhk: bhk || undefined,
        floor_preference: floorPref || undefined,
        direction: direction || undefined,
        balcony_direction: balconyDir || undefined,
        max_price: maxBudget || undefined,
        status: "available",
      });
      setResults(data || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full p-6 text-white shadow-2xl relative max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>

        <div className="mb-4">
          <h3 className="text-xl font-black text-white flex items-center gap-2">
            <Sparkles className="text-teal-400" size={18} />
            Find My Flat · Smart Preferences
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Filter available inventory by exact architectural specifications and orientation. Source of truth is verified database.
          </p>
        </div>

        {/* Filters Grid */}
        <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              City
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Amravati, Pune"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              BHK Preference
            </label>
            <select
              value={bhk || ""}
              onChange={(e) => setBhk(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500"
            >
              <option value="">Any BHK</option>
              <option value="1">1 BHK</option>
              <option value="2">2 BHK</option>
              <option value="3">3 BHK</option>
              <option value="4">4 BHK</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Floor Level
            </label>
            <select
              value={floorPref || ""}
              onChange={(e) => setFloorPref((e.target.value as any) || undefined)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500"
            >
              <option value="">Any Floor</option>
              <option value="high">Higher Floors (12 - 20)</option>
              <option value="mid">Mid Floors (5 - 11)</option>
              <option value="low">Lower Floors (1 - 4)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Facing Direction
            </label>
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500"
            >
              <option value="">Any Direction</option>
              <option value="East">East Facing</option>
              <option value="North">North Facing</option>
              <option value="West">West Facing</option>
              <option value="South">South Facing</option>
              <option value="North-East">North-East Facing</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Balcony Facing
            </label>
            <select
              value={balconyDir}
              onChange={(e) => setBalconyDir(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500"
            >
              <option value="">Any Balcony</option>
              <option value="East">East Balcony</option>
              <option value="North">North Balcony</option>
              <option value="West">West Balcony</option>
              <option value="South">South Balcony</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Max Budget: ₹{(maxBudget / 10000000).toFixed(2)} Cr
            </label>
            <input
              type="range"
              min={3000000}
              max={15000000}
              step={500000}
              value={maxBudget}
              onChange={(e) => setMaxBudget(Number(e.target.value))}
              className="w-full accent-teal-400 mt-2"
            />
          </div>

          <div className="sm:col-span-3 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="py-2.5 px-6 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <Search size={14} />
              <span>{loading ? "Searching Inventory..." : "Find Matching Available Flats"}</span>
            </button>
          </div>
        </form>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto pr-1">
          {hasSearched && (
            <div className="mb-2 text-xs font-bold text-slate-400 flex items-center justify-between">
              <span>{results.length} Matching Available Flats Found</span>
              <span className="text-[10px] text-teal-400">Click to locate in 3D Building</span>
            </div>
          )}

          {results.length === 0 && hasSearched ? (
            <div className="text-center py-8 bg-slate-950 rounded-2xl border border-slate-800 text-slate-400 text-xs">
              No available flats matching these exact preferences. Try adjusting your floor or budget criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {results.map((u) => (
                <div
                  key={u.id}
                  onClick={() => {
                    onSelectUnitResult(u);
                    onClose();
                  }}
                  className="bg-slate-950/70 hover:bg-slate-800/80 p-3.5 rounded-2xl border border-slate-800 hover:border-teal-500/50 cursor-pointer transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-black text-sm text-teal-300">
                        {u.tower_name} · {u.unit_label}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                        Floor {u.floor_number}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 font-semibold">
                      {u.bhk} BHK · {u.area_sqft} sq.ft · {u.direction} Facing
                    </p>
                    {u.balcony_direction && (
                      <p className="text-[11px] text-slate-400">
                        Balcony: {u.balcony_direction} Facing
                      </p>
                    )}
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="font-black text-sm text-white">{u.price_display}</span>
                    <span className="text-xs font-bold text-teal-400 flex items-center gap-1">
                      View in 3D <ArrowRight size={12} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
