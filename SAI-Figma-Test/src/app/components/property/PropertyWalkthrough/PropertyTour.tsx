import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Sparkles,
  AlertCircle,
  RefreshCw,
  X,
  Building2,
  Film,
  Download,
  Check,
} from "lucide-react";
import {
  WalkthroughProps,
  PropertyWalkthrough as IPropertyWalkthrough,
  WalkthroughRoom,
} from "./PropertyScene";
import { fetchPropertyWalkthrough } from "../../../../api/properties";
import {
  preloadImage,
  isReducedMotionPreferred,
  buildPropertyWalkthroughFallback,
  getMediaUrl,
  getBackendBaseUrl,
} from "./walkthroughUtils";
import { RoomScene } from "./RoomScene";
import { RoomTimeline } from "./RoomTimeline";
import { TourControls } from "./TourControls";
import { VoiceNarrator } from "./VoiceNarrator";
import "./PropertyWalkthrough.css";

export const PropertyTour: React.FC<WalkthroughProps> = ({
  propertyId,
  propertyTitle,
  property,
  initialWalkthrough,
  isOpen = true,
  isModal = false,
  onClose,
  onContactClick,
  onDetailsClick,
  onScheduleVisitClick,
  className = "",
}) => {
  const [walkthroughData, setWalkthroughData] = useState<IPropertyWalkthrough | null>(() => {
    if (initialWalkthrough?.rooms && initialWalkthrough.rooms.length > 0) {
      return initialWalkthrough;
    }
    if (initialWalkthrough?.scenes && initialWalkthrough.scenes.length > 0) {
      return initialWalkthrough;
    }
    if (property) {
      return buildPropertyWalkthroughFallback(property);
    }
    return null;
  });

  const [loading, setLoading] = useState<boolean>(!walkthroughData);
  const [error, setError] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [roomProgress, setRoomProgress] = useState<number>(0); // 0 to 100
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isReducedMotion, setIsReducedMotion] = useState<boolean>(false);

  // Voice narration manager
  const voiceNarratorRef = useRef<VoiceNarrator | null>(null);
  if (!voiceNarratorRef.current) {
    voiceNarratorRef.current = new VoiceNarrator();
  }
  const [isMuted, setIsMuted] = useState<boolean>(() => voiceNarratorRef.current?.getMuted() ?? false);

  // Video Export Job state (Section 32)
  const [isExportingVideo, setIsExportingVideo] = useState<boolean>(false);
  const [exportedVideoUrl, setExportedVideoUrl] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const progressIntervalRef = useRef<any>(null);

  // Check prefers-reduced-motion
  useEffect(() => {
    setIsReducedMotion(isReducedMotionPreferred());
  }, []);

  // Normalize rooms list from walkthrough data
  const rooms: WalkthroughRoom[] = useMemo(() => {
    if (!walkthroughData) return [];

    // 1. If backend returned explicit dynamic rooms list (preferred)
    if (Array.isArray(walkthroughData.rooms) && walkthroughData.rooms.length > 0) {
      return walkthroughData.rooms;
    }

    // 2. If legacy scenes list is provided, map to WalkthroughRoom
    if (Array.isArray(walkthroughData.scenes) && walkthroughData.scenes.length > 0) {
      return walkthroughData.scenes.map((sc, idx) => ({
        id: sc.id || `room-${idx + 1}`,
        name: sc.title || `Room ${idx + 1}`,
        type: (sc.data?.room_type || sc.category || sc.id || "living_room").toLowerCase(),
        order: idx + 1,
        duration: sc.duration || 4,
        image_url: sc.image_url,
        has_actual_image: Boolean(sc.image_url),
        bedroom_number: sc.data?.bedroom_number || (sc.id.includes("bedroom") ? 1 : undefined),
        bathroom_number: sc.data?.bathroom_number || (sc.id.includes("bathroom") ? 1 : undefined),
        balcony_number: sc.data?.balcony_number || (sc.id.includes("balcony") ? 1 : undefined),
        data: sc.data || {},
      }));
    }

    return [];
  }, [walkthroughData]);

  // Primary loader for selected property walkthrough
  const loadWalkthrough = useCallback(async () => {
    const validId = Number(propertyId);
    if (!validId || isNaN(validId)) {
      if (property) {
        setWalkthroughData(buildPropertyWalkthroughFallback(property));
        setError(null);
        setLoading(false);
      } else {
        setError("Invalid property ID for walkthrough.");
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await fetchPropertyWalkthrough(validId);
      if (
        (data?.rooms && Array.isArray(data.rooms) && data.rooms.length > 0) ||
        (data?.scenes && Array.isArray(data.scenes) && data.scenes.length > 0)
      ) {
        setWalkthroughData(data as any);
        setCurrentIndex(0);
        setRoomProgress(0);
        setIsPlaying(true);
      } else if (property) {
        const fallback = buildPropertyWalkthroughFallback(property);
        setWalkthroughData(fallback);
        setCurrentIndex(0);
        setRoomProgress(0);
        setIsPlaying(true);
      } else {
        setError("Property tour could not be loaded.");
      }
    } catch (err: any) {
      console.warn("[SAI Tour] API fetch fallback:", err?.message || err);
      if (property) {
        const fallback = buildPropertyWalkthroughFallback(property);
        setWalkthroughData(fallback);
        setCurrentIndex(0);
        setRoomProgress(0);
        setIsPlaying(true);
      } else {
        setError("Property tour could not be loaded.");
      }
    } finally {
      setLoading(false);
    }
  }, [propertyId, property]);

  // Sync when propertyId or initialWalkthrough changes
  useEffect(() => {
    if (
      (initialWalkthrough?.rooms && initialWalkthrough.rooms.length > 0) ||
      (initialWalkthrough?.scenes && initialWalkthrough.scenes.length > 0)
    ) {
      setWalkthroughData(initialWalkthrough);
      setLoading(false);
      setCurrentIndex(0);
      setRoomProgress(0);
      setIsPlaying(true);
    } else if (isOpen) {
      loadWalkthrough();
    }
  }, [propertyId, initialWalkthrough, isOpen, loadWalkthrough]);

  const currentRoom: WalkthroughRoom | undefined = rooms[currentIndex] || rooms[0];

  // Preload NEXT room's image only (performance optimization)
  useEffect(() => {
    if (rooms.length > 0 && currentIndex < rooms.length - 1) {
      const nextRoomImageUrl = rooms[currentIndex + 1]?.image_url;
      if (nextRoomImageUrl) {
        preloadImage(nextRoomImageUrl);
      }
    }
  }, [currentIndex, rooms]);

  // Trigger voice narration whenever currentRoom changes
  useEffect(() => {
    if (!isOpen || !isPlaying || !currentRoom || isMuted) {
      voiceNarratorRef.current?.stop();
      return;
    }

    const narrationText = VoiceNarrator.getNarrationForRoom(
      currentRoom,
      walkthroughData?.property || property
    );
    // Slight 250ms pause before starting voice for natural feeling
    const timer = setTimeout(() => {
      voiceNarratorRef.current?.speak(narrationText);
    }, 250);

    return () => {
      clearTimeout(timer);
      voiceNarratorRef.current?.stop();
    };
  }, [currentIndex, isPlaying, isOpen, isMuted, walkthroughData, property]);

  // Navigation handlers
  const advanceRoom = useCallback(() => {
    setCurrentIndex((prev) => {
      if (prev < rooms.length - 1) {
        setRoomProgress(0);
        return prev + 1;
      } else {
        // Reached end summary: pause autoplay automatically
        setIsPlaying(false);
        return prev;
      }
    });
  }, [rooms.length]);

  const prevRoom = useCallback(() => {
    setCurrentIndex((prev) => {
      if (prev > 0) {
        setRoomProgress(0);
        return prev - 1;
      }
      return 0;
    });
  }, []);

  const selectRoom = useCallback((index: number) => {
    if (index >= 0 && index < rooms.length) {
      setCurrentIndex(index);
      setRoomProgress(0);
    }
  }, [rooms.length]);

  const restartTour = useCallback(() => {
    setCurrentIndex(0);
    setRoomProgress(0);
    setIsPlaying(true);
  }, []);

  const toggleMute = useCallback(() => {
    if (!voiceNarratorRef.current) return;
    const nextMuted = voiceNarratorRef.current.toggleMuted();
    setIsMuted(nextMuted);
  }, []);

  // Autoplay timer based on current room's dynamic duration
  useEffect(() => {
    if (!isPlaying || loading || !currentRoom) {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      return;
    }

    const durationSeconds = currentRoom.duration || 4;
    const durationMs = durationSeconds * 1000;
    const stepMs = 50;
    const increment = (stepMs / durationMs) * 100;

    progressIntervalRef.current = setInterval(() => {
      setRoomProgress((prev) => {
        if (prev + increment >= 100) {
          advanceRoom();
          return 0;
        }
        return prev + increment;
      });
    }, stepMs);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isPlaying, currentRoom, loading, advanceRoom]);

  // Keyboard navigation (Space = Play/Pause, Left/Right = Seek, M = Mute, Esc = Close)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        advanceRoom();
      } else if (e.key === "ArrowLeft") {
        prevRoom();
      } else if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      } else if (e.key === "m" || e.key === "M") {
        toggleMute();
      } else if (e.key === "Escape" && onClose) {
        voiceNarratorRef.current?.stop();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, advanceRoom, prevRoom, toggleMute, onClose]);

  // Fullscreen toggle handler
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current
        .requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(() => {});
    } else {
      document
        .exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // Cleanup on unmount or close
  useEffect(() => {
    return () => {
      voiceNarratorRef.current?.stop();
    };
  }, []);

  // Trigger optional video export (Section 32)
  const handleExportVideo = async () => {
    const validId = Number(propertyId);
    if (!validId || isExportingVideo) return;

    setIsExportingVideo(true);
    try {
      const backendBase = getBackendBaseUrl();
      const res = await fetch(`${backendBase}/api/properties/${validId}/walkthrough/render`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.video_url) {
          const fullVideoUrl = getMediaUrl(data.video_url);
          setExportedVideoUrl(fullVideoUrl);
        }
      }
    } catch (e) {
      console.warn("[SAI Tour] Video export:", e);
    } finally {
      setIsExportingVideo(false);
    }
  };

  if (!isOpen) return null;

  // Floor plan URL from walkthrough data or property
  const floorPlanUrl =
    walkthroughData?.property?.floor_plan ||
    property?.floor_plan ||
    property?.floorPlan ||
    null;

  // Formatted room counters: 05 / 10
  const orderFormatted = `${String(currentIndex + 1).padStart(2, "0")} / ${String(
    rooms.length || 1
  ).padStart(2, "0")}`;

  const content = (
    <div
      ref={containerRef}
      className={`sai-walkthrough-viewport relative w-full h-full flex flex-col justify-between overflow-hidden bg-slate-950 ${
        isFullscreen ? "rounded-none h-screen w-screen" : "min-h-[520px] max-h-[90vh]"
      } ${className}`}
    >
      {/* Top Header Bar */}
      <div className="w-full z-20 px-4 sm:px-6 pt-4 flex items-center justify-between pointer-events-auto select-none">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center shadow-lg backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-teal-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-black tracking-widest text-teal-300 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                SAI VIRTUAL PROPERTY TOUR
              </span>
              <span className="text-xs text-white/60 hidden sm:inline">•</span>
              <span className="text-xs text-white/80 font-bold hidden sm:inline truncate max-w-xs">
                {propertyTitle || walkthroughData?.title || property?.name || "Verified Listing"}
              </span>
            </div>
          </div>
        </div>

        {/* Header Right Actions: Video Export & Close */}
        <div className="flex items-center gap-2">
          {/* Optional Video Export Button (Section 32) */}
          {exportedVideoUrl ? (
            <a
              href={exportedVideoUrl}
              download={`property_${propertyId}_walkthrough.mp4`}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 backdrop-blur-md text-xs font-bold flex items-center gap-1.5 shadow-lg active:scale-95 transition-all"
              title="Download Generated Video"
            >
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">MP4 Ready</span>
            </a>
          ) : (
            <button
              onClick={handleExportVideo}
              disabled={isExportingVideo}
              className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-teal-200 hover:text-white border border-teal-500/30 backdrop-blur-md text-xs font-bold flex items-center gap-1.5 shadow-lg active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              title="Export Full Walkthrough as MP4 Video"
            >
              <Download className={`w-3.5 h-3.5 text-teal-400 ${isExportingVideo ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">
                {isExportingVideo ? "Exporting Video..." : "Export Video"}
              </span>
            </button>
          )}

          {/* Close Button in Header for Modal */}
          {onClose && (
            <button
              onClick={() => {
                voiceNarratorRef.current?.stop();
                onClose();
              }}
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 backdrop-blur-md transition-all active:scale-95 cursor-pointer"
              title="Close Tour (Escape)"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Center Area: RoomScene or Loading / Error */}
      <div className="relative flex-1 w-full h-full overflow-hidden flex items-center justify-center my-2">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center animate-pulse">
              <Film className="w-6 h-6 text-teal-300 animate-spin" />
            </div>
            <h3 className="text-lg font-bold text-white tracking-wide">
              Preparing your virtual property tour...
            </h3>
            <p className="text-xs text-teal-200/70 max-w-sm">
              Analyzing verified architectural room specifications & media records
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-rose-300" />
            </div>
            <h3 className="text-lg font-bold text-white tracking-wide">
              {error}
            </h3>
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={loadWalkthrough}
                className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg active:scale-95 transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry
              </button>
              {onClose && (
                <button
                  onClick={() => {
                    voiceNarratorRef.current?.stop();
                    onClose();
                  }}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 active:scale-95 transition-all cursor-pointer"
                >
                  View Property
                </button>
              )}
            </div>
          </div>
        ) : currentRoom ? (
          <RoomScene
            room={currentRoom}
            totalRooms={rooms.length}
            currentIndex={currentIndex}
            propertyData={walkthroughData?.property || property}
            floorPlanUrl={floorPlanUrl}
            isReducedMotion={isReducedMotion}
            onScheduleVisitClick={onScheduleVisitClick}
            onContactClick={onContactClick}
            onRestart={restartTour}
          />
        ) : null}
      </div>

      {/* Bottom Coordinator Area: RoomTimeline & TourControls */}
      {!loading && !error && rooms.length > 0 && (
        <div className="w-full pb-3 flex flex-col gap-2 z-20 pointer-events-auto">
          {/* RoomTimeline */}
          <RoomTimeline
            rooms={rooms}
            currentIndex={currentIndex}
            currentRoomProgress={roomProgress}
            onSelectRoom={selectRoom}
          />

          {/* TourControls */}
          <TourControls
            isPlaying={isPlaying}
            onTogglePlay={() => setIsPlaying((prev) => !prev)}
            onPrev={prevRoom}
            onNext={advanceRoom}
            onRestart={restartTour}
            onClose={() => {
              voiceNarratorRef.current?.stop();
              onClose?.();
            }}
            canPrev={currentIndex > 0}
            canNext={currentIndex < rooms.length - 1}
            isFullscreen={isFullscreen}
            onToggleFullscreen={toggleFullscreen}
            isMuted={isMuted}
            onToggleMute={toggleMute}
            currentRoomName={currentRoom?.name || ""}
            orderFormatted={orderFormatted}
          />
        </div>
      )}
    </div>
  );

  // If modal mode, render full-screen blurred backdrop modal overlay
  if (isModal) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-xl flex items-center justify-center p-2 sm:p-6 animate-in fade-in duration-300">
        <div className="w-full max-w-5xl h-[85vh] max-h-[720px] rounded-3xl overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.85)] border border-teal-500/30">
          {content}
        </div>
      </div>
    );
  }

  return content;
};
