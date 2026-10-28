import React from "react";
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Compass,
  Footprints,
  Sliders
} from "lucide-react";
import { Property3DCameraStep } from "./PropertyScene";

interface TourControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onRestart: () => void;
  canPrev: boolean;
  canNext: boolean;
  isFreeExplore: boolean;
  onToggleFreeExplore: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  steps: Property3DCameraStep[];
  currentStepIndex: number;
  onSelectStep: (index: number) => void;
  onOpenConfig?: () => void;
}

export const TourControls: React.FC<TourControlsProps> = ({
  isPlaying,
  onTogglePlay,
  onPrev,
  onNext,
  onRestart,
  canPrev,
  canNext,
  isFreeExplore,
  onToggleFreeExplore,
  isMuted,
  onToggleMute,
  isFullscreen,
  onToggleFullscreen,
  steps,
  currentStepIndex,
  onSelectStep,
  onOpenConfig
}) => {
  return (
    <div className="w-full px-4 sm:px-8 pb-3 z-20 pointer-events-auto flex flex-col gap-2 select-none">
      {/* 1. Progress Step Scrubber Bar */}
      <div className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-xl shadow-xl">
        {steps.map((step, idx) => {
          const isPassed = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;

          return (
            <button
              key={step.id || idx}
              onClick={() => onSelectStep(idx)}
              className="flex-1 group relative py-1 focus:outline-none cursor-pointer"
              title={`${idx + 1}. ${step.label || step.step_name}`}
            >
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  isCurrent
                    ? "bg-teal-400 shadow-[0_0_12px_rgba(45,212,191,0.8)] scale-y-125"
                    : isPassed
                    ? "bg-teal-600/70"
                    : "bg-slate-700/60 hover:bg-slate-600"
                }`}
              />

              {/* Tooltip on hover */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden group-hover:block z-30 px-2 py-1 rounded-md bg-slate-900 text-white text-[10px] whitespace-nowrap shadow-xl border border-teal-500/30">
                {step.label || step.step_name}
              </div>
            </button>
          );
        })}
      </div>

      {/* 2. Control Action Buttons Bar */}
      <div className="flex items-center justify-between gap-2 px-4 py-2.5 rounded-2xl bg-slate-900/85 border border-teal-500/30 backdrop-blur-xl shadow-2xl">
        {/* Left: Previous, Play/Pause, Next */}
        <div className="flex items-center gap-2">
          <button
            onClick={onPrev}
            disabled={!canPrev}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95 cursor-pointer shadow-md"
            title="Previous Room (Left Arrow)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={onTogglePlay}
            className={`px-4 py-2 rounded-xl font-black text-xs flex items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-lg tracking-wide ${
              isPlaying
                ? "bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-[0_0_20px_rgba(20,184,166,0.4)]"
                : "bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-400/50"
            }`}
            title="Play / Pause Auto Tour (Space)"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Auto Tour</span>
              </>
            )}
          </button>

          <button
            onClick={onNext}
            disabled={!canNext}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95 cursor-pointer shadow-md"
            title="Next Room (Right Arrow)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={onRestart}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all active:scale-95 cursor-pointer ml-1"
            title="Restart Tour from Front View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Free Explore Mode Toggle (Section 28) */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleFreeExplore}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-md border ${
              isFreeExplore
                ? "bg-amber-400 text-slate-950 border-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.5)]"
                : "bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border-white/10"
            }`}
            title="Free Orbit & First-Person Exploration"
          >
            {isFreeExplore ? (
              <>
                <Footprints className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Exploring Freely (Orbit / Drag)</span>
                <span className="sm:hidden">Free Explore</span>
              </>
            ) : (
              <>
                <Compass className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden sm:inline">Free Explore Mode</span>
                <span className="sm:hidden">Explore</span>
              </>
            )}
          </button>
        </div>

        {/* Right: Audio, Fullscreen, Admin Config */}
        <div className="flex items-center gap-1.5">
          {onOpenConfig && (
            <button
              onClick={onOpenConfig}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-teal-300 transition-all active:scale-95 cursor-pointer"
              title="Admin 3D Structure Configuration (Section 40)"
            >
              <Sliders className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onToggleMute}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all active:scale-95 cursor-pointer"
            title={isMuted ? "Unmute Sound (M)" : "Mute Sound (M)"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-teal-300" />}
          </button>

          <button
            onClick={onToggleFullscreen}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all active:scale-95 cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
