import React from "react";
import { Unit3DItem } from "../../../../api/building3D";
import {
  X,
  Scale,
  Film,
  Trash2,
  CheckCircle,
  Compass,
  ArrowRight
} from "lucide-react";

interface FlatComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  units: Unit3DItem[];
  onRemoveUnit: (unitId: number) => void;
  onSelectUnit: (unit: Unit3DItem) => void;
  onStartTour: (unit: Unit3DItem) => void;
}

export const FlatComparisonModal: React.FC<FlatComparisonModalProps> = ({
  isOpen,
  onClose,
  units = [],
  onRemoveUnit,
  onSelectUnit,
  onStartTour,
}) => {
  const safeUnits = Array.isArray(units) ? units : [];
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-4xl w-full p-6 text-white shadow-2xl relative max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>

        <div className="mb-4">
          <h3 className="text-xl font-black text-white flex items-center gap-2">
            <Scale className="text-teal-400" size={18} />
            Side-by-Side Flat Comparison
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Compare architectural specifications, orientation, floor height, and pricing for up to 4 flats.
          </p>
        </div>

        {safeUnits.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs bg-slate-950 rounded-2xl border border-slate-800">
            No flats added to comparison yet. Click "Compare" on any flat details card to compare side by side.
          </div>
        ) : (
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-3 px-3 uppercase text-[10px] tracking-wider w-36">Specification</th>
                  {safeUnits.map((u) => (
                    <th key={u.id} className="py-3 px-3 min-w-[180px]">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-sm text-teal-300">{u.unit_label}</span>
                        <button
                          onClick={() => onRemoveUnit(u.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                          title="Remove from comparison"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                <tr>
                  <td className="py-2.5 px-3 text-slate-400 font-bold">BHK</td>
                  {units.map((u) => (
                    <td key={u.id} className="py-2.5 px-3 font-bold text-white">{u.bhk} BHK</td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-slate-400 font-bold">Floor Level</td>
                  {units.map((u) => (
                    <td key={u.id} className="py-2.5 px-3 font-semibold text-slate-200">Floor {u.floor_number}</td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-slate-400 font-bold">Orientation</td>
                  {units.map((u) => (
                    <td key={u.id} className="py-2.5 px-3 font-semibold text-teal-300 flex items-center gap-1">
                      <Compass size={11} /> {u.direction}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-slate-400 font-bold">Balcony Facing</td>
                  {units.map((u) => (
                    <td key={u.id} className="py-2.5 px-3 text-emerald-300 font-semibold">{u.balcony_direction} Facing</td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-slate-400 font-bold">Carpet Area</td>
                  {units.map((u) => (
                    <td key={u.id} className="py-2.5 px-3 text-slate-200">{u.carpet_area} sq.ft</td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-slate-400 font-bold">Bathrooms / Balconies</td>
                  {units.map((u) => (
                    <td key={u.id} className="py-2.5 px-3 text-slate-200">{u.bathrooms} Baths · {u.balconies} Balconies</td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-slate-400 font-bold">Total Price</td>
                  {units.map((u) => (
                    <td key={u.id} className="py-2.5 px-3 font-black text-teal-300 text-sm">{u.price_display}</td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-slate-400 font-bold">Availability Status</td>
                  {units.map((u) => (
                    <td key={u.id} className="py-2.5 px-3">
                      <span
                        className="inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase"
                        style={{ backgroundColor: `${u.status_color}25`, color: u.status_color }}
                      >
                        {u.status}
                      </span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-4 px-3 text-slate-400 font-bold">Actions</td>
                  {units.map((u) => (
                    <td key={u.id} className="py-4 px-3">
                      <div className="flex flex-col gap-1.5">
                        <button
                          onClick={() => {
                            onStartTour(u);
                            onClose();
                          }}
                          className="py-1.5 px-3 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1 shadow transition-colors"
                        >
                          <Film size={12} />
                          <span>View 3D Tour</span>
                        </button>
                        <button
                          onClick={() => {
                            onSelectUnit(u);
                            onClose();
                          }}
                          className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                        >
                          Locate in Building
                        </button>
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
