import React from "react";
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  X,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
} from "lucide-react";

interface TourControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onRestart: () => void;
  onClose?: () => void;
  canPrev: boolean;
  canNext: boolean;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
  currentRoomName: string;
  orderFormatted: string;
}

export const TourControls: React.FC<TourControlsProps> = ({
  isPlaying,
  onTogglePlay,
  onPrev,
  onNext,
  onRestart,
  onClose,
  canPrev,
  canNext,
  isFullscreen = false,
  onToggleFullscreen,
  isMuted = false,
  onToggleMute,
  currentRoomName,
  orderFormatted,
}) => {
  return (
    <div className="w-full z-20 px-4 sm:px-6 py-2 flex items-center justify-between select-none pointer-events-auto">
      {/* Current Room Quick Readout for Mobile / Glance */}
      <div className="hidden sm:flex items-center gap-2">
        <span className="text-xs font-mono font-bold text-teal-300 px-2 py-0.5 rounded bg-teal-500/20 border border-teal-400/30">
          {orderFormatted}
        </span>
        <span className="text-xs font-bold text-white uppercase tracking-wider truncate max-w-[200px]">
          {currentRoomName}
        </span>
      </div>

      {/* Central Playback Controls Bar */}
      <div className="flex items-center gap-2 sm:gap-3 mx-auto sm:mx-0 bg-slate-900/85 backdrop-blur-xl border border-white/15 px-4 py-2 rounded-2xl shadow-2xl">
        {/* Previous Room Button */}
        <button
          onClick={onPrev}
          disabled={!canPrev}
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95 cursor-pointer"
          title="Previous Room (Left Arrow)"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Play / Pause Primary Button */}
        <button
          onClick={onTogglePlay}
          className="w-11 h-11 rounded-full bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 flex items-center justify-center shadow-[0_0_20px_rgba(45,212,191,0.5)] active:scale-95 transition-all cursor-pointer"
          title={isPlaying ? "Pause Tour (Space)" : "Play Tour (Space)"}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 fill-current" />
          ) : (
            <Play className="w-5 h-5 fill-current ml-0.5" />
          )}
        </button>

        {/* Next Room Button */}
        <button
          onClick={onNext}
          disabled={!canNext}
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95 cursor-pointer"
          title="Next Room (Right Arrow)"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-white/20 mx-1" />

        {/* Voice Narration Audio Mute / Unmute Button */}
        {onToggleMute && (
          <button
            onClick={onToggleMute}
            className={`p-2 rounded-xl transition-all active:scale-95 cursor-pointer ${
              isMuted
                ? "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                : "text-teal-300 hover:text-teal-200 hover:bg-teal-500/20"
            }`}
            title={isMuted ? "Unmute Voice Narration (M)" : "Mute Voice Narration (M)"}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4 text-teal-300" />
            )}
          </button>
        )}

        {/* Restart Tour Button */}
        <button
          onClick={onRestart}
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-all active:scale-95 cursor-pointer"
          title="Restart Tour from Beginning"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Fullscreen Toggle */}
        {onToggleFullscreen && (
          <button
            onClick={onToggleFullscreen}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-all active:scale-95 cursor-pointer hidden sm:block"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* Close Button on Right */}
      {onClose && (
        <button
          onClick={onClose}
          className="p-2.5 rounded-2xl bg-slate-900/80 hover:bg-rose-500/20 text-slate-300 hover:text-rose-200 border border-white/10 hover:border-rose-400/40 backdrop-blur-md transition-all active:scale-95 cursor-pointer ml-2"
          title="Close Tour (Escape)"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};
