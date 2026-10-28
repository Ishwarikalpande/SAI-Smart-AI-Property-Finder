import React from "react";
import { CheckCircle2, ShieldCheck, MapPin, Maximize2, IndianRupee } from "lucide-react";

interface PropertyInfoOverlayProps {
  sceneType?: string;
  title?: string;
  subtitle?: string;
  bhk?: number | null;
  area?: string | null;
  price?: string | null;
  location?: string | null;
  furnishing?: string | null;
  badge?: string | null;
  isVerified?: boolean;
  isRera?: boolean;
  features?: string[];
  align?: "bottom-left" | "bottom-right" | "center";
}

export const PropertyInfoOverlay: React.FC<PropertyInfoOverlayProps> = ({
  sceneType,
  title,
  subtitle,
  bhk,
  area,
  price,
  location,
  furnishing,
  badge,
  isVerified,
  isRera,
  features,
  align = "bottom-left",
}) => {
  return (
    <div
      className={`sai-walkthrough-glass p-4 sm:p-5 rounded-2xl max-w-xl text-white shadow-2xl sai-animate-slide-up border border-white/15 ${
        align === "center"
          ? "mx-auto text-center"
          : align === "bottom-right"
          ? "ml-auto text-right"
          : "mr-auto text-left"
      }`}
    >
      {/* Top badges */}
      <div className={`flex flex-wrap items-center gap-1.5 mb-2.5 ${align === "center" ? "justify-center" : align === "bottom-right" ? "justify-end" : "justify-start"}`}>
        {isVerified && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/25 border border-emerald-400/40 text-emerald-300 text-[11px] font-semibold tracking-wide">
            <ShieldCheck className="w-3.5 h-3.5" />
            Verified Listing
          </span>
        )}
        {isRera && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/25 border border-amber-400/40 text-amber-300 text-[11px] font-semibold tracking-wide">
            <CheckCircle2 className="w-3.5 h-3.5" />
            RERA Approved
          </span>
        )}
        {badge && !badge.includes("Standard") && (
          <span className="px-2.5 py-0.5 rounded-full bg-teal-500/25 border border-teal-400/40 text-teal-200 text-[11px] font-semibold">
            {badge}
          </span>
        )}
      </div>

      {/* Scene Type (e.g. Exterior, Bedrooms) */}
      {sceneType && (
        <p className="text-teal-300 text-xs sm:text-sm font-black tracking-wider uppercase mb-1 drop-shadow flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-teal-400" />
          {sceneType}
        </p>
      )}

      {/* Main Property Title */}
      {title && (
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white mb-1.5 leading-tight drop-shadow-md">
          {title}
        </h2>
      )}

      {/* Secondary Information row: e.g. Amravati • 1250 sq.ft • ₹62 Lakh */}
      {subtitle && (
        <p className="text-slate-200 text-xs sm:text-sm font-medium mb-3 drop-shadow flex items-center gap-2">
          {subtitle}
        </p>
      )}

      {/* Location (if not in subtitle) */}
      {location && !subtitle?.includes(location) && (
        <div className={`flex items-center gap-1.5 text-slate-300 text-xs sm:text-sm mb-3.5 ${align === "center" ? "justify-center" : align === "bottom-right" ? "justify-end" : "justify-start"}`}>
          <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
          <span>{location}</span>
        </div>
      )}

      {/* Key Metric Chips */}
      <div className={`flex flex-wrap items-center gap-2 pt-2 border-t border-white/10 ${align === "center" ? "justify-center" : align === "bottom-right" ? "justify-end" : "justify-start"}`}>
        {price && (
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-600/40 border border-teal-400/30 text-white font-bold text-sm sm:text-base shadow-sm">
            <span>{price}</span>
          </div>
        )}

        {bhk && (
          <div className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-slate-200 text-xs sm:text-sm font-semibold">
            {bhk} BHK
          </div>
        )}

        {area && (
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-slate-200 text-xs sm:text-sm font-medium">
            <Maximize2 className="w-3 h-3 text-teal-300" />
            <span>{area}</span>
          </div>
        )}

        {furnishing && furnishing.toLowerCase() !== "unfurnished" && (
          <div className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-slate-200 text-xs sm:text-sm capitalize font-medium">
            {furnishing}
          </div>
        )}
      </div>

      {/* Optional specific features pills */}
      {features && features.length > 0 && (
        <div className={`flex flex-wrap items-center gap-1.5 mt-3 ${align === "center" ? "justify-center" : align === "bottom-right" ? "justify-end" : "justify-start"}`}>
          {features.map((feat, idx) => (
            <span
              key={idx}
              className="text-[11px] px-2 py-0.5 rounded-md bg-white/10 text-slate-300 border border-white/10"
            >
              • {feat}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
