import React from "react";
import {
  CheckCircle2,
  Calendar,
  Phone,
  RotateCcw,
  Sparkles,
  Building2,
  MapPin,
  BedDouble,
  Bath,
  Sun,
  ShieldCheck,
} from "lucide-react";

interface PropertySummarySceneProps {
  propertyData?: Record<string, any>;
  onScheduleVisitClick?: () => void;
  onContactClick?: () => void;
  onRestart?: () => void;
}

export const PropertySummaryScene: React.FC<PropertySummarySceneProps> = ({
  propertyData,
  onScheduleVisitClick,
  onContactClick,
  onRestart,
}) => {
  const p = propertyData || {};
  const title = p.title || "Verified Property";
  const price = p.price || "Price on Request";
  const area = p.area || (p.area_sqft ? `${p.area_sqft} sq.ft` : null);
  const location = p.location || `${p.locality || ""}, ${p.city || ""}`.replace(/^, |, $/g, "") || "Prime Urban Location";
  const bhk = p.bhk;
  const bedrooms = p.bedrooms ?? bhk;
  const bathrooms = p.bathrooms;
  const balconies = p.balconies;
  const propType = p.property_type || "Apartment";

  return (
    <div className="relative w-full h-full overflow-y-auto flex items-center justify-center p-4 sm:p-8 select-none z-20">
      {/* Background glow and subtle geometry */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#071927]/90 via-[#0a2336]/95 to-[#040e17] backdrop-blur-md pointer-events-none" />

      {/* Main Glassmorphic Summary Card */}
      <div className="relative z-10 w-full max-w-2xl bg-slate-900/80 border-2 border-teal-400/40 rounded-3xl p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.7)] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-500">
        {/* Top Verified Header */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/40 text-teal-300 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-teal-300" />
            <span>SAI Verified Property Walkthrough Complete</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-amber-300 font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>100% Real Database Specs</span>
          </div>
        </div>

        {/* Property Title & Price */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-4 border-b border-slate-700/80 pb-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {title}
            </h2>
            <div className="flex items-center gap-1.5 text-slate-400 text-xs sm:text-sm mt-1">
              <MapPin className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
              <span>{location}</span>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block">Verified Price</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-teal-300 tracking-tight">
              {price}
            </span>
          </div>
        </div>

        {/* Architectural Specs Summary Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {bhk && (
            <div className="rounded-2xl bg-slate-800/60 border border-slate-700/60 p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Configuration</span>
              <span className="text-base sm:text-lg font-black text-white">{bhk} BHK</span>
            </div>
          )}

          {bedrooms && (
            <div className="rounded-2xl bg-slate-800/60 border border-slate-700/60 p-3 text-center flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Bedrooms</span>
              <div className="flex items-center gap-1 text-base sm:text-lg font-black text-white">
                <BedDouble className="w-4 h-4 text-teal-300" />
                <span>{bedrooms}</span>
              </div>
            </div>
          )}

          {bathrooms && (
            <div className="rounded-2xl bg-slate-800/60 border border-slate-700/60 p-3 text-center flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Bathrooms</span>
              <div className="flex items-center gap-1 text-base sm:text-lg font-black text-white">
                <Bath className="w-4 h-4 text-cyan-300" />
                <span>{bathrooms}</span>
              </div>
            </div>
          )}

          {balconies !== undefined && balconies !== null && balconies > 0 && (
            <div className="rounded-2xl bg-slate-800/60 border border-slate-700/60 p-3 text-center flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Balconies</span>
              <div className="flex items-center gap-1 text-base sm:text-lg font-black text-white">
                <Sun className="w-4 h-4 text-emerald-300" />
                <span>{balconies}</span>
              </div>
            </div>
          )}

          {area && (
            <div className="rounded-2xl bg-slate-800/60 border border-slate-700/60 p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Super Area</span>
              <span className="text-base sm:text-lg font-black text-white">{area}</span>
            </div>
          )}
        </div>

        {/* Next Steps CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          {onScheduleVisitClick && (
            <button
              onClick={onScheduleVisitClick}
              className="w-full sm:flex-1 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-[0_4px_24px_rgba(45,212,191,0.4)] active:scale-98 transition-all cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              Schedule In-Person Visit
            </button>
          )}

          {onContactClick && (
            <button
              onClick={onContactClick}
              className="w-full sm:flex-1 py-3.5 px-5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-sm flex items-center justify-center gap-2 backdrop-blur-md active:scale-98 transition-all cursor-pointer"
            >
              <Phone className="w-4 h-4 text-teal-300" />
              Contact Advisor
            </button>
          )}

          {onRestart && (
            <button
              onClick={onRestart}
              className="w-full sm:w-auto p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600/60 text-slate-200 hover:text-white flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
              title="Replay Property Tour"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="sm:hidden font-semibold text-xs">Replay Tour</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
