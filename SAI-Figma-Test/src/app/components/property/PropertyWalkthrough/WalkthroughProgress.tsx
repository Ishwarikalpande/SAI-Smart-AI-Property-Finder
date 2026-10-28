import React from "react";
import { WalkthroughScene } from "./PropertyScene";

interface WalkthroughProgressProps {
  scenes: WalkthroughScene[];
  currentIndex: number;
  sceneProgress: number; // 0 to 100
  onSelectScene: (index: number) => void;
}

export const WalkthroughProgress: React.FC<WalkthroughProgressProps> = ({
  scenes,
  currentIndex,
  sceneProgress,
  onSelectScene,
}) => {
  const currentScene = scenes[currentIndex];

  return (
    <div className="w-full flex flex-col gap-2 z-20 pointer-events-auto">
      {/* Top Header Row with Scene Title & Counter */}
      <div className="flex items-center justify-between text-xs font-medium text-white/90 px-1 drop-shadow">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-teal-500/30 text-teal-300 border border-teal-500/40 text-[10px] tracking-wide font-semibold uppercase backdrop-blur-md">
            AI Tour
          </span>
          <span className="font-semibold text-white tracking-wide text-sm">
            {currentScene?.title || "Property Walkthrough"}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-white/80 font-mono tracking-wider bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-md border border-white/10">
          <span className="text-teal-300 font-bold">{currentIndex + 1}</span>
          <span className="text-white/40">/</span>
          <span>{scenes.length}</span>
        </div>
      </div>

      {/* Segmented Timeline */}
      <div className="flex items-center gap-1.5 w-full">
        {scenes.map((scene, idx) => {
          let fillWidth = "0%";
          if (idx < currentIndex) {
            fillWidth = "100%";
          } else if (idx === currentIndex) {
            fillWidth = `${Math.min(100, Math.max(0, sceneProgress))}%`;
          }

          return (
            <button
              key={`${scene.id}-${idx}`}
              onClick={() => onSelectScene(idx)}
              title={`${idx + 1}. ${scene.title}`}
              aria-label={`Jump to scene ${idx + 1}: ${scene.title}`}
              className="group relative flex-1 h-1.5 md:h-2 bg-white/20 hover:bg-white/35 rounded-full overflow-hidden transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-teal-400"
            >
              <div
                className="h-full bg-gradient-to-r from-teal-400 to-emerald-300 rounded-full transition-all duration-100 ease-linear shadow-[0_0_8px_rgba(45,212,191,0.7)]"
                style={{ width: fillWidth }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};
