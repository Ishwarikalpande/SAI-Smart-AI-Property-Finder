import React, { useState, useEffect } from "react";
import { WalkthroughRoom } from "./PropertyScene";
import { RoomRenderer } from "./RoomRenderer";
import { RoomLabel } from "./RoomLabel";
import { DoorTransition } from "./DoorTransition";
import {
  Film,
  Compass,
  Sparkles,
  Layers,
  X,
  Eye,
} from "lucide-react";
import { getMediaUrl } from "./walkthroughUtils";

interface RoomSceneProps {
  room: WalkthroughRoom;
  totalRooms: number;
  currentIndex: number;
  propertyData?: any;
  floorPlanUrl?: string | null;
  isReducedMotion?: boolean;
  onScheduleVisitClick?: () => void;
  onContactClick?: () => void;
  onRestart?: () => void;
}

export const RoomScene: React.FC<RoomSceneProps> = ({
  room,
  totalRooms,
  currentIndex,
  propertyData,
  floorPlanUrl,
  isReducedMotion = false,
  onScheduleVisitClick,
  onContactClick,
  onRestart,
}) => {
  // Walkthrough mode: "video" (Mode A: photo-based cinematic with parallax) or "3d" (Mode B: True 3D Walkthrough)
  const hasRealImage = Boolean(room.has_actual_image && room.image_url);
  const [viewMode, setViewMode] = useState<"video" | "3d">("video");
  const [showFloorPlan, setShowFloorPlan] = useState<boolean>(false);

  // Door transition state for entering property
  const [showDoorTransition, setShowDoorTransition] = useState<boolean>(false);
  const [doorOpen, setDoorOpen] = useState<boolean>(false);

  // Standard room entry transition state
  const [isTransitioning, setIsTransitioning] = useState<boolean>(true);

  // Trigger door opening sequence when entering living room or main door
  useEffect(() => {
    const isEnteringResidence =
      room.type === "living_room" || room.id.includes("door") || room.id.includes("entrance");

    if (isEnteringResidence && !isReducedMotion && currentIndex <= 2) {
      setShowDoorTransition(true);
      setDoorOpen(false);

      // Swing doors open after 400ms
      const openTimer = setTimeout(() => {
        setDoorOpen(true);
      }, 450);

      // Finish door transition after 1400ms
      const endTimer = setTimeout(() => {
        setShowDoorTransition(false);
      }, 1400);

      return () => {
        clearTimeout(openTimer);
        clearTimeout(endTimer);
      };
    } else {
      setShowDoorTransition(false);
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [room.id, isReducedMotion, currentIndex]);

  const cleanFloorPlan = getMediaUrl(floorPlanUrl);
  const orderFormatted = String(currentIndex + 1).padStart(2, "0");
  const totalRoomsFormatted = String(totalRooms).padStart(2, "0");

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950 flex items-center justify-center select-none">
      {/* 1. Underlying Room Renderer (Mode A: Cinematic Video or Mode B: True 3D Walkthrough) */}
      <RoomRenderer
        room={room}
        propertyData={propertyData}
        viewMode={viewMode}
        isReducedMotion={isReducedMotion}
        onScheduleVisitClick={onScheduleVisitClick}
        onContactClick={onContactClick}
        onRestart={onRestart}
      />

      {/* 2. 3D Architectural Main Door Opening Transition (Section 15 & 30) */}
      {showDoorTransition && !isReducedMotion && (
        <DoorTransition
          isOpen={doorOpen}
          targetRoomName={room.name}
          onTransitionComplete={() => setShowDoorTransition(false)}
        />
      )}

      {/* 3. Subtle Room Entering Indicator ("Entering [Room Name]...") */}
      {!showDoorTransition && isTransitioning && !isReducedMotion && (
        <div className="absolute inset-0 z-30 bg-slate-950/70 backdrop-blur-md flex flex-col items-center justify-center transition-all duration-500 animate-in fade-in zoom-in-95 pointer-events-none">
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/20 border border-teal-400/40 text-teal-300 text-xs font-bold uppercase tracking-widest mb-3">
            <Sparkles className="w-3.5 h-3.5 text-teal-300 animate-spin" />
            <span>Virtual Camera Moving</span>
          </div>

          <h3 className="text-2xl sm:text-4xl font-black text-white tracking-tight drop-shadow-2xl">
            Entering {room.name}...
          </h3>
          <p className="text-teal-200/80 text-xs sm:text-sm mt-1 font-medium font-mono">
            {orderFormatted} / {totalRoomsFormatted}
          </p>
        </div>
      )}

      {/* 4. Top Action Badges: Mode Switcher (Video vs 3D) & Floor Plan Button */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        {/* Toggle between Mode A (Cinematic Video) and Mode B (True 3D Walkthrough) */}
        <button
          onClick={() => setViewMode((prev) => (prev === "video" ? "3d" : "video"))}
          className="px-3 py-1.5 rounded-xl bg-slate-900/85 hover:bg-slate-800 text-teal-200 hover:text-white border border-teal-500/30 backdrop-blur-md text-xs font-bold flex items-center gap-1.5 shadow-xl active:scale-95 transition-all cursor-pointer"
          title="Switch between Cinematic Video and True 3D Walkthrough"
        >
          {viewMode === "video" ? (
            <>
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Switch to 3D Walkthrough</span>
              <span className="sm:hidden">3D</span>
            </>
          ) : (
            <>
              <Film className="w-3.5 h-3.5 text-teal-400" />
              <span className="hidden sm:inline">Switch to Cinematic Video</span>
              <span className="sm:hidden">Video</span>
            </>
          )}
        </button>

        {/* Floor Plan Toggle (if property has floor plan) */}
        {cleanFloorPlan && (
          <button
            onClick={() => setShowFloorPlan((prev) => !prev)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg backdrop-blur-md border active:scale-95 transition-all cursor-pointer ${
              showFloorPlan
                ? "bg-teal-500 text-slate-950 border-teal-300 font-bold"
                : "bg-slate-900/80 hover:bg-slate-800 text-teal-200 hover:text-white border-teal-500/30"
            }`}
            title="Toggle Floor Plan Panel"
          >
            <Compass className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Floor Plan</span>
          </button>
        )}
      </div>

      {/* 5. Floor Plan Panel (when toggled & available) */}
      {showFloorPlan && cleanFloorPlan && (
        <div className="absolute top-16 right-4 z-20 w-72 sm:w-80 rounded-2xl bg-slate-900/90 border-2 border-teal-400/50 shadow-2xl backdrop-blur-xl p-3 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="flex items-center justify-between pb-2 border-b border-slate-700/80 mb-2">
            <div className="flex items-center gap-1.5 text-teal-300 text-xs font-bold uppercase tracking-wider">
              <Compass className="w-3.5 h-3.5" />
              <span>Property Floor Plan</span>
            </div>
            <button
              onClick={() => setShowFloorPlan(false)}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="w-full h-44 rounded-xl overflow-hidden bg-slate-950 border border-slate-700 relative">
            <img
              src={cleanFloorPlan}
              alt="Floor Plan"
              className="w-full h-full object-contain"
            />
          </div>

          <div className="mt-2 px-2.5 py-1.5 rounded-lg bg-teal-500/20 border border-teal-400/30 flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">Active Room:</span>
            <span className="font-bold text-teal-300 uppercase tracking-wide">
              {room.name}
            </span>
          </div>
        </div>
      )}

      {/* 6. Standard Professional Room Label Overlay (Section 22) */}
      <RoomLabel
        room={room}
        propertyData={propertyData}
        currentIndex={currentIndex}
        totalRooms={totalRooms}
        is3DMode={viewMode === "3d"}
      />
    </div>
  );
};
