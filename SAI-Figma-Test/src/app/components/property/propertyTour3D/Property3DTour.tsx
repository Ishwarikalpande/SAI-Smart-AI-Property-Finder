import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Sparkles,
  AlertCircle,
  RefreshCw,
  X,
  Compass,
  CheckCircle2,
  ChevronRight,
  Eye,
  Sliders,
  Maximize2,
  Minimize2
} from "lucide-react";
import {
  Property3DTourProps,
  Property3DTourData,
  Property3DRoom
} from "./PropertyScene";
import { fetchProperty3DTour } from "../../../../api/properties";
import { fetchUnit3DTour } from "../../../../api/building3D";
import { buildClientFallback3D } from "./tourUtils";
import { Property3DCanvas, Property3DCanvasHandle } from "./Property3DCanvas";
import { RoomLabels } from "./RoomLabels";
import { FloorPlanMiniMap } from "./FloorPlanMiniMap";
import { TourControls } from "./TourControls";
import { Property3DConfigModal } from "./Property3DConfigModal";

export const Property3DTour: React.FC<Property3DTourProps> = ({
  propertyId,
  propertyTitle,
  property,
  initialWalkthrough,
  isOpen = true,
  isModal = false,
  onClose,
  onContactClick,
  onScheduleVisitClick,
  className = ""
}) => {
  const isFull3DTour = (data: any): data is Property3DTourData => {
    return Boolean(data && Array.isArray(data.rooms) && data.rooms.length > 0);
  };

  const [tourData, setTourData] = useState<Property3DTourData | null>(
    isFull3DTour(initialWalkthrough) ? initialWalkthrough : null
  );
  const [loading, setLoading] = useState<boolean>(!isFull3DTour(initialWalkthrough));
  const [loadingStep, setLoadingStep] = useState<string>("Loading structure...");
  const [loadingProgress, setLoadingProgress] = useState<number>(isFull3DTour(initialWalkthrough) ? 100 : 20);
  const [error, setError] = useState<string | null>(null);

  // Sync state if initialWalkthrough changes/is provided after mount
  useEffect(() => {
    if (isFull3DTour(initialWalkthrough)) {
      setTourData(initialWalkthrough);
      setError(null);
      setLoading(false);
      setLoadingProgress(100);
      setCurrentStepIndex(0);
      setIsPlaying(true);
    }
  }, [initialWalkthrough]);

  // Tour Player State
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isFreeExplore, setIsFreeExplore] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Live Camera state for MiniMap
  const [cameraPos, setCameraPos] = useState<[number, number, number]>([0, 5, 20]);
  const [cameraLookAt, setCameraLookAt] = useState<[number, number, number]>([0, 3, 0]);

  // Actual Room Photo Viewer modal
  const [activePhotoUrl, setActivePhotoUrl] = useState<string | null>(null);

  // Admin Config Modal
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);

  // Mini-map expanded
  const [isMiniMapExpanded, setIsMiniMapExpanded] = useState<boolean>(false);

  // Canvas ref for imperative actions
  const canvasRef = useRef<Property3DCanvasHandle | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load 3D tour from backend API
  const loadTour = useCallback(async () => {
    // If initialWalkthrough is already present and valid, skip network fetch
    if (initialWalkthrough && initialWalkthrough.rooms && initialWalkthrough.rooms.length > 0) {
      setTourData(initialWalkthrough);
      setError(null);
      setLoading(false);
      setLoadingProgress(100);
      return;
    }

    const validId = Number(propertyId);
    if (!validId || isNaN(validId)) {
      const fallback = buildClientFallback3D(property || { title: propertyTitle || "Residence" });
      setTourData(fallback);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setLoadingStep("Loading 3D structure...");
    setLoadingProgress(25);

    try {
      const stepTimer1 = setTimeout(() => {
        setLoadingStep("Assembling architectural rooms...");
        setLoadingProgress(60);
      }, 300);

      const stepTimer2 = setTimeout(() => {
        setLoadingStep("Positioning virtual camera...");
        setLoadingProgress(85);
      }, 600);

      let data: any = null;
      // Try property tour endpoint first
      try {
        data = await fetchProperty3DTour(validId);
      } catch (propErr) {
        // If property 404s, try unit tour endpoint
        try {
          data = await fetchUnit3DTour(validId);
        } catch (unitErr) {
          data = null;
        }
      }

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      if (data && data.rooms && data.rooms.length > 0) {
        setTourData(data);
        setCurrentStepIndex(0);
        setIsPlaying(true);
      } else {
        const fallbackObj = property || {
          id: validId,
          title: propertyTitle || "Residence",
          name: propertyTitle || "Residence",
          bhk: 3,
          area_sqft: 1450,
        };
        const fallback = buildClientFallback3D(fallbackObj);
        setTourData(fallback);
        setCurrentStepIndex(0);
        setIsPlaying(true);
      }
    } catch (err: any) {
      console.warn("[SAI 3D Tour] API fetch fallback:", err?.message || err);
      const fallbackObj = property || {
        id: validId,
        title: propertyTitle || "Residence",
        name: propertyTitle || "Residence",
        bhk: 3,
        area_sqft: 1450,
      };
      setTourData(buildClientFallback3D(fallbackObj));
      setCurrentStepIndex(0);
      setIsPlaying(true);
      setError(null);
    } finally {
      setLoadingProgress(100);
      setTimeout(() => {
        setLoading(false);
      }, 400);
    }
  }, [propertyId, property, propertyTitle, initialWalkthrough]);

  useEffect(() => {
    if (isOpen) {
      loadTour();
    }
  }, [isOpen, loadTour]);

  // Guaranteed safe camera path and rooms
  const safeCameraPath = useMemo(() => {
    if (tourData?.camera_path && Array.isArray(tourData.camera_path) && tourData.camera_path.length > 0) {
      return tourData.camera_path;
    }
    const fallback = buildClientFallback3D(property || { title: propertyTitle || "Residence" });
    return fallback.camera_path;
  }, [tourData, property, propertyTitle]);

  const safeRooms = useMemo(() => {
    if (tourData?.rooms && Array.isArray(tourData.rooms) && tourData.rooms.length > 0) {
      return tourData.rooms;
    }
    const fallback = buildClientFallback3D(property || { title: propertyTitle || "Residence" });
    return fallback.rooms;
  }, [tourData, property, propertyTitle]);

  // Current active camera step
  const currentStep = useMemo(() => {
    return safeCameraPath[currentStepIndex] || safeCameraPath[0];
  }, [safeCameraPath, currentStepIndex]);

  // Current active room
  const currentRoom = useMemo(() => {
    if (!currentStep) return safeRooms[0];
    return safeRooms.find((r) => r.id === currentStep.room_id) || safeRooms[0];
  }, [safeRooms, currentStep]);

  // Navigation handlers
  const handleNext = () => canvasRef.current?.nextStep();
  const handlePrev = () => canvasRef.current?.prevStep();
  const handleRestart = () => canvasRef.current?.restart();
  const handleTogglePlay = () => {
    setIsPlaying((prev) => !prev);
    canvasRef.current?.togglePlay();
  };
  const handleToggleFreeExplore = () => {
    setIsFreeExplore((prev) => {
      const next = !prev;
      if (next) setIsPlaying(false);
      return next;
    });
    canvasRef.current?.toggleFreeExplore();
  };
  const handleToggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      canvasRef.current?.setMuted(next);
      return next;
    });
  };

  const handleSelectRoomById = (roomId: string) => {
    const stepIdx = safeCameraPath.findIndex((s) => s.room_id === roomId);
    if (stepIdx !== -1) {
      canvasRef.current?.setStep(stepIdx);
      setCurrentStepIndex(stepIdx);
    }
  };

  const handleSelectStep = (idx: number) => {
    canvasRef.current?.setStep(idx);
    setCurrentStepIndex(idx);
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") handleNext();
      else if (e.key === "ArrowLeft") handlePrev();
      else if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.key === "m" || e.key === "M") handleToggleMute();
      else if (e.key === "Escape" && onClose) onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const content = (
    <div
      ref={containerRef}
      className={`relative w-full h-full flex flex-col justify-between overflow-hidden bg-slate-950 ${
        isFullscreen ? "h-screen w-screen rounded-none" : "min-h-[560px] max-h-[92vh] rounded-3xl"
      } ${className}`}
    >
      {/* 1. TOP HEADER BAR */}
      <div className="w-full z-30 px-4 sm:px-6 pt-4 flex items-center justify-between pointer-events-auto select-none">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center shadow-lg backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-teal-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-black tracking-widest text-teal-300 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                SAI 3D VIRTUAL WALKTHROUGH
              </span>
              <span className="text-xs text-white/50 hidden sm:inline">•</span>
              <span className="text-xs text-white font-bold hidden sm:inline truncate max-w-sm">
                {propertyTitle || tourData?.title || property?.name || "Verified Listing"}
              </span>
            </div>
          </div>
        </div>

        {/* Top Right Actions */}
        <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900/85 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 backdrop-blur-md transition-all active:scale-95 cursor-pointer shadow-lg"
              title="Close 3D Tour (Escape)"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. MAIN 3D VIEWPORT CANVAS */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        {loading ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-8 text-center bg-slate-950">
            <div className="w-16 h-16 rounded-3xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center shadow-[0_0_30px_rgba(20,184,166,0.3)] animate-pulse">
              <Compass className="w-8 h-8 text-teal-300 animate-spin" />
            </div>
            <h3 className="text-xl font-black text-white tracking-wide">
              Preparing 3D Property Tour...
            </h3>
            <p className="text-xs text-teal-200/80 max-w-xs">{loadingStep}</p>

            {/* Loading progress bar */}
            <div className="w-64 h-2 rounded-full bg-slate-800 overflow-hidden border border-slate-700/60 mt-1">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-300"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
          </div>
        ) : error ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-8 text-center bg-slate-950">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-rose-300" />
            </div>
            <h3 className="text-lg font-bold text-white">{error}</h3>
            <p className="text-xs text-slate-400 max-w-sm">
              3D walkthrough is temporarily unavailable. You can still view property photos and floor plans.
            </p>
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={loadTour}
                className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg active:scale-95 transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry 3D Tour
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 active:scale-95 transition-all cursor-pointer"
                >
                  View Property
                </button>
              )}
            </div>
          </div>
        ) : tourData ? (
          <>
            {/* The WebGL 3D Canvas */}
            <Property3DCanvas
              ref={canvasRef}
              tourData={tourData}
              isPlaying={isPlaying}
              isFreeExplore={isFreeExplore}
              isMuted={isMuted}
              onStepChange={(idx) => setCurrentStepIndex(idx)}
              onTourComplete={() => setIsPlaying(false)}
              onCameraUpdate={(pos, lookAt) => {
                setCameraPos(pos);
                setCameraLookAt(lookAt);
              }}
            />

            {/* Floating Room Label HUD */}
            <RoomLabels
              currentRoom={currentRoom}
              currentStepLabel={currentStep?.label || ""}
              stepIndex={currentStepIndex}
              totalSteps={safeCameraPath.length}
              city={tourData?.city || "Pune"}
              locality={tourData?.locality || "City Center"}
              isVerifiedFloorplan={tourData?.is_verified_floorplan}
              hasActualPhoto={Boolean(currentRoom?.has_actual_image && currentRoom?.image_url)}
              onViewActualPhoto={() => {
                if (currentRoom?.image_url) {
                  setActivePhotoUrl(currentRoom.image_url);
                }
              }}
            />

            {/* Right Side Navigation Drawer / Room List */}
            <div className="absolute top-16 right-4 z-20 hidden md:flex flex-col gap-1.5 max-h-[55vh] overflow-y-auto p-2 rounded-2xl bg-slate-900/85 border border-white/10 backdrop-blur-xl shadow-2xl pointer-events-auto w-48">
              <div className="px-2 py-1 border-b border-slate-700/60 mb-1 flex items-center justify-between">
                <span className="text-[10px] font-bold text-teal-300 uppercase tracking-wider">
                  Tour Sequence
                </span>
                <span className="text-[9px] text-slate-400 font-mono">
                  {tourData?.bhk || 3} BHK
                </span>
              </div>

              {safeRooms.map((r, rIdx) => {
                const isActive = currentRoom?.id === r.id;
                const isPassed = (currentRoom?.order || 1) > r.order;

                return (
                  <button
                    key={r.id}
                    onClick={() => handleSelectRoomById(r.id)}
                    className={`flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? "bg-teal-500 text-slate-950 font-black shadow-md scale-102"
                        : "hover:bg-slate-800 text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      {isPassed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                      ) : (
                        <div
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            isActive ? "bg-slate-950" : "bg-slate-600"
                          }`}
                        />
                      )}
                      <span className="truncate">{r.name}</span>
                    </div>
                    <ChevronRight className="w-3 h-3 opacity-60 shrink-0" />
                  </button>
                );
              })}
            </div>

            {/* Bottom-Right Interactive Floor Plan Mini-Map */}
            <div className="absolute bottom-20 right-4 z-20">
              <FloorPlanMiniMap
                rooms={safeRooms}
                currentRoomId={currentRoom?.id || ""}
                cameraPos={cameraPos}
                cameraLookAt={cameraLookAt}
                onSelectRoom={handleSelectRoomById}
                isExpanded={isMiniMapExpanded}
                onToggleExpand={() => setIsMiniMapExpanded((prev) => !prev)}
              />
            </div>
          </>
        ) : null}
      </div>

      {/* 3. BOTTOM CONTROLS BAR */}
      {!loading && !error && (
        <TourControls
          isPlaying={isPlaying}
          onTogglePlay={handleTogglePlay}
          onPrev={handlePrev}
          onNext={handleNext}
          onRestart={handleRestart}
          canPrev={currentStepIndex > 0}
          canNext={currentStepIndex < safeCameraPath.length - 1}
          isFreeExplore={isFreeExplore}
          onToggleFreeExplore={handleToggleFreeExplore}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          steps={safeCameraPath}
          currentStepIndex={currentStepIndex}
          onSelectStep={handleSelectStep}
          onOpenConfig={() => setIsConfigOpen(true)}
        />
      )}

      {/* Actual Room Photo Overlay Modal (Section 38 & 58) */}
      {activePhotoUrl && (
        <div className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative max-w-3xl w-full rounded-3xl overflow-hidden bg-slate-900 border border-teal-500/40 shadow-2xl p-4">
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase text-teal-300 bg-teal-500/20 px-2 py-0.5 rounded border border-teal-500/30">
                  ACTUAL PROPERTY PHOTO
                </span>
                <span className="text-sm font-bold text-white">
                  {currentRoom?.name}
                </span>
              </div>
              <button
                onClick={() => setActivePhotoUrl(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="w-full h-80 sm:h-96 rounded-2xl overflow-hidden bg-black flex items-center justify-center">
              <img
                src={activePhotoUrl}
                alt={currentRoom?.name || "Actual Room"}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
              <span>Verified actual photo provided by owner / builder</span>
              <button
                onClick={() => setActivePhotoUrl(null)}
                className="px-4 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold transition-all cursor-pointer"
              >
                Back to 3D Walkthrough
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin 3D Configuration Modal (Section 40) */}
      {tourData && (
        <Property3DConfigModal
          isOpen={isConfigOpen}
          onClose={() => setIsConfigOpen(false)}
          tourData={tourData}
          onConfigSaved={(updated) => setTourData(updated)}
        />
      )}
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-2 sm:p-6 animate-in fade-in duration-300">
        <div className="w-full max-w-6xl h-[88vh] max-h-[760px] rounded-3xl overflow-hidden shadow-[0_25px_80px_rgba(0,0,0,0.9)] border border-teal-500/40">
          {content}
        </div>
      </div>
    );
  }

  return content;
};
