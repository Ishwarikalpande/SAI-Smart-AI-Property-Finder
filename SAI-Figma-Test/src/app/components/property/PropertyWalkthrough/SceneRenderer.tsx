import React, { useState, useEffect } from "react";
import {
  Building2,
  PhoneCall,
  ArrowRight,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  MapPin,
  Maximize2,
  RotateCcw,
  Sparkles,
  Info,
  Car,
} from "lucide-react";
import { WalkthroughScene } from "./PropertyScene";
import { PropertyInfoOverlay } from "./PropertyInfoOverlay";
import { AmenityScene } from "./AmenityScene";
import { LocationScene } from "./LocationScene";
import { RoomSceneView } from "./RoomSceneView";
import { getMediaUrl } from "./walkthroughUtils";

interface SceneRendererProps {
  scene: WalkthroughScene;
  index: number;
  totalScenes: number;
  onContactClick?: () => void;
  onDetailsClick?: () => void;
  onScheduleVisitClick?: () => void;
  onRestart?: () => void;
  isReducedMotion?: boolean;
}

export const SceneRenderer: React.FC<SceneRendererProps> = ({
  scene,
  index,
  totalScenes,
  onContactClick,
  onDetailsClick,
  onScheduleVisitClick,
  onRestart,
  isReducedMotion = false,
}) => {
  const data = scene.data || {};
  const rawImageUrl = scene.image_url;
  const cleanImageUrl = getMediaUrl(rawImageUrl);

  const [imageError, setImageError] = useState<boolean>(false);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);

  // Reset image state whenever the scene changes
  useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
  }, [scene.id, rawImageUrl]);

  const hasValidImage = Boolean(cleanImageUrl) && !imageError;

  // Alternate between smooth camera Ken Burns keyframes
  const cameraAnimClass = isReducedMotion
    ? "sai-cinematic-static"
    : index % 2 === 0
    ? "sai-cinematic-zoom-pan1"
    : "sai-cinematic-zoom-pan2";

  // ── 1. AMENITIES SCENE ──────────────────────────────────────────────────
  if (scene.id === "amenities" && Array.isArray(data.amenities) && data.amenities.length > 0) {
    return (
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        {hasValidImage ? (
          <img
            src={cleanImageUrl!}
            alt="Amenities Overview"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            className={`absolute inset-0 w-full h-full object-cover opacity-20 filter blur-xs ${cameraAnimClass}`}
          />
        ) : (
          <div className="absolute inset-0 sai-blueprint-pattern opacity-95" />
        )}
        <div className="relative z-20 w-full">
          <AmenityScene
            amenities={data.amenities}
            subtitle={scene.subtitle}
            hasParking={data.has_parking}
          />
        </div>
      </div>
    );
  }

  // ── 2. LOCATION SCENE ───────────────────────────────────────────────────
  if (scene.id === "location") {
    return (
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        {hasValidImage ? (
          <img
            src={cleanImageUrl!}
            alt="Location Overview"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            className={`absolute inset-0 w-full h-full object-cover opacity-20 filter blur-xs ${cameraAnimClass}`}
          />
        ) : (
          <div className="absolute inset-0 sai-blueprint-pattern opacity-95" />
        )}
        <div className="relative z-20 w-full">
          <LocationScene
            city={data.city || "Urban Center"}
            locality={data.locality || "Central Location"}
            address={data.address}
            state={data.state}
            pincode={data.pincode}
            latitude={data.latitude}
            longitude={data.longitude}
            distMetro={data.dist_metro}
          />
        </div>
      </div>
    );
  }

  // ── 3. SUMMARY SCENE ────────────────────────────────────────────────────
  if (scene.id === "summary") {
    return (
      <div className="relative w-full h-full flex items-center justify-center px-4 py-8 z-20 overflow-hidden">
        {hasValidImage ? (
          <img
            src={cleanImageUrl!}
            alt="Property Showcase"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            className={`absolute inset-0 w-full h-full object-cover opacity-35 filter blur-xs ${cameraAnimClass}`}
          />
        ) : (
          <div className="absolute inset-0 sai-blueprint-pattern opacity-95" />
        )}

        <div className="relative z-20 sai-walkthrough-glass p-6 sm:p-8 rounded-3xl max-w-xl w-full text-center border border-white/20 shadow-2xl sai-animate-scale-in">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/25 border border-teal-400/40 text-teal-300 text-xs font-semibold uppercase tracking-wider mb-3">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Tour Complete
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
            {data.title || "Your Future Home Awaits"}
          </h2>

          <p className="text-slate-300 text-sm mb-5 flex items-center justify-center gap-1.5">
            <MapPin className="w-4 h-4 text-teal-400" />
            {data.location || `${data.locality || ""}, ${data.city || ""}`}
          </p>

          {/* Quick Metrics Recap */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-6 text-left">
            {data.price && (
              <div className="p-3 rounded-xl bg-teal-500/20 border border-teal-400/30">
                <div className="text-[10px] text-teal-200 uppercase font-semibold">Price</div>
                <div className="text-base sm:text-lg font-bold text-white">{data.price}</div>
              </div>
            )}
            {data.area && (
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Area</div>
                <div className="text-sm sm:text-base font-semibold text-slate-100">{data.area}</div>
              </div>
            )}
            {data.bhk && (
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Configuration</div>
                <div className="text-sm sm:text-base font-semibold text-slate-100">{data.bhk} BHK</div>
              </div>
            )}
            {data.has_parking && (
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Parking</div>
                <div className="text-sm sm:text-base font-semibold text-emerald-300">Dedicated</div>
              </div>
            )}
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
            {onRestart && (
              <button
                onClick={onRestart}
                className="w-full sm:w-auto px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm flex items-center justify-center gap-2 border border-white/20 transition-all active:scale-95 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-teal-300" />
                <span>Replay Tour</span>
              </button>
            )}

            {onContactClick && (
              <button
                onClick={onContactClick}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Contact Owner / Agent</span>
              </button>
            )}

            {onDetailsClick && (
              <button
                onClick={onDetailsClick}
                className="w-full sm:w-auto px-4 py-3 rounded-xl bg-transparent hover:bg-white/10 text-slate-200 font-medium text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span>View Property Details</span>
                <ArrowRight className="w-4 h-4 text-teal-400" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── 4. STRUCTURED ROOM SCENES (Living Room, Kitchen, Bedrooms, Bathrooms, Balcony)
  const isRoom = ["living_room", "kitchen", "bedroom", "bathroom", "balcony"].some(k => scene.id.includes(k));
  if (isRoom) {
    return (
      <RoomSceneView
        scene={scene}
        index={index}
        cleanImageUrl={cleanImageUrl}
        hasValidImage={hasValidImage}
        cameraAnimClass={cameraAnimClass}
        isReducedMotion={isReducedMotion}
        onImageLoaded={() => setImageLoaded(true)}
        onImageError={() => setImageError(true)}
      />
    );
  }

  // ── 5. EXTERIOR / HIGHLIGHTS SCENES ─────────────────────────────────────
  return (
    <div className="relative w-full h-full flex flex-col justify-end p-4 sm:p-8 z-20 overflow-hidden">
      {/* Background Image OR Professional Architectural Fallback */}
      {hasValidImage ? (
        <img
          key={cleanImageUrl}
          src={cleanImageUrl!}
          alt={scene.title}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          className={`absolute inset-0 w-full h-full object-cover ${cameraAnimClass}`}
        />
      ) : (
        <div className="absolute inset-0 sai-blueprint-pattern flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="w-20 h-20 rounded-2xl bg-teal-900/35 border border-teal-500/40 flex items-center justify-center mb-3 shadow-inner">
            <Building2 className="w-10 h-10 text-teal-300 stroke-[1.5]" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 border border-teal-500/40 text-teal-300 text-xs font-semibold mb-2 shadow-lg">
            <Info className="w-3.5 h-3.5" />
            Property Image Unavailable
          </div>
          <p className="text-slate-300 text-xs max-w-sm">
            Visual presentation rendered directly from verified property specifications.
          </p>
        </div>
      )}

      {/* Floating Property Information Overlay */}
      <div className="w-full z-20 pointer-events-auto">
        <PropertyInfoOverlay
          sceneType={scene.title || (scene.id === "exterior" ? "Exterior" : "Property View")}
          title={
            data.title ||
            (scene.id === "exterior"
              ? (data.bhk_display ? `${data.bhk_display} ${data.property_type || "Apartment"}` : "Discover Your New Home")
              : (data.label || scene.title))
          }
          subtitle={
            scene.subtitle ||
            [data.city || data.location, data.area, data.price].filter(Boolean).join(" • ")
          }
          bhk={data.bhk || (data.count as number)}
          area={data.area}
          price={data.price}
          location={data.location}
          furnishing={data.furnishing}
          badge={data.badge}
          isVerified={data.is_verified}
          isRera={data.is_rera}
          features={data.features}
        />
      </div>
    </div>
  );
};
