import React from "react";
import { Sparkles, MapPin, Layers } from "lucide-react";
import { WalkthroughRoom } from "./PropertyScene";

interface RoomLabelProps {
  room: WalkthroughRoom;
  propertyData?: any;
  currentIndex: number;
  totalRooms: number;
  is3DMode?: boolean;
}

export const RoomLabel: React.FC<RoomLabelProps> = ({
  room,
  propertyData,
  currentIndex,
  totalRooms,
  is3DMode = false,
}) => {
  if (room.type === "summary") return null;

  const orderFormatted = String(currentIndex + 1).padStart(2, "0");
  const totalFormatted = String(totalRooms).padStart(2, "0");

  const bhk = propertyData?.bhk || room.data?.bhk;
  const area = propertyData?.area || (propertyData?.area_sqft ? `${propertyData.area_sqft} sq.ft` : null);
  const location = propertyData?.location || `${propertyData?.locality || ""}, ${propertyData?.city || ""}`.replace(/^, |, $/g, "");

  // Safe subtitle/description without hallucination
  const getSafeSubtitle = () => {
    if (room.data?.subtitle) return room.data.subtitle;
    if (room.type === "exterior") return propertyData?.title || "Property Elevation";
    if (room.type === "entrance") return "Welcome Home • Main Entrance & Foyer";
    if (room.type === "living_room") return "Spacious Living Area & Lounge";
    if (room.type === "dining") return "Dedicated Dining Space";
    if (room.type === "kitchen") return "Kitchen & Utility Area";
    if (room.type === "bedroom") return room.name === "Master Bedroom" ? "Private Relaxation Space" : `${room.name} Sleeping Area`;
    if (room.type === "bathroom") return "Sanitary & Bath Fixtures";
    if (room.type === "balcony") return "Outdoor Balcony & View";
    if (room.type === "amenities") return "Resident Lifestyle Amenities";
    if (room.type === "location") return location || "Neighborhood Connectivity";
    return room.name;
  };

  const isIllustrative = is3DMode || !room.has_actual_image;

  return (
    <div className="absolute bottom-6 left-6 z-20 max-w-[85vw] sm:max-w-md pointer-events-none select-none">
      <div className="sai-walkthrough-glass px-5 py-4 rounded-2xl border border-white/20 shadow-2xl backdrop-blur-xl">
        {/* Top Mini Header */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-teal-300">
            <Sparkles className="w-3 h-3 text-teal-400" />
            <span>SAI VIRTUAL TOUR</span>
          </div>

          {isIllustrative ? (
            <span className="text-[9px] uppercase font-bold text-amber-300 px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/30">
              Illustrative Visualization
            </span>
          ) : (
            <span className="text-[9px] uppercase font-bold text-emerald-300 px-2 py-0.5 rounded bg-emerald-400/10 border border-emerald-400/30">
              Verified Media
            </span>
          )}
        </div>

        {/* Room Title in Uppercase Bold */}
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-wider uppercase drop-shadow-md">
          {room.name}
        </h2>

        {/* Accent divider line */}
        <div className="w-16 h-1 bg-gradient-to-r from-teal-400 to-emerald-400 rounded-full my-1.5 shadow-[0_0_8px_rgba(45,212,191,0.6)]" />

        {/* Property Specs Pill & Subtitle */}
        <div className="flex flex-wrap items-center gap-2 mb-1">
          {bhk && (
            <span className="text-xs font-bold text-white bg-white/10 px-2 py-0.5 rounded">
              {bhk} BHK
            </span>
          )}
          {area && (
            <span className="text-xs font-semibold text-slate-300">
              • {area}
            </span>
          )}
          {room.data?.dimensions && (
            <span className="text-xs font-mono text-teal-200">
              • {room.data.dimensions}
            </span>
          )}
        </div>

        <p className="text-teal-100/90 text-xs sm:text-sm font-medium leading-relaxed drop-shadow">
          {getSafeSubtitle()}
        </p>

        {/* Progress Counter Pill */}
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/10 text-[11px] font-mono font-bold text-teal-300">
          <span className="px-2 py-0.5 rounded bg-teal-500/20 border border-teal-400/30">
            {orderFormatted} / {totalFormatted}
          </span>
          {location && (
            <span className="text-slate-400 font-sans font-medium truncate max-w-[200px]">
              • {location}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
