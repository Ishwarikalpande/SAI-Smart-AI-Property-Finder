import React from "react";
import {
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  X,
  Volume2,
  VolumeX,
} from "lucide-react";
import { WalkthroughScene } from "./PropertyScene";

interface SceneControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onRestart: () => void;
  onPrev: () => void;
  onNext: () => void;
  isFirstScene: boolean;
  isLastScene: boolean;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onClose?: () => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
  isModal?: boolean;
  scenes?: WalkthroughScene[];
  currentIndex?: number;
  onSelectScene?: (index: number) => void;
}

export const SceneControls: React.FC<SceneControlsProps> = ({
  isPlaying,
  onTogglePlay,
  onRestart,
  onPrev,
  onNext,
  isFirstScene,
  isLastScene,
  isFullscreen,
  onToggleFullscreen,
  onClose,
  isMuted,
  onToggleMute,
  isModal,
  scenes = [],
  currentIndex = 0,
  onSelectScene,
}) => {
  return (
    <div className="w-full flex items-center justify-between gap-3 px-3 py-2.5 z-20 pointer-events-auto">
      {/* Left Action Buttons */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Play/Pause Button */}
        <button
          onClick={onTogglePlay}
          aria-label={isPlaying ? "Pause walkthrough" : "Play walkthrough"}
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-teal-500 hover:bg-teal-400 active:scale-95 text-white flex items-center justify-center shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-teal-300"
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 fill-current" />
          ) : (
            <Play className="w-5 h-5 fill-current ml-0.5" />
          )}
        </button>

        {/* Previous Scene Button */}
        <button
          onClick={onPrev}
          disabled={isFirstScene}
          aria-label="Previous scene"
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 disabled:opacity-30 disabled:pointer-events-none text-white flex items-center justify-center backdrop-blur-md border border-white/10 transition-all focus:outline-none"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Next Scene Button */}
        <button
          onClick={onNext}
          disabled={isLastScene}
          aria-label="Next scene"
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 disabled:opacity-30 disabled:pointer-events-none text-white flex items-center justify-center backdrop-blur-md border border-white/10 transition-all focus:outline-none"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Restart Button */}
        <button
          onClick={onRestart}
          aria-label="Restart walkthrough"
          className="hidden sm:flex w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white items-center justify-center backdrop-blur-md border border-white/10 transition-all focus:outline-none"
          title="Restart from beginning"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Center: Quick Scene Select Pills (Desktop/Tablet) */}
      {scenes.length > 0 && onSelectScene && (
        <div className="hidden md:flex items-center gap-1 bg-black/40 backdrop-blur-md p-1 rounded-full border border-white/10 overflow-x-auto max-w-md">
          {scenes.map((s, i) => (
            <button
              key={`${s.id}-${i}`}
              onClick={() => onSelectScene(i)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                i === currentIndex
                  ? "bg-teal-500 text-white shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
            >
              {s.title}
            </button>
          ))}
        </div>
      )}

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Audio Mute/Unmute if applicable */}
        {onToggleMute && (
          <button
            onClick={onToggleMute}
            aria-label={isMuted ? "Unmute sound" : "Mute sound"}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-md border border-white/10 transition-all focus:outline-none"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        )}

        {/* Fullscreen Button */}
        {onToggleFullscreen && (
          <button
            onClick={onToggleFullscreen}
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-md border border-white/10 transition-all focus:outline-none"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        )}

        {/* Modal Close Button */}
        {isModal && onClose && (
          <button
            onClick={onClose}
            aria-label="Close walkthrough"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-rose-500/80 hover:bg-rose-500 text-white flex items-center justify-center backdrop-blur-md border border-rose-400/30 transition-all focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};
