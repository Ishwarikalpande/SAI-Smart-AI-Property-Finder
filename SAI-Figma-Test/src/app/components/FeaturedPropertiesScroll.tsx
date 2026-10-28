import React, { useState, useMemo } from "react";
import {
  Sparkles,
  MapPin,
  Heart,
  Star,
  CheckCircle,
  ArrowRight,
  Pause,
  Play,
  ArrowUp,
  ArrowDown,
  Building,
  Layers,
  ChevronRight,
} from "lucide-react";
import { UIProperty } from "../../api/properties";
import { getPropertyImages, getFallbackPropertyImage } from "../data/propertyImages";

interface FeaturedPropertiesScrollProps {
  properties: UIProperty[];
  navigate: (page: any) => void;
  selectProperty: (id: number) => void;
  onToggleSave?: (id: number, saved: boolean) => void;
  savedPropertyIds?: Set<number>;
  variant?: "hero" | "full";
  stream?: "left" | "right" | "both";
  className?: string;
}

export const FeaturedPropertiesScroll: React.FC<FeaturedPropertiesScrollProps> = ({
  properties,
  navigate,
  selectProperty,
  onToggleSave,
  savedPropertyIds = new Set(),
  variant = "full",
  stream = "both",
  className = "",
}) => {
  const [manualPause, setManualPause] = useState(false);
  const [hoveredCardId, setHoveredCardId] = useState<number | null>(null);
  const [touchPaused, setTouchPaused] = useState(false);

  // Divide dataset into two distinct, dynamic property streams for left and right columns
  const { leftStream, rightStream } = useMemo(() => {
    if (!properties || properties.length === 0) {
      return { leftStream: [], rightStream: [] };
    }

    // Split properties into two rich streams with different sorting/variety
    const half = Math.ceil(properties.length / 2);
    const stream1 = properties.filter((_, i) => i % 2 === 0);
    const stream2 = properties.filter((_, i) => i % 2 !== 0);

    // If one stream is too short, balance them
    const left = stream1.length >= 3 ? stream1 : properties.slice(0, half);
    const right = stream2.length >= 3 ? stream2 : properties.slice(half);

    // Reverse right stream so the order and content are visibly distinct
    const reversedRight = [...right].reverse();

    return {
      leftStream: left,
      rightStream: reversedRight,
    };
  }, [properties]);

  const isPaused = manualPause || touchPaused;

  const handleCardClick = (id: number) => {
    selectProperty(id);
    navigate("property");
  };

  const renderCard = (p: UIProperty, columnDir: "up" | "down", indexKey: string) => {
    const isSaved = savedPropertyIds.has(p.id);
    const cardPhotos = getPropertyImages(p.id, p.img, p.type, p.images);
    const photoUrl = cardPhotos[0]?.url || p.img;
    const isThisHovered = hoveredCardId === p.id;

    return (
      <div
        key={`${indexKey}-${p.id}`}
        onMouseEnter={() => setHoveredCardId(p.id)}
        onMouseLeave={() => setHoveredCardId(null)}
        onClick={() => handleCardClick(p.id)}
        className={`bg-white rounded-2xl overflow-hidden border transition-all duration-300 shadow-sm hover:shadow-xl cursor-pointer select-none group/ticker ${
          isThisHovered
            ? "border-[#008F8C] ring-2 ring-[#008F8C]/20 shadow-lg scale-[1.01]"
            : "border-[#D9E5E3] hover:border-[#008F8C]/60"
        }`}
      >
        <div className="flex flex-col sm:flex-row h-full">
          {/* Property Image & Status Badges */}
          <div className="relative sm:w-2/5 h-44 sm:h-auto min-h-[160px] overflow-hidden bg-[#E6F4F2] flex-shrink-0">
            <img
              src={photoUrl}
              alt={p.name}
              loading="lazy"
              onError={(e) => {
                const fallback = getFallbackPropertyImage(p.id, p.type);
                if (e.currentTarget.src !== fallback) {
                  e.currentTarget.src = fallback;
                }
              }}
              className="w-full h-full object-cover group-hover/ticker:scale-105 transition-transform duration-500"
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

            {/* Badges on Image */}
            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap z-10">
              <span className="bg-[#006D6A] text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                {p.type || "Apartment"}
              </span>
              {p.verified && (
                <span className="bg-emerald-600/90 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                  <CheckCircle size={9} /> RERA
                </span>
              )}
            </div>

            {/* Direction Indicator + Match Tag */}
            <div className="absolute top-2.5 right-2.5 flex items-center gap-1 z-10">
              <span className="bg-black/60 backdrop-blur-md text-[#67E8F9] text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 border border-white/10">
                <Sparkles size={9} />
                {p.match || 95}%
              </span>
            </div>

            {/* Availability / Status Bottom Left */}
            <div className="absolute bottom-2 left-2.5 z-10">
              <span className="bg-slate-900/80 backdrop-blur-md text-slate-100 text-[9px] font-semibold px-2 py-0.5 rounded-md border border-white/10">
                {p.status || "Ready to Move"}
              </span>
            </div>
          </div>

          {/* Property Content */}
          <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
            <div>
              {/* Header: Title and Price */}
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="min-w-0 flex-1">
                  <h4 className="font-extrabold text-slate-800 text-sm sm:text-base leading-snug truncate group-hover/ticker:text-[#006D6A] transition-colors">
                    {p.name}
                  </h4>
                  <div className="flex items-center gap-1 text-slate-500 text-xs mt-0.5">
                    <MapPin size={11} className="text-[#008F8C] flex-shrink-0" />
                    <span className="truncate">{p.location}</span>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className="font-black text-[#008F8C] text-base sm:text-lg leading-tight block">
                    {p.price}
                  </span>
                  <span className="text-[9px] text-slate-400 font-medium">
                    EMI ₹{Math.round(p.priceNum * 750).toLocaleString()}/mo
                  </span>
                </div>
              </div>

              {/* Specs Pills: Area, BHK, Rating */}
              <div className="flex items-center gap-1.5 flex-wrap my-2.5">
                <span className="text-[10px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Building size={10} className="text-slate-500" />
                  {p.area || "1,200 sq.ft"}
                </span>

                {p.type && (
                  <span className="text-[10px] bg-[#E6F4F2] text-[#006D6A] font-bold px-2 py-0.5 rounded-md">
                    {p.type.split(" ")[0]} BHK
                  </span>
                )}

                <div className="flex items-center gap-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded-md border border-amber-200/60">
                  <Star size={10} className="fill-amber-400 text-amber-400" />
                  <span>{p.rating || 4.8}</span>
                </div>
              </div>

              {/* Amenities tags (first 2-3) */}
              {p.amenities && p.amenities.length > 0 && (
                <div className="hidden sm:flex items-center gap-1 text-[9px] text-slate-500 mb-2 truncate">
                  <span className="text-slate-400">Amenities:</span>
                  {p.amenities.slice(0, 3).map((a, i) => (
                    <span key={i} className="text-slate-600 font-medium">
                      {a}{i < Math.min(p.amenities.length, 3) - 1 ? " • " : ""}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Card Action Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-1">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                <span>Verified by SAI Trust</span>
              </div>

              <div className="flex items-center gap-2">
                {/* Save Bookmark button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSave?.(p.id, !isSaved);
                  }}
                  title={isSaved ? "Saved" : "Save property"}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Heart
                    size={15}
                    className={isSaved ? "fill-red-500 text-red-500" : ""}
                  />
                </button>

                {/* View Details Button (REQUIRED) */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCardClick(p.id);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#006D6A] hover:bg-[#004F4D] text-white text-xs font-bold transition-all shadow-sm group-hover/ticker:shadow hover:scale-105 active:scale-95"
                >
                  <span>View Details</span>
                  <ArrowRight size={12} className="group-hover/ticker:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderHeroCard = (p: UIProperty, columnDir: "up" | "down", indexKey: string) => {
    const isSaved = savedPropertyIds.has(p.id);
    const cardPhotos = getPropertyImages(p.id, p.img, p.type, p.images);
    const photoUrl = cardPhotos[0]?.url || p.img;
    const isThisHovered = hoveredCardId === p.id;

    return (
      <div
        key={`${indexKey}-${p.id}`}
        onMouseEnter={() => setHoveredCardId(p.id)}
        onMouseLeave={() => setHoveredCardId(null)}
        onClick={() => handleCardClick(p.id)}
        className={`bg-white rounded-2xl overflow-hidden border transition-all duration-300 shadow-md hover:shadow-2xl cursor-pointer select-none group/ticker ${
          isThisHovered
            ? "border-[#008F8C] ring-2 ring-[#008F8C]/40 shadow-xl scale-[1.02]"
            : "border-slate-200/90 hover:border-[#008F8C]/60"
        }`}
      >
        {/* Property Image & Badges */}
        <div className="relative h-28 sm:h-32 overflow-hidden bg-[#E6F4F2] flex-shrink-0">
          <img
            src={photoUrl}
            alt={p.name}
            loading="lazy"
            onError={(e) => {
              const fallback = getFallbackPropertyImage(p.id, p.type);
              if (e.currentTarget.src !== fallback) {
                e.currentTarget.src = fallback;
              }
            }}
            className="w-full h-full object-cover group-hover/ticker:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />

          {/* Badges on Top */}
          <div className="absolute top-2 left-2 flex items-center gap-1 z-10 flex-wrap">
            <span className="bg-[#006A60] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider shadow-sm">
              {p.type?.split(" ")[0] || "Property"}
            </span>
            {p.verified && (
              <span className="bg-emerald-600/90 backdrop-blur-sm text-white text-[8px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-sm">
                <CheckCircle size={8} /> RERA
              </span>
            )}
          </div>

          <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
            <span className="bg-black/60 backdrop-blur-md text-[#67E8F9] text-[9px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5 border border-white/10">
              <Sparkles size={8} />
              {p.match || 95}%
            </span>
          </div>

          {/* Status badge bottom left */}
          <div className="absolute bottom-1.5 left-2 z-10">
            <span className="bg-slate-900/80 backdrop-blur-md text-slate-100 text-[8px] font-semibold px-1.5 py-0.5 rounded border border-white/10">
              {p.status || "Ready to Move"}
            </span>
          </div>
        </div>

        {/* Card Details */}
        <div className="p-2.5 sm:p-3 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-1 mb-0.5">
              <h4 className="font-extrabold text-slate-800 text-xs sm:text-sm leading-snug truncate group-hover/ticker:text-[#006D6A] transition-colors flex-1">
                {p.name}
              </h4>
              <span className="font-black text-[#008F8C] text-xs sm:text-sm leading-tight flex-shrink-0">
                {p.price}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-500 text-[10px] mb-1.5">
              <span className="truncate flex items-center gap-0.5">
                <MapPin size={9} className="text-[#008F8C] flex-shrink-0" />
                {p.location}
              </span>
              <span className="text-[9px] text-slate-400 flex-shrink-0">
                EMI ₹{Math.round(p.priceNum * 750).toLocaleString()}/m
              </span>
            </div>

            {/* Specs chips */}
            <div className="flex items-center gap-1 flex-wrap mb-2">
              <span className="text-[9px] bg-slate-100 text-slate-700 font-semibold px-1.5 py-0.5 rounded">
                {p.area || "1,200 sq.ft"}
              </span>
              {p.type && (
                <span className="text-[9px] bg-[#E6F4F2] text-[#006D6A] font-bold px-1.5 py-0.5 rounded">
                  {p.type.split(" ")[0]} BHK
                </span>
              )}
              <div className="flex items-center gap-0.5 bg-amber-50 text-amber-700 text-[9px] font-bold px-1 py-0.5 rounded border border-amber-200/50">
                <Star size={8} className="fill-amber-400 text-amber-400" />
                <span>{p.rating || 4.8}</span>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-1.5 border-t border-slate-100">
            <span className="text-[9px] text-emerald-600 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Verified
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSave?.(p.id, !isSaved);
                }}
                className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-red-500 transition-colors"
                title={isSaved ? "Saved" : "Save property"}
              >
                <Heart size={12} className={isSaved ? "fill-red-500 text-red-500" : ""} />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCardClick(p.id);
                }}
                className="inline-flex items-center gap-0.5 px-2 py-1 rounded-lg bg-[#006D6A] hover:bg-[#004F4D] text-white text-[10px] font-bold transition-all shadow-sm hover:scale-105 active:scale-95"
              >
                <span>View</span>
                <ChevronRight size={10} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ── HERO VARIANT: LEFT STREAM (Single Upward Column) ──
  if (variant === "hero" && stream === "left") {
    return (
      <div
        className={`relative rounded-3xl border border-white/20 bg-slate-900/60 backdrop-blur-xl p-2.5 sm:p-3 shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden w-full ${
          isPaused ? "sai-marquee-paused" : ""
        } ${className}`}
        onTouchStart={() => setTouchPaused(true)}
        onTouchEnd={() => setTouchPaused(false)}
      >
        {/* Stream Header */}
        <div className="flex items-center justify-between mb-2.5 px-1">
          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider bg-white/95 text-[#006D6A] backdrop-blur-md px-2.5 py-1 rounded-full shadow-md border border-[#006D6A]/30">
            <ArrowUp size={10} className="animate-bounce" /> Stream A · Moving Up
          </span>

          <button
            type="button"
            onClick={() => setManualPause(!manualPause)}
            title={manualPause ? "Resume stream" : "Pause stream"}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] transition-colors border border-white/10"
          >
            {manualPause ? <Play size={11} className="fill-white" /> : <Pause size={11} className="fill-white" />}
          </button>
        </div>

        {/* Marquee Single Column Container */}
        <div className="relative rounded-2xl overflow-hidden bg-slate-950/40 border border-white/10 p-1.5">
          <div className="absolute top-0 left-0 right-0 h-14 bg-gradient-to-b from-slate-950/95 via-slate-950/60 to-transparent z-20 pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-transparent z-20 pointer-events-none" />

          <div className="h-[520px] xl:h-[550px] overflow-hidden relative">
            <div
              className={`flex flex-col gap-3 sai-marquee-col-up ${
                isPaused || hoveredCardId !== null ? "sai-marquee-paused" : ""
              }`}
              style={{ animationDuration: "50s" }}
            >
              {leftStream.map((p, i) => renderHeroCard(p, "up", `hl1-${i}`))}
              {leftStream.map((p, i) => renderHeroCard(p, "up", `hl2-${i}`))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-2 pt-1.5 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-300">
          <span className="flex items-center gap-1 font-semibold text-[#67E8F9]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live Upward
          </span>
          <span className="text-slate-400">Hover to pause</span>
        </div>
      </div>
    );
  }

  // ── HERO VARIANT: RIGHT STREAM (Single Downward Column) ──
  if (variant === "hero" && stream === "right") {
    return (
      <div
        className={`relative rounded-3xl border border-white/20 bg-slate-900/60 backdrop-blur-xl p-2.5 sm:p-3 shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden w-full ${
          isPaused ? "sai-marquee-paused" : ""
        } ${className}`}
        onTouchStart={() => setTouchPaused(true)}
        onTouchEnd={() => setTouchPaused(false)}
      >
        {/* Stream Header */}
        <div className="flex items-center justify-between mb-2.5 px-1">
          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider bg-white/95 text-purple-700 backdrop-blur-md px-2.5 py-1 rounded-full shadow-md border border-purple-300">
            <ArrowDown size={10} className="animate-bounce" /> Stream B · Moving Down
          </span>

          <button
            type="button"
            onClick={() => setManualPause(!manualPause)}
            title={manualPause ? "Resume stream" : "Pause stream"}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] transition-colors border border-white/10"
          >
            {manualPause ? <Play size={11} className="fill-white" /> : <Pause size={11} className="fill-white" />}
          </button>
        </div>

        {/* Marquee Single Column Container */}
        <div className="relative rounded-2xl overflow-hidden bg-slate-950/40 border border-white/10 p-1.5">
          <div className="absolute top-0 left-0 right-0 h-14 bg-gradient-to-b from-slate-950/95 via-slate-950/60 to-transparent z-20 pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-transparent z-20 pointer-events-none" />

          <div className="h-[520px] xl:h-[550px] overflow-hidden relative">
            <div
              className={`flex flex-col gap-3 sai-marquee-col-down ${
                isPaused || hoveredCardId !== null ? "sai-marquee-paused" : ""
              }`}
              style={{ animationDuration: "50s" }}
            >
              {rightStream.map((p, i) => renderHeroCard(p, "down", `hr1-${i}`))}
              {rightStream.map((p, i) => renderHeroCard(p, "down", `hr2-${i}`))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-2 pt-1.5 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-300">
          <span className="flex items-center gap-1 font-semibold text-purple-300">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            Live Downward
          </span>
          <span className="text-slate-400">Hover to pause</span>
        </div>
      </div>
    );
  }

  // ── HERO VARIANT: BOTH STREAMS (Dual Column, used on mobile or combined view) ──
  if (variant === "hero") {
    return (
      <div
        className={`relative rounded-3xl border border-white/20 bg-slate-900/60 backdrop-blur-xl p-3 sm:p-4 shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden w-full ${
          isPaused ? "sai-marquee-paused" : ""
        } ${className}`}
        onTouchStart={() => setTouchPaused(true)}
        onTouchEnd={() => setTouchPaused(false)}
      >
        {/* Top Header Strip inside Hero Frame */}
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={13} className="text-[#67E8F9]" />
              Live Market Streams
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setManualPause(!manualPause)}
              title={manualPause ? "Resume stream motion" : "Pause stream motion"}
              className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold flex items-center gap-1 transition-colors border border-white/10"
            >
              {manualPause ? (
                <>
                  <Play size={11} className="fill-white" />
                  <span>Resume</span>
                </>
              ) : (
                <>
                  <Pause size={11} className="fill-white" />
                  <span>Pause</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate("search")}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#008F8C] hover:bg-[#007370] text-white text-[11px] font-bold transition-all shadow-sm"
            >
              <span>Explore All</span>
              <ChevronRight size={12} />
            </button>
          </div>
        </div>

        {/* Dual Marquee Display Frame */}
        <div className="relative rounded-2xl overflow-hidden bg-slate-950/40 border border-white/10 p-2">
          <div className="absolute top-0 left-0 right-0 h-14 bg-gradient-to-b from-slate-950/95 via-slate-950/60 to-transparent z-20 pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-transparent z-20 pointer-events-none" />

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 h-[460px] sm:h-[490px] overflow-hidden relative">
            {/* Stream A */}
            <div className="relative overflow-hidden h-full">
              <div className="absolute top-2 left-2 z-30 pointer-events-none">
                <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider bg-white/95 text-[#006D6A] backdrop-blur-md px-2 py-0.5 rounded-full shadow-md border border-[#006D6A]/30">
                  <ArrowUp size={10} className="animate-bounce" /> Stream A
                </span>
              </div>
              <div
                className={`flex flex-col gap-3 sai-marquee-col-up ${
                  isPaused || hoveredCardId !== null ? "sai-marquee-paused" : ""
                }`}
                style={{ animationDuration: "50s" }}
              >
                {leftStream.map((p, i) => renderHeroCard(p, "up", `hl1-${i}`))}
                {leftStream.map((p, i) => renderHeroCard(p, "up", `hl2-${i}`))}
              </div>
            </div>

            {/* Stream B */}
            <div className="relative overflow-hidden h-full">
              <div className="absolute top-2 right-2 z-30 pointer-events-none">
                <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider bg-white/95 text-purple-700 backdrop-blur-md px-2 py-0.5 rounded-full shadow-md border border-purple-300">
                  <ArrowDown size={10} className="animate-bounce" /> Stream B
                </span>
              </div>
              <div
                className={`flex flex-col gap-3 sai-marquee-col-down ${
                  isPaused || hoveredCardId !== null ? "sai-marquee-paused" : ""
                }`}
                style={{ animationDuration: "50s" }}
              >
                {rightStream.map((p, i) => renderHeroCard(p, "down", `hr1-${i}`))}
                {rightStream.map((p, i) => renderHeroCard(p, "down", `hr2-${i}`))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer info in Hero frame */}
        <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#67E8F9] animate-pulse" />
            <span>{properties.length} live verified properties</span>
          </div>
          <span className="text-slate-400 text-[10px] hidden sm:inline">
            ✨ Hover over any card to freeze motion
          </span>
        </div>
      </div>
    );
  }

  return (
    <section className="py-20 bg-gradient-to-b from-slate-50 via-white to-slate-50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#E6F4F2] border border-[#008F8C]/20 rounded-full px-4 py-1.5 mb-3 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <Sparkles size={14} className="text-[#006D6A]" />
              <span className="text-[#006D6A] text-xs font-black uppercase tracking-wider">
                Live Dual-Stream Ticker
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
              Featured Properties
            </h2>

            <p className="text-slate-500 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
              Continuous real-time showcase of verified SAI listings. The left column streams upward, while the right column streams downward.{" "}
              <span className="font-semibold text-[#006D6A]">
                Hover over any property card to pause and inspect.
              </span>
            </p>
          </div>

          {/* Interactive Controls & Direction Badges */}
          <div className="flex items-center gap-3 self-start md:self-end">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-bold text-slate-600 border border-slate-200">
              <span className="flex items-center gap-1 text-[#006D6A]">
                <ArrowUp size={13} className="text-[#006D6A]" /> Upward
              </span>
              <span className="text-slate-300">|</span>
              <span className="flex items-center gap-1 text-purple-700">
                <ArrowDown size={13} className="text-purple-700" /> Downward
              </span>
            </div>

            <button
              type="button"
              onClick={() => setManualPause(!manualPause)}
              title={manualPause ? "Resume continuous scroll" : "Pause automatic scroll"}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm border ${
                manualPause
                  ? "bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {manualPause ? (
                <>
                  <Play size={13} className="fill-amber-600 text-amber-600" />
                  <span>Resume Scroll</span>
                </>
              ) : (
                <>
                  <Pause size={13} className="fill-slate-600 text-slate-600" />
                  <span>Pause Scroll</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate("search")}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#006D6A] hover:bg-[#004F4D] text-white transition-all shadow-md hover:shadow-lg"
            >
              <span>Explore All</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Dual Marquee Display Frame */}
        <div
          className={`relative rounded-3xl border border-[#D9E5E3] bg-slate-50/70 p-3 sm:p-6 shadow-[0_8px_30px_rgba(0,109,106,0.06)] overflow-hidden ${
            isPaused ? "sai-marquee-paused" : ""
          }`}
          onTouchStart={() => setTouchPaused(true)}
          onTouchEnd={() => setTouchPaused(false)}
        >
          {/* Top & Bottom Cinematic Fade Masks */}
          <div className="absolute top-0 left-0 right-0 h-16 sm:h-24 bg-gradient-to-b from-slate-50/95 via-slate-50/60 to-transparent z-20 pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-16 sm:h-24 bg-gradient-to-t from-slate-50/95 via-slate-50/60 to-transparent z-20 pointer-events-none" />

          {/* Dual Column Grid Container (Height restricted for smooth vertical infinite scrolling) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 h-[620px] overflow-hidden relative">
            {/* ── LEFT COLUMN: UPWARD (↑ ↑ ↑) ── */}
            <div className="relative overflow-hidden h-full">
              {/* Column Header Indicator */}
              <div className="absolute top-2 left-3 z-30 pointer-events-none opacity-80 sm:opacity-90">
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[#006D6A] shadow-sm border border-[#006D6A]/20">
                  <ArrowUp size={11} className="animate-bounce" /> Stream A · Moving Up
                </span>
              </div>

              <div
                className={`flex flex-col gap-4 sm:gap-6 sai-marquee-col-up ${
                  isPaused || hoveredCardId !== null ? "sai-marquee-paused" : ""
                }`}
                style={{ animationDuration: "48s" }}
              >
                {/* First Set of Items */}
                {leftStream.map((p, i) => renderCard(p, "up", `l1-${i}`))}

                {/* Duplicated Seamless Set for 100% Seamless Infinite Wrapping */}
                {leftStream.map((p, i) => renderCard(p, "up", `l2-${i}`))}
              </div>
            </div>

            {/* ── RIGHT COLUMN: DOWNWARD (↓ ↓ ↓) ── */}
            <div className="relative overflow-hidden h-full">
              {/* Column Header Indicator */}
              <div className="absolute top-2 right-3 z-30 pointer-events-none opacity-80 sm:opacity-90">
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-purple-700 shadow-sm border border-purple-300">
                  <ArrowDown size={11} className="animate-bounce" /> Stream B · Moving Down
                </span>
              </div>

              <div
                className={`flex flex-col gap-4 sm:gap-6 sai-marquee-col-down ${
                  isPaused || hoveredCardId !== null ? "sai-marquee-paused" : ""
                }`}
                style={{ animationDuration: "48s" }}
              >
                {/* First Set of Items */}
                {rightStream.map((p, i) => renderCard(p, "down", `r1-${i}`))}

                {/* Duplicated Seamless Set for 100% Seamless Infinite Wrapping */}
                {rightStream.map((p, i) => renderCard(p, "down", `r2-${i}`))}
              </div>
            </div>
          </div>

          {/* Interactive Status Indicator at Bottom */}
          <div className="mt-4 pt-3 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#008F8C] animate-pulse" />
              <span>
                {properties.length} live properties synchronized with database
              </span>
            </div>

            <div className="flex items-center gap-4 text-[11px] font-medium">
              <span className="hidden sm:inline">
                ✨ Hover over any card to freeze motion and explore
              </span>
              <span className="text-slate-400">|</span>
              <span className="text-[#006D6A] font-bold">
                Smooth 60FPS GPU Marquee
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedPropertiesScroll;
