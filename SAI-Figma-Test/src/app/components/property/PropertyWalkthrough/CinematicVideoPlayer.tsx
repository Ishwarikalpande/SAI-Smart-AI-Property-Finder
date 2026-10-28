import React, { useState, useEffect } from "react";
import { WalkthroughRoom } from "./PropertyScene";
import { Sparkles, Sun, Eye } from "lucide-react";

interface CinematicVideoPlayerProps {
  room: WalkthroughRoom;
  cleanImageUrl: string;
  isReducedMotion?: boolean;
  onImageLoaded?: () => void;
  onImageError?: () => void;
}

export const CinematicVideoPlayer: React.FC<CinematicVideoPlayerProps> = ({
  room,
  cleanImageUrl,
  isReducedMotion = false,
  onImageLoaded,
  onImageError,
}) => {
  const [loaded, setLoaded] = useState<boolean>(false);

  useEffect(() => {
    setLoaded(false);
  }, [cleanImageUrl]);

  // Determine room-specific camera path animation class
  const getCameraPathClass = (type: string, name: string) => {
    if (isReducedMotion) return "sai-cinematic-static";
    switch (type) {
      case "exterior":
        return "sai-camera-zoom-building";
      case "entrance":
        return "sai-camera-zoom-forward";
      case "living_room":
        return "sai-camera-pan-lr";
      case "kitchen":
        return "sai-camera-zoom-kitchen";
      case "bedroom":
        return name.toLowerCase().includes("master")
          ? "sai-camera-pan-horizontal"
          : "sai-camera-drift";
      case "bathroom":
        return "sai-camera-push";
      case "balcony":
        return "sai-camera-pan-up";
      default:
        return "sai-cinematic-zoom-pan1";
    }
  };

  const cameraPathClass = getCameraPathClass(room.type, room.name);

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950 flex items-center justify-center select-none">
      {/* 1. Background Ambient Glow Layer (Moving light behind main frame) */}
      <div className="absolute inset-0 bg-gradient-to-tr from-teal-900/30 via-slate-950 to-amber-900/20 pointer-events-none" />

      {/* 2. Midground: The Actual Property Image with Camera Path Movement */}
      <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
        <img
          key={cleanImageUrl}
          src={cleanImageUrl}
          alt={room.name}
          onLoad={() => {
            setLoaded(true);
            onImageLoaded?.();
          }}
          onError={() => {
            onImageError?.();
          }}
          className={`w-full h-full object-cover will-change-transform ${cameraPathClass} transition-opacity duration-700 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        />
      </div>

      {/* 3. Foreground Depth Parallax Layer (Architectural framing & light bloom) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
        {/* Subtle moving cinematic light ray / lens bloom */}
        <div
          className={`absolute -top-20 -left-20 w-96 h-96 rounded-full bg-teal-400/10 blur-3xl pointer-events-none transition-transform duration-1000 ${
            loaded ? "translate-x-12 translate-y-8" : "translate-x-0"
          }`}
        />

        {/* Foreground Glass Reflection Streak */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />

        {/* Cinematic Vignette */}
        <div className="sai-walkthrough-vignette" />
        <div className="sai-walkthrough-gradient-top" />
        <div className="sai-walkthrough-gradient-bottom" />
      </div>

      {/* 4. Loading indicator while high-res image buffers */}
      {!loaded && (
        <div className="absolute inset-0 bg-[#091522] flex items-center justify-center z-20">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-bold animate-pulse shadow-lg backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-teal-300" />
            Loading {room.name}...
          </div>
        </div>
      )}

      {/* 5. Factual Mode Badge (Top-left) */}
      <div className="absolute top-4 left-6 z-20 pointer-events-none">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/85 border border-teal-400/40 text-teal-300 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-lg">
          <Eye className="w-3 h-3 text-teal-300" />
          <span>Actual Property Photograph • Camera Motion</span>
        </div>
      </div>
    </div>
  );
};
