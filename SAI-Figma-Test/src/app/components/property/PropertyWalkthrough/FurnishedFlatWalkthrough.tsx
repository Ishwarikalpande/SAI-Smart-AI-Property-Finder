import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  X,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Home,
  Layers,
  Sparkles,
  Phone,
  Calendar,
  Check,
  Building2,
  Compass,
  AlertCircle,
  Box
} from "lucide-react";
import { WalkthroughProps } from "./PropertyScene";
import { buildFurnishedFlatTour, FurnishedRoom, FurnitureItem } from "./furnishedFlatData";
import { FurnishedFlatViewer } from "./FurnishedFlatViewer";
import { FurnishedFloorPlanModal } from "./FurnishedFloorPlanModal";
import { Property3DTour } from "../propertyTour3D";

export const FurnishedFlatWalkthrough: React.FC<WalkthroughProps> = ({
  propertyId,
  propertyTitle,
  property,
  initialWalkthrough,
  isOpen = true,
  isModal = true,
  onClose,
  onContactClick,
  onScheduleVisitClick,
  className = ""
}) => {
  if (!isOpen) return null;

  // Build the complete fully furnished flat tour using real property metadata
  const tourData = useMemo(() => {
    return buildFurnishedFlatTour(Number(propertyId) || 1, property, initialWalkthrough);
  }, [propertyId, property, initialWalkthrough]);

  // Active viewing mode: "360-panorama" (photorealistic furnished flat) vs "3d-structural" (Three.js wireframe/model)
  const [viewMode, setViewMode] = useState<"360-panorama" | "3d-structural">("360-panorama");

  // Current room in the walkthrough sequence
  const [currentRoomIndex, setCurrentRoomIndex] = useState<number>(() => {
    // Default to Living Room if available, else first room (Entrance)
    const livingIdx = tourData.rooms.findIndex((r) => r.id === "living-room");
    return livingIdx >= 0 ? livingIdx : 0;
  });

  // Visited rooms tracker
  const [visitedRoomIds, setVisitedRoomIds] = useState<Set<string>>(() => new Set(["living-room", "entrance"]));

  // Floor plan overlay state
  const [isFloorPlanOpen, setIsFloorPlanOpen] = useState<boolean>(false);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Selected Furniture specification modal/drawer
  const [selectedFurniture, setSelectedFurniture] = useState<FurnitureItem | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const thumbnailStripRef = useRef<HTMLDivElement>(null);

  const currentRoom: FurnishedRoom | undefined = tourData.rooms[currentRoomIndex] || tourData.rooms[0];

  // Auto-scroll the thumbnail strip to keep active room centered
  useEffect(() => {
    if (!thumbnailStripRef.current) return;
    const activeEl = thumbnailStripRef.current.children[currentRoomIndex] as HTMLElement;
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [currentRoomIndex]);

  // Navigate to a room by its ID
  const navigateToRoomId = useCallback((roomId: string) => {
    const idx = tourData.rooms.findIndex((r) => r.id === roomId);
    if (idx >= 0) {
      setCurrentRoomIndex(idx);
      setVisitedRoomIds((prev) => new Set([...prev, roomId]));
    }
  }, [tourData.rooms]);

  // Step to Next Room in sequence: Entrance → Living → Dining → Kitchen → Master Bed → Bed 2 → Attached Bath → Common Bath → Balcony
  const handleNextRoom = useCallback(() => {
    setCurrentRoomIndex((prev) => {
      const next = (prev + 1) % tourData.rooms.length;
      const targetRoom = tourData.rooms[next];
      if (targetRoom) setVisitedRoomIds((v) => new Set([...v, targetRoom.id]));
      return next;
    });
  }, [tourData.rooms]);

  // Step to Previous Room in sequence
  const handlePrevRoom = useCallback(() => {
    setCurrentRoomIndex((prev) => {
      const prevIdx = (prev - 1 + tourData.rooms.length) % tourData.rooms.length;
      const targetRoom = tourData.rooms[prevIdx];
      if (targetRoom) setVisitedRoomIds((v) => new Set([...v, targetRoom.id]));
      return prevIdx;
    });
  }, [tourData.rooms]);

  // Return to Living Room quick action
  const handleReturnToLiving = useCallback(() => {
    navigateToRoomId("living-room");
  }, [navigateToRoomId]);

  // Fullscreen toggle via HTML5 Fullscreen API
  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  // Keyboard navigation for room steps
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "PageDown" || e.key === "n" || e.key === "N") {
        handleNextRoom();
      } else if (e.key === "PageUp" || e.key === "p" || e.key === "P") {
        handlePrevRoom();
      } else if (e.key === "h" || e.key === "H") {
        handleReturnToLiving();
      } else if (e.key === "m" || e.key === "M") {
        setIsFloorPlanOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNextRoom, handlePrevRoom, handleReturnToLiving]);

  // If the selected property is a plot or unbuilt land with no walkthrough assets
  if (!tourData.isWalkthroughAvailable || tourData.rooms.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-teal-500/30 rounded-3xl p-6 sm:p-8 text-center text-white shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-teal-500/20 text-teal-300 flex items-center justify-center mx-auto mb-4 border border-teal-500/40">
            <AlertCircle size={28} />
          </div>
          <h3 className="text-xl font-black mb-2">{tourData.propertyTitle}</h3>
          <p className="text-teal-200 text-xs font-mono mb-4">{tourData.bhkDisplay} • {tourData.location}</p>
          <p className="text-slate-300 text-sm leading-relaxed mb-6">
            A 3D virtual walkthrough is currently unavailable for this property type ({tourData.bhkDisplay}). Complete layout drawings and site photos are available upon request.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            {onContactClick && (
              <button
                onClick={onContactClick}
                className="flex-1 py-3 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <Phone size={14} /> Contact Builder
              </button>
            )}
            <button
              onClick={onClose}
              className="py-3 px-6 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs active:scale-95 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-50 flex flex-col bg-slate-950 text-white select-none overflow-hidden font-sans ${className}`}
    >
      {/* ─────────────────────────────────────────────────────────────
          1. TOP NAVIGATION BAR (Section 4 Requirements)
      ───────────────────────────────────────────────────────────── */}
      <header className="relative z-30 flex-shrink-0 h-16 sm:h-18 px-3 sm:px-6 bg-slate-950/90 border-b border-teal-500/30 backdrop-blur-xl flex items-center justify-between gap-3 shadow-md">
        {/* Left: Property Name & Configuration Data */}
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-[#004F4D] to-teal-400 text-white flex items-center justify-center shadow-[0_0_15px_rgba(20,184,166,0.5)] border border-teal-300/40 flex-shrink-0">
            <Building2 size={20} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-sm sm:text-base font-extrabold text-white truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                {tourData.propertyTitle}
              </h1>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-300 border border-teal-400/30 text-[10px] font-bold uppercase tracking-wider font-mono">
                {tourData.bhkDisplay}
              </span>
              {tourData.isRera && (
                <span className="hidden md:inline-flex px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                  RERA
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-teal-200/90 font-medium truncate mt-0.5">
              <span>{tourData.location}</span>
              <span>•</span>
              <span className="font-mono text-teal-300">{tourData.areaDisplay}</span>
              <span>•</span>
              <span className="font-bold text-white">{tourData.priceDisplay}</span>
            </div>
          </div>
        </div>

        {/* Center: Dual Mode Switcher (Furnished Walkthrough vs 3D Structure) */}
        <div className="hidden lg:flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-teal-500/30 backdrop-blur">
          <button
            onClick={() => setViewMode("360-panorama")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === "360-panorama"
                ? "bg-teal-500 text-slate-950 shadow-md font-black"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <Sparkles size={13} />
            <span>Furnished Flat Tour</span>
          </button>
          <button
            onClick={() => setViewMode("3d-structural")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === "3d-structural"
                ? "bg-teal-500 text-slate-950 shadow-md font-black"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <Box size={13} />
            <span>3D Structural Model</span>
          </button>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Floor Plan Button */}
          <button
            onClick={() => setIsFloorPlanOpen((v) => !v)}
            className={`px-2.5 sm:px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all active:scale-95 cursor-pointer ${
              isFloorPlanOpen
                ? "bg-teal-500 text-slate-950 border-teal-300"
                : "bg-white/10 hover:bg-white/20 text-teal-200 border-white/15"
            }`}
            title="Open Interactive Floor Plan"
          >
            <Layers size={15} />
            <span className="hidden sm:inline">Floor Plan</span>
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={handleToggleFullscreen}
            className="p-2 sm:p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white border border-white/15 transition-all active:scale-95 cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>

          {/* Back to Property Details Button */}
          <button
            onClick={onClose}
            className="px-3 py-2 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-200 hover:text-white border border-teal-500/40 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            title="Back to Property Details"
          >
            <ChevronLeft size={16} />
            <span className="hidden sm:inline">Back to Property Details</span>
            <span className="sm:hidden">Back</span>
          </button>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-2 sm:p-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-white border border-rose-500/30 transition-all active:scale-95 cursor-pointer"
            title="Close Walkthrough"
          >
            <X size={18} />
          </button>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. MAIN VIEWING AREA (Section 4 Requirements)
      ───────────────────────────────────────────────────────────── */}
      <main className="relative flex-1 w-full h-full overflow-hidden flex items-center justify-center bg-slate-950">
        {viewMode === "360-panorama" ? (
          // A. 360° Photorealistic Fully Furnished Viewer
          <div className="relative w-full h-full">
            <FurnishedFlatViewer
              room={currentRoom}
              onNavigateRoom={navigateToRoomId}
              onSelectHotspotItem={(item) => setSelectedFurniture(item)}
              isFloorPlanOpen={isFloorPlanOpen}
              onToggleFloorPlan={() => setIsFloorPlanOpen((v) => !v)}
            />

            {/* Room Title & Description Overlay (Top Center of Viewer) */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none text-center max-w-lg px-4 hidden sm:block">
              <div className="px-4 py-2 rounded-2xl bg-slate-950/80 border border-teal-500/30 backdrop-blur-md shadow-2xl">
                <div className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                  <h2 className="text-sm font-extrabold text-white tracking-wide">
                    {currentRoom.name}
                  </h2>
                  <span className="text-[11px] font-mono text-teal-300 bg-teal-900/50 px-2 py-0.5 rounded border border-teal-500/30">
                    {currentRoom.dimensions}
                  </span>
                </div>
                <p className="text-[11px] text-teal-100/80 mt-0.5 line-clamp-1">
                  {currentRoom.subtitle}
                </p>
              </div>
            </div>

            {/* Floating Navigation Controls: Previous / Next Room Arrows */}
            <button
              onClick={handlePrevRoom}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-slate-900/85 hover:bg-slate-800 text-teal-200 hover:text-white border border-teal-500/40 backdrop-blur-md shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer pointer-events-auto"
              title={`Previous Room (${tourData.rooms[(currentRoomIndex - 1 + tourData.rooms.length) % tourData.rooms.length]?.name})`}
            >
              <ChevronLeft size={24} />
            </button>

            <button
              onClick={handleNextRoom}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-slate-900/85 hover:bg-slate-800 text-teal-200 hover:text-white border border-teal-500/40 backdrop-blur-md shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer pointer-events-auto"
              title={`Next Room (${tourData.rooms[(currentRoomIndex + 1) % tourData.rooms.length]?.name})`}
            >
              <ChevronRight size={24} />
            </button>

            {/* Floating Quick Action: "Return to Living Room" Shortcut */}
            {currentRoom.id !== "living-room" && (
              <div className="absolute top-4 right-16 sm:right-20 z-20 pointer-events-auto">
                <button
                  onClick={handleReturnToLiving}
                  className="px-3 py-1.5 rounded-xl bg-teal-500/90 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-[0_4px_16px_rgba(20,184,166,0.4)] transition-all active:scale-95 cursor-pointer"
                  title="Return to Main Living Room"
                >
                  <Home size={14} />
                  <span className="hidden sm:inline">Main Living Room</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          // B. 3D Architectural Three.js Model View
          <div className="w-full h-full relative">
            <Property3DTour
              propertyId={propertyId}
              propertyTitle={propertyTitle}
              property={property}
              initialWalkthrough={initialWalkthrough}
              isOpen={true}
              isModal={false}
              onClose={() => setViewMode("360-panorama")}
            />
          </div>
        )}
      </main>

      {/* ─────────────────────────────────────────────────────────────
          3. ROOM NAVIGATION PANEL (Bottom Thumbnails Strip - Section 4)
      ───────────────────────────────────────────────────────────── */}
      <footer className="relative z-30 flex-shrink-0 bg-slate-950/95 border-t border-teal-500/30 backdrop-blur-xl p-2.5 sm:p-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Room Thumbnails Horizontal Carousel */}
          <div
            ref={thumbnailStripRef}
            className="flex-1 flex items-center gap-2.5 overflow-x-auto scrollbar-thin scrollbar-thumb-teal-500/30 py-1 px-1 scroll-smooth"
          >
            {tourData.rooms.map((r, idx) => {
              const isActive = idx === currentRoomIndex;
              const isVisited = visitedRoomIds.has(r.id);

              return (
                <button
                  key={r.id}
                  onClick={() => {
                    setCurrentRoomIndex(idx);
                    setVisitedRoomIds((prev) => new Set([...prev, r.id]));
                  }}
                  className={`group/btn flex-shrink-0 relative rounded-xl overflow-hidden border-2 transition-all duration-200 text-left cursor-pointer w-24 sm:w-28 md:w-32 bg-slate-900 ${
                    isActive
                      ? "border-teal-400 ring-4 ring-teal-500/30 scale-105 shadow-[0_0_20px_rgba(45,212,191,0.5)] z-10"
                      : "border-slate-800 opacity-70 hover:opacity-100 hover:border-slate-600"
                  }`}
                >
                  {/* Thumbnail Image */}
                  <div className="relative h-14 sm:h-16 w-full overflow-hidden bg-slate-950">
                    <img
                      src={r.thumbnailUrl}
                      alt={r.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover/btn:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />

                    {/* Room Sequence Number Badge */}
                    <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-[9px] font-mono text-teal-300 font-bold backdrop-blur">
                      {idx + 1}
                    </span>

                    {/* Visited Checkmark */}
                    {isVisited && !isActive && (
                      <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-emerald-500/80 text-white flex items-center justify-center">
                        <Check size={10} />
                      </span>
                    )}

                    {/* Active Pulse Dot */}
                    {isActive && (
                      <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-400" />
                      </span>
                    )}
                  </div>

                  {/* Room Name Caption */}
                  <div className="p-1 sm:p-1.5 bg-slate-900/90">
                    <p
                      className={`text-[11px] font-extrabold truncate ${
                        isActive ? "text-teal-300" : "text-slate-300"
                      }`}
                    >
                      {r.shortName || r.name}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick CTA Buttons (Contact Builder / Schedule Visit) */}
          <div className="hidden xl:flex items-center gap-2 flex-shrink-0 pl-3 border-l border-slate-800">
            {onContactClick && (
              <button
                onClick={onContactClick}
                className="py-2.5 px-3.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all shadow-md cursor-pointer whitespace-nowrap"
              >
                <Phone size={13} />
                <span>Enquire Now</span>
              </button>
            )}

            {onScheduleVisitClick && (
              <button
                onClick={onScheduleVisitClick}
                className="py-2.5 px-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 border border-white/20 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
              >
                <Calendar size={13} className="text-teal-300" />
                <span>Book Site Visit</span>
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* ─────────────────────────────────────────────────────────────
          4. INTERACTIVE FLOOR PLAN OVERLAY (Section 4)
      ───────────────────────────────────────────────────────────── */}
      <FurnishedFloorPlanModal
        rooms={tourData.rooms}
        currentRoomId={currentRoom.id}
        onSelectRoom={navigateToRoomId}
        isOpen={isFloorPlanOpen}
        onClose={() => setIsFloorPlanOpen(false)}
      />
    </div>
  );
};

export default FurnishedFlatWalkthrough;
