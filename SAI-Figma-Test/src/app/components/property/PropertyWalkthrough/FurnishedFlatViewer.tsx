import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
  Sparkles,
  ArrowRight,
  X,
  Compass,
  Eye,
  EyeOff,
  RefreshCw,
  Info,
  CheckCircle2
} from "lucide-react";
import { FurnishedRoom, RoomHotspot, FurnitureItem } from "./furnishedFlatData";

interface FurnishedFlatViewerProps {
  room: FurnishedRoom;
  onNavigateRoom: (roomId: string) => void;
  onSelectHotspotItem?: (item: FurnitureItem) => void;
  isFloorPlanOpen?: boolean;
  onToggleFloorPlan?: () => void;
}

export const FurnishedFlatViewer: React.FC<FurnishedFlatViewerProps> = ({
  room,
  onNavigateRoom,
  onSelectHotspotItem,
  isFloorPlanOpen,
  onToggleFloorPlan,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageWrapperRef = useRef<HTMLDivElement>(null);

  // High-performance Zoom & Pan State
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const initialPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Touch Pinch Zoom Tracking
  const pinchStartDistRef = useRef<number | null>(null);
  const initialZoomRef = useRef<number>(1);

  // Loading & Error States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [currentSrc, setCurrentSrc] = useState<string>(room.primaryImageUrl);
  const [retryCount, setRetryCount] = useState<number>(0);

  // Active Hotspot & Display Toggles
  const [activeHotspot, setActiveHotspot] = useState<RoomHotspot | null>(null);
  const [showHotspots, setShowHotspots] = useState<boolean>(true);

  // Reset zoom, pan and load image when room changes
  useEffect(() => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    setIsLoading(true);
    setHasError(false);
    setActiveHotspot(null);
    setCurrentSrc(room.primaryImageUrl);
  }, [room.id, room.primaryImageUrl]);

  // Image load success handler
  const handleImageLoaded = () => {
    setIsLoading(false);
    setHasError(false);
  };

  // Image load error fallback handler
  const handleImageError = () => {
    if (room.fallbackImageUrl && currentSrc !== room.fallbackImageUrl) {
      // Try high-resolution CDN fallback
      console.warn(`Primary image failed for ${room.id}, trying fallback CDN`);
      setCurrentSrc(room.fallbackImageUrl);
    } else {
      setIsLoading(false);
      setHasError(true);
    }
  };

  // Zoom Controls
  const handleZoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(2.5, +(prev + 0.25).toFixed(2)));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel((prev) => {
      const next = Math.max(1, +(prev - 0.25).toFixed(2));
      if (next === 1) setPanOffset({ x: 0, y: 0 });
      return next;
    });
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  // Mouse Wheel Zoom
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoomLevel((prev) => Math.min(2.5, +(prev + 0.15).toFixed(2)));
    } else {
      setZoomLevel((prev) => {
        const next = Math.max(1, +(prev - 0.15).toFixed(2));
        if (next === 1) setPanOffset({ x: 0, y: 0 });
        return next;
      });
    }
  };

  // Mouse / Touch Drag to Pan
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    if (zoomLevel <= 1) return; // Only pan when zoomed in

    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    initialPanRef.current = { ...panOffset };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || zoomLevel <= 1) return;

    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    // Constrain pan within boundary
    const maxPanX = (zoomLevel - 1) * 350;
    const maxPanY = (zoomLevel - 1) * 200;

    const newX = Math.max(-maxPanX, Math.min(maxPanX, initialPanRef.current.x + dx));
    const newY = Math.max(-maxPanY, Math.min(maxPanY, initialPanRef.current.y + dy));

    setPanOffset({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  // Touch Pinch to Zoom on Mobile
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      pinchStartDistRef.current = dist;
      initialZoomRef.current = zoomLevel;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && pinchStartDistRef.current !== null) {
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const scale = currentDist / pinchStartDistRef.current;
      const targetZoom = Math.max(1, Math.min(2.5, +(initialZoomRef.current * scale).toFixed(2)));
      setZoomLevel(targetZoom);
      if (targetZoom === 1) setPanOffset({ x: 0, y: 0 });
    }
  };

  const handleTouchEnd = () => {
    pinchStartDistRef.current = null;
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (["input", "textarea"].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) return;

      if (e.key === "+" || e.key === "=") {
        handleZoomIn();
      } else if (e.key === "-" || e.key === "_") {
        handleZoomOut();
      } else if (e.key === "r" || e.key === "R") {
        handleResetZoom();
      } else if (e.key === "h" || e.key === "H") {
        setShowHotspots((v) => !v);
      } else if (e.key === "Escape") {
        setActiveHotspot(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleZoomIn, handleZoomOut, handleResetZoom]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full select-none overflow-hidden bg-slate-950 flex items-center justify-center ${
        zoomLevel > 1 ? (isDragging ? "cursor-grabbing" : "cursor-grab") : "cursor-default"
      }`}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* ─────────────────────────────────────────────────────────────
          1. MAIN ROOM IMAGE CANVAS WRAPPER (With GPU Zoom/Pan)
      ───────────────────────────────────────────────────────────── */}
      <div
        ref={imageWrapperRef}
        className="relative w-full h-full flex items-center justify-center transition-transform duration-100 ease-out will-change-transform"
        style={{
          transform: `translate3d(${panOffset.x}px, ${panOffset.y}px, 0) scale(${zoomLevel})`,
        }}
      >
        {/* Main High-Definition Room Photo */}
        <img
          key={`${room.id}-${currentSrc}-${retryCount}`}
          src={currentSrc}
          alt={room.name}
          onLoad={handleImageLoaded}
          onError={handleImageError}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoading ? "opacity-0" : "opacity-100"
          }`}
          draggable={false}
        />

        {/* ─────────────────────────────────────────────────────────────
            2. INTERACTIVE FURNITURE & PORTAL HOTSPOTS OVERLAY
        ───────────────────────────────────────────────────────────── */}
        {showHotspots && !isLoading && !hasError && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {room.hotspots.map((hs) => {
              const isDoorway = hs.type === "doorway";

              return (
                <div
                  key={hs.id}
                  style={{ left: `${hs.x}%`, top: `${hs.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto transition-transform duration-150 hover:scale-110 z-20"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isDoorway && hs.targetRoomId) {
                      onNavigateRoom(hs.targetRoomId);
                    } else {
                      setActiveHotspot(hs);
                      if (hs.furnitureItem && onSelectHotspotItem) {
                        onSelectHotspotItem(hs.furnitureItem);
                      }
                    }
                  }}
                >
                  {isDoorway ? (
                    // Doorway Navigation Portal Button
                    <button
                      className="group/portal flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 hover:bg-teal-600 text-white font-bold text-xs shadow-[0_0_20px_rgba(20,184,166,0.6)] border border-teal-400/80 backdrop-blur-md transition-all active:scale-95 cursor-pointer animate-pulse duration-1000"
                      title={hs.label}
                    >
                      <span className="w-2 h-2 rounded-full bg-teal-300 animate-ping" />
                      <span className="tracking-wide text-[11px] whitespace-nowrap">{hs.label}</span>
                      <ArrowRight size={13} className="text-teal-200 group-hover/portal:translate-x-0.5 transition-transform" />
                    </button>
                  ) : (
                    // Furniture Specification Hotspot Pin
                    <div className="group/hotspot relative flex items-center justify-center cursor-pointer">
                      {/* Outer Glow Pulse */}
                      <span className="absolute w-9 h-9 rounded-full bg-teal-400/30 animate-ping pointer-events-none" />
                      {/* Inner Circular Pin */}
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-teal-600 to-emerald-400 text-slate-950 flex items-center justify-center shadow-[0_0_16px_rgba(20,184,166,0.8)] border-2 border-white active:scale-90 transition-transform">
                        <Sparkles size={13} className="fill-slate-950 text-slate-950" />
                      </div>
                      {/* Hover Tooltip Label */}
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 opacity-0 group-hover/hotspot:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30">
                        <div className="px-2.5 py-1 rounded-lg bg-slate-900/95 text-teal-200 font-bold text-[11px] border border-teal-400/40 shadow-xl backdrop-blur-sm flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          {hs.label}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. SMOOTH LOADING SCREEN SKELETON
      ───────────────────────────────────────────────────────────── */}
      {isLoading && (
        <div className="absolute inset-0 z-30 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center transition-opacity duration-300 pointer-events-none">
          <div className="w-14 h-14 relative flex items-center justify-center mb-3">
            <div className="absolute inset-0 rounded-full border-4 border-teal-500/20 border-t-teal-400 animate-spin" />
            <Compass className="w-6 h-6 text-teal-300 animate-pulse" />
          </div>
          <p className="text-white font-bold text-sm tracking-wide">
            Loading {room.name}...
          </p>
          <p className="text-teal-300/80 text-xs mt-1">High-Resolution Furnished Staging</p>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. GRACEFUL IMAGE ERROR FALLBACK (Never remains blank)
      ───────────────────────────────────────────────────────────── */}
      {hasError && (
        <div className="absolute inset-0 z-30 bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mb-4">
            <Info size={32} />
          </div>
          <h3 className="text-lg font-black mb-1">{room.name} Asset Loading</h3>
          <p className="text-slate-300 text-xs max-w-md mb-4 leading-relaxed">
            The high-resolution demonstration visual for this space is temporarily unavailable. Click retry to refresh the asset.
          </p>
          <button
            onClick={() => {
              setHasError(false);
              setIsLoading(true);
              setRetryCount((c) => c + 1);
            }}
            className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all shadow-md cursor-pointer"
          >
            <RefreshCw size={14} />
            <span>Reload Room</span>
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          5. SELECTED FURNITURE HOTSPOT DETAIL POPOVER DRAWER
      ───────────────────────────────────────────────────────────── */}
      {activeHotspot && !activeHotspot.targetRoomId && (
        <div
          className="absolute z-40 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 sm:w-96 rounded-2xl bg-slate-900/95 border border-teal-500/40 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.8)] p-5 text-white pointer-events-auto animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-700/60">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center">
                <Sparkles size={14} />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">{activeHotspot.label}</h4>
                <p className="text-[10px] text-teal-300 font-mono uppercase tracking-wider">Furnished Specification</p>
              </div>
            </div>
            <button
              onClick={() => setActiveHotspot(null)}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          <div className="py-3 space-y-2 text-xs">
            <p className="text-slate-300 leading-relaxed">
              {activeHotspot.details || "High-specification furnishing installed with premium materials and ergonomic finishes."}
            </p>

            {activeHotspot.furnitureItem && (
              <div className="mt-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Dimensions:</span>
                  <span className="text-teal-200 font-semibold">{activeHotspot.furnitureItem.dimensions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Material:</span>
                  <span className="text-teal-200 font-semibold">{activeHotspot.furnitureItem.material}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Finish:</span>
                  <span className="text-teal-200 font-semibold">{activeHotspot.furnitureItem.brandOrFinish}</span>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={() => setActiveHotspot(null)}
              className="px-3.5 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs active:scale-95 transition-all cursor-pointer"
            >
              Close Spec
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          6. FLOATING ON-SCREEN CONTROLS (Right Edge)
      ───────────────────────────────────────────────────────────── */}
      <div
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-2 pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleZoomIn}
          className="w-10 h-10 rounded-xl bg-slate-900/85 hover:bg-slate-800 border border-teal-500/40 text-teal-200 hover:text-white flex items-center justify-center backdrop-blur-md shadow-lg transition-all active:scale-90 cursor-pointer"
          title="Zoom In (+)"
        >
          <ZoomIn size={18} />
        </button>
        <button
          onClick={handleZoomOut}
          className="w-10 h-10 rounded-xl bg-slate-900/85 hover:bg-slate-800 border border-teal-500/40 text-teal-200 hover:text-white flex items-center justify-center backdrop-blur-md shadow-lg transition-all active:scale-90 cursor-pointer"
          title="Zoom Out (-)"
        >
          <ZoomOut size={18} />
        </button>
        {zoomLevel > 1 && (
          <button
            onClick={handleResetZoom}
            className="w-10 h-10 rounded-xl bg-slate-900/85 hover:bg-slate-800 border border-teal-500/40 text-teal-200 hover:text-white flex items-center justify-center backdrop-blur-md shadow-lg transition-all active:scale-90 cursor-pointer"
            title="Reset Zoom (R)"
          >
            <RotateCcw size={18} />
          </button>
        )}
        <button
          onClick={() => setShowHotspots((v) => !v)}
          className={`w-10 h-10 rounded-xl border flex items-center justify-center backdrop-blur-md shadow-lg transition-all active:scale-90 cursor-pointer ${
            showHotspots
              ? "bg-slate-900/85 hover:bg-slate-800 border-teal-500/40 text-teal-300"
              : "bg-slate-800/60 border-slate-700 text-slate-400"
          }`}
          title={showHotspots ? "Hide Hotspots (H)" : "Show Hotspots (H)"}
        >
          {showHotspots ? <Eye size={18} /> : <EyeOff size={18} />}
        </button>

        {onToggleFloorPlan && (
          <button
            onClick={onToggleFloorPlan}
            className={`w-10 h-10 rounded-xl border flex items-center justify-center backdrop-blur-md shadow-lg transition-all active:scale-90 cursor-pointer ${
              isFloorPlanOpen
                ? "bg-teal-500 border-teal-300 text-slate-950 font-bold"
                : "bg-slate-900/85 hover:bg-slate-800 border-teal-500/40 text-teal-200 hover:text-white"
            }`}
            title="Toggle Floor Plan"
          >
            <Layers size={18} />
          </button>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          7. ASSET TRANSPARENCY BADGE (Top Left of Viewer)
      ───────────────────────────────────────────────────────────── */}
      <div className="absolute top-4 left-4 z-20 pointer-events-auto">
        <div className="px-3 py-1.5 rounded-xl bg-slate-900/85 border border-teal-500/40 backdrop-blur-md text-white flex items-center gap-2 shadow-lg">
          {room.isVerifiedActualPhoto ? (
            <>
              <CheckCircle2 size={13} className="text-teal-400" />
              <span className="text-[11px] font-bold text-teal-200">Verified Property Asset</span>
            </>
          ) : (
            <>
              <Sparkles size={13} className="text-teal-400" />
              <span className="text-[11px] font-bold text-teal-200">Sample Staging • Furnished Flat</span>
            </>
          )}
          <span className="text-slate-500">•</span>
          <span className="text-[11px] text-slate-300 font-mono">{room.dimensions}</span>
          <span className="text-slate-500">•</span>
          <span className="text-[11px] text-teal-300 font-mono">{room.carpetAreaSqft} sq.ft</span>
        </div>
      </div>

      {/* Zoom Indicator when zoomed */}
      {zoomLevel > 1 && (
        <div className="absolute top-4 right-16 z-20 pointer-events-none">
          <div className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur border border-teal-500/30 text-teal-300 font-mono text-[11px] font-bold shadow">
            {Math.round(zoomLevel * 100)}% Zoom • Drag to Pan
          </div>
        </div>
      )}
    </div>
  );
};

export default FurnishedFlatViewer;
