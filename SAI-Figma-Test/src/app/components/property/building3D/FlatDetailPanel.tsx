import React, { useState } from "react";
import { Unit3DItem } from "../../../../api/building3D";
import {
  Film,
  Building,
  Layers,
  Compass,
  CheckCircle,
  FileText,
  Zap,
  Share2,
  Check,
  Scale,
  Sparkles,
  Bath,
  Home,
  ShieldCheck,
  ArrowRight
} from "lucide-react";

interface FlatDetailPanelProps {
  unit: Unit3DItem;
  projectName: string;
  towerName: string;
  onStartTour: (unit: Unit3DItem) => void;
  onOpenBooking: (unit: Unit3DItem) => void;
  onViewFloorPlan: (unit: Unit3DItem) => void;
  onAddToCompare: (unit: Unit3DItem) => void;
  isInCompare?: boolean;
}

export const FlatDetailPanel: React.FC<FlatDetailPanelProps> = ({
  unit,
  projectName,
  towerName,
  onStartTour,
  onOpenBooking,
  onViewFloorPlan,
  onAddToCompare,
  isInCompare = false,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);

  const isAvailable = unit.status === "available";

  const handleShareLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.set("page", "building-3d");
    url.searchParams.set("buildingId", String(unit.building_id));
    url.searchParams.set("floor", String(unit.floor_number));
    url.searchParams.set("unit", unit.unit_number);
    navigator.clipboard.writeText(url.toString()).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    });
  };

  const getStatusBadge = () => {
    switch (unit.status) {
      case "available":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-black px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <CheckCircle size={12} className="text-emerald-400" /> AVAILABLE FOR BOOKING
          </span>
        );
      case "reserved":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-black px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
            RESERVED
          </span>
        );
      case "booked":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-black px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
            BOOKED
          </span>
        );
      case "sold":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-black px-3 py-1 rounded-full bg-slate-500/20 text-slate-300 border border-slate-500/40">
            SOLD
          </span>
        );
      case "blocked":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-black px-3 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
            BLOCKED
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-6 text-white shadow-2xl w-full max-w-md select-none transition-all">
      {/* Breadcrumb Hierarchy */}
      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 mb-2 overflow-x-auto whitespace-nowrap">
        <span>{projectName}</span>
        <span>→</span>
        <span className="text-teal-300">{towerName}</span>
        <span>→</span>
        <span>Floor {unit.floor_number}</span>
        <span>→</span>
        <span className="text-white font-black bg-teal-900/50 px-2 py-0.5 rounded-lg border border-teal-700/50">
          {unit.unit_label || `Unit ${unit.unit_number}`}
        </span>
      </div>

      {/* Main Title & Status */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            {unit.unit_label || `Flat ${unit.floor_number}-${unit.unit_number}`}
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Level {unit.floor_number} · {unit.wing || "Standard Wing"}
          </p>
        </div>
        <div>{getStatusBadge()}</div>
      </div>

      {/* Price Spotlight */}
      <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 mb-4 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
            All-Inclusive Price
          </span>
          <span className="text-2xl font-black text-teal-300">
            {unit.price_display}
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
            Token Deposit
          </span>
          <span className="text-sm font-bold text-emerald-400">
            ₹50,000 to Reserve
          </span>
        </div>
      </div>

      {/* Flat Specifications Grid */}
      <div className="grid grid-cols-2 gap-2.5 text-xs mb-5">
        <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/40">
          <span className="text-[10px] text-slate-400 font-semibold block">Configuration</span>
          <span className="font-black text-slate-200 text-sm">{unit.bhk} BHK Apartment</span>
        </div>
        <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/40">
          <span className="text-[10px] text-slate-400 font-semibold block">Carpet Area</span>
          <span className="font-black text-slate-200 text-sm">{unit.carpet_area} sq.ft</span>
        </div>
        <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/40">
          <span className="text-[10px] text-slate-400 font-semibold block">Main Orientation</span>
          <span className="font-black text-teal-300 text-sm flex items-center gap-1">
            <Compass size={13} /> {unit.direction} Facing
          </span>
        </div>
        <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/40">
          <span className="text-[10px] text-slate-400 font-semibold block">Balcony Orientation</span>
          <span className="font-black text-emerald-300 text-sm flex items-center gap-1">
            <Compass size={13} /> {unit.balcony_direction} Facing
          </span>
        </div>
        <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/40">
          <span className="text-[10px] text-slate-400 font-semibold block">Balconies</span>
          <span className="font-bold text-slate-200">{unit.balconies} Private Balconies</span>
        </div>
        <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/40">
          <span className="text-[10px] text-slate-400 font-semibold block">Bathrooms</span>
          <span className="font-bold text-slate-200">{unit.bathrooms} Luxury Baths</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2.5">
        {/* Start 3D Tour Button */}
        <button
          onClick={() => onStartTour(unit)}
          className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-teal-500/25 active:scale-98 transition-all cursor-pointer"
        >
          <Film size={17} />
          <span>START 3D VIRTUAL WALKTHROUGH</span>
        </button>

        {/* Book This Flat (Only available if status is available) */}
        {isAvailable ? (
          <button
            onClick={() => onOpenBooking(unit)}
            className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all cursor-pointer"
          >
            <Zap size={15} />
            <span>BOOK THIS FLAT (TRANSACTION-SAFE)</span>
          </button>
        ) : (
          <div className="py-2.5 px-4 rounded-xl bg-slate-800 text-slate-400 text-center font-bold text-xs border border-slate-700">
            This flat is currently {unit.status.toUpperCase()}
          </div>
        )}

        {/* Floor Plan & Compare & Share */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <button
            onClick={() => onViewFloorPlan(unit)}
            className="py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1 transition-colors"
          >
            <FileText size={12} />
            <span>Floor Plan</span>
          </button>

          <button
            onClick={() => onAddToCompare(unit)}
            className={`py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-colors ${
              isInCompare ? "bg-teal-900 text-teal-300 border border-teal-600" : "bg-slate-800 hover:bg-slate-700 text-slate-200"
            }`}
          >
            <Scale size={12} />
            <span>{isInCompare ? "Comparing" : "Compare"}</span>
          </button>

          <button
            onClick={handleShareLink}
            className="py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1 transition-colors"
            title="Copy Deep-link to this Flat"
          >
            {copiedLink ? <Check size={12} className="text-emerald-400" /> : <Share2 size={12} />}
            <span>{copiedLink ? "Copied!" : "Share"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
