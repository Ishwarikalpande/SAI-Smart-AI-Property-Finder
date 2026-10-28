import React, { useRef, useEffect } from "react";
import { WalkthroughRoom } from "./PropertyScene";

interface RoomTimelineProps {
  rooms: WalkthroughRoom[];
  currentIndex: number;
  currentRoomProgress: number; // 0 to 100
  onSelectRoom: (index: number) => void;
}

export const RoomTimeline: React.FC<RoomTimelineProps> = ({
  rooms,
  currentIndex,
  currentRoomProgress,
  onSelectRoom,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll timeline to keep active room centered
  useEffect(() => {
    if (activeItemRef.current && containerRef.current) {
      activeItemRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [currentIndex]);

  // Shorten names for timeline chips if needed
  const getShortName = (name: string) => {
    if (name === "Living Room") return "Living";
    if (name === "Master Bedroom") return "Master";
    if (name.startsWith("Bathroom ")) return `Bath ${name.replace("Bathroom ", "")}`;
    if (name === "Property Summary") return "Summary";
    return name;
  };

  return (
    <div className="w-full z-20 flex flex-col gap-2 select-none">
      {/* 1. Segmented Progress Bar across all dynamic rooms */}
      <div className="flex gap-1.5 w-full px-4 sm:px-6">
        {rooms.map((room, idx) => {
          let fillPercent = 0;
          if (idx < currentIndex) {
            fillPercent = 100;
          } else if (idx === currentIndex) {
            fillPercent = Math.min(100, Math.max(0, currentRoomProgress));
          }

          return (
            <div
              key={room.id || idx}
              onClick={() => onSelectRoom(idx)}
              className="flex-1 h-1.5 rounded-full bg-white/20 overflow-hidden cursor-pointer hover:h-2 transition-all"
              title={`Jump to ${room.name}`}
            >
              <div
                className="h-full bg-gradient-to-r from-teal-400 to-emerald-300 transition-all duration-100 ease-linear rounded-full"
                style={{ width: `${fillPercent}%` }}
              />
            </div>
          );
        })}
      </div>

      {/* 2. Scrollable Timeline Chips */}
      <div
        ref={containerRef}
        className="flex items-center gap-2 overflow-x-auto px-4 sm:px-6 py-1 scrollbar-none no-scrollbar"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {rooms.map((room, idx) => {
          const isActive = idx === currentIndex;
          const isPassed = idx < currentIndex;
          const orderNum = String(idx + 1).padStart(2, "0");

          return (
            <button
              key={room.id || idx}
              ref={isActive ? activeItemRef : null}
              onClick={() => onSelectRoom(idx)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold backdrop-blur-md transition-all cursor-pointer ${
                isActive
                  ? "bg-teal-500 text-slate-950 font-bold border-2 border-teal-300 shadow-[0_0_16px_rgba(20,184,166,0.6)] scale-105"
                  : isPassed
                  ? "bg-slate-900/80 text-teal-200/90 border border-teal-500/30 hover:bg-slate-800"
                  : "bg-slate-900/60 text-slate-400 border border-white/10 hover:border-white/25 hover:text-slate-200"
              }`}
            >
              <span
                className={`text-[10px] font-mono ${
                  isActive ? "text-slate-950 font-black" : "text-teal-400/80"
                }`}
              >
                {orderNum}
              </span>
              <span>{getShortName(room.name)}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping ml-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
