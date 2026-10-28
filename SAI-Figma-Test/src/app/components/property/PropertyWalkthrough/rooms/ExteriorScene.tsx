import React, { useState } from "react";
import { Building2, Sparkles, MapPin, Sun, Moon } from "lucide-react";

interface ExteriorSceneProps {
  roomData?: Record<string, any>;
}

export const ExteriorScene: React.FC<ExteriorSceneProps> = ({ roomData }) => {
  const [isDayMode, setIsDayMode] = useState(true);

  const title = roomData?.title || "Property Elevation";
  const propType = roomData?.property_type || "Apartment";
  const bhkDisplay = roomData?.bhk_display;
  const locality = roomData?.locality;
  const city = roomData?.city;
  const price = roomData?.price;

  return (
    <div
      className={`relative w-full h-full overflow-hidden transition-colors duration-700 flex items-center justify-center select-none ${
        isDayMode
          ? "bg-gradient-to-b from-[#7ec5f8] via-[#a3d8fc] to-[#cfeafc]"
          : "bg-gradient-to-b from-[#020409] via-[#060c18] to-[#091428]"
      }`}
    >
      {/* 2.5D Perspective Exterior Architecture Container */}
      <div 
        className="relative w-full max-w-4xl h-full max-h-[520px] flex items-center justify-center"
        style={{ perspective: "1000px" }}
      >
        {/* Sky Container with Day/Night Lighting and Celestial Bodies */}
        <div
          className={`absolute inset-x-8 top-8 bottom-28 rounded-t-3xl border-t border-x shadow-2xl overflow-hidden flex items-end justify-center transition-all duration-700 ${
            isDayMode
              ? "bg-gradient-to-b from-[#38bdf8] via-[#7dd3fc] to-[#bae6fd] border-sky-300/40"
              : "bg-gradient-to-b from-[#030712] via-[#071126] to-[#0d1f42] border-teal-500/20"
          }`}
        >
          {/* ☀️ DAY MODE: RADIANT SUN & CLOUDS */}
          {isDayMode && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {/* Radiant Sun in upper-right sky */}
              <div className="absolute top-6 right-16 flex items-center justify-center">
                {/* Outermost solar flare halo */}
                <div className="absolute w-36 h-36 rounded-full bg-amber-300/25 blur-xl animate-pulse" />
                {/* Secondary golden glow */}
                <div className="absolute w-24 h-24 rounded-full bg-amber-400/40 blur-md" />
                {/* Core luminous sun disc */}
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-100 via-amber-200 to-amber-400 shadow-[0_0_35px_rgba(251,191,36,0.9)] flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-yellow-50" />
                </div>
                {/* Corona sunbeams */}
                <div className="absolute w-28 h-28 border border-dashed border-amber-300/40 rounded-full animate-spin" style={{ animationDuration: "25s" }} />
              </div>

              {/* Daytime soft drifting clouds */}
              <div className="absolute top-10 left-12 flex items-center opacity-85">
                <div className="w-16 h-8 rounded-full bg-white blur-xs" />
                <div className="w-24 h-12 -ml-6 -mt-2 rounded-full bg-white shadow-sm" />
                <div className="w-14 h-7 -ml-4 rounded-full bg-white" />
              </div>
              <div className="absolute top-18 left-1/3 flex items-center opacity-70">
                <div className="w-12 h-6 rounded-full bg-white blur-xs" />
                <div className="w-20 h-10 -ml-4 -mt-1 rounded-full bg-white shadow-sm" />
                <div className="w-10 h-5 -ml-3 rounded-full bg-white" />
              </div>
            </div>
          )}

          {/* 🌙 NIGHT MODE: LUMINOUS MOON & TWINKLING STARS */}
          {!isDayMode && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {/* Celestial Luminous Moon in upper-left sky */}
              <div className="absolute top-8 left-16 flex items-center justify-center">
                {/* Ethereal cyan-white lunar halo */}
                <div className="absolute w-28 h-28 rounded-full bg-sky-300/20 blur-xl animate-pulse" />
                {/* Lunar disc with crater details */}
                <div className="relative w-12 h-12 rounded-full bg-gradient-to-tr from-[#cbd5e1] via-[#e2e8f0] to-[#f8fafc] shadow-[0_0_25px_rgba(224,242,254,0.85)] border border-sky-100/60 overflow-hidden">
                  {/* Subtle lunar craters */}
                  <div className="absolute top-2 left-3 w-3 h-3 rounded-full bg-slate-400/35" />
                  <div className="absolute bottom-2.5 right-2 w-4 h-4 rounded-full bg-slate-400/30" />
                  <div className="absolute top-5 right-4 w-2 h-2 rounded-full bg-slate-400/25" />
                </div>
              </div>

              {/* Twinkling Stars Field across blackish night sky */}
              {[
                { top: "12%", left: "38%", size: "w-1 h-1", delay: "0s" },
                { top: "18%", left: "55%", size: "w-1.5 h-1.5", delay: "0.7s" },
                { top: "8%", left: "72%", size: "w-1 h-1", delay: "1.2s" },
                { top: "24%", left: "82%", size: "w-1.5 h-1.5", delay: "0.3s" },
                { top: "15%", left: "25%", size: "w-1 h-1", delay: "1.6s" },
                { top: "28%", left: "45%", size: "w-1 h-1", delay: "0.9s" },
                { top: "6%", left: "62%", size: "w-1.5 h-1.5", delay: "1.4s" },
                { top: "22%", left: "15%", size: "w-1 h-1", delay: "0.5s" },
                { top: "32%", left: "75%", size: "w-1 h-1", delay: "2.1s" },
                { top: "10%", left: "88%", size: "w-1 h-1", delay: "0.2s" },
                { top: "20%", left: "95%", size: "w-1.5 h-1.5", delay: "1.8s" },
              ].map((star, idx) => (
                <div
                  key={idx}
                  className={`absolute rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.9)] animate-pulse ${star.size}`}
                  style={{ top: star.top, left: star.left, animationDelay: star.delay, animationDuration: "2.2s" }}
                />
              ))}
            </div>
          )}

          {/* Distant Background Tower Silhouettes */}
          <div className="absolute bottom-0 inset-x-12 h-44 flex items-end justify-around opacity-30 pointer-events-none">
            <div className={`w-16 h-36 rounded-t-md transition-colors ${isDayMode ? "bg-slate-400" : "bg-slate-800"}`} />
            <div className={`w-20 h-44 rounded-t-md transition-colors ${isDayMode ? "bg-slate-500" : "bg-slate-900"}`} />
            <div className={`w-14 h-32 rounded-t-md transition-colors ${isDayMode ? "bg-slate-400" : "bg-slate-800"}`} />
          </div>

          {/* Central Modern Multi-Storey Building Elevation Silhouette */}
          <div
            className={`relative z-10 w-72 h-64 rounded-t-2xl border-t-2 border-x-2 shadow-2xl p-3 flex flex-col justify-between transition-all duration-500 ${
              isDayMode
                ? "bg-gradient-to-b from-slate-200 via-slate-300 to-slate-400 border-teal-600/50 shadow-sky-900/10"
                : "bg-gradient-to-b from-slate-850 via-slate-900 to-slate-950 border-teal-400/40 shadow-black/60"
            }`}
          >
            {/* Crown Rooftop Architectural Pergola */}
            <div
              className={`w-full h-4 rounded-t-md border-t-2 flex items-center justify-around px-2 ${
                isDayMode
                  ? "border-teal-600 bg-teal-100 text-teal-800"
                  : "border-teal-300/80 bg-teal-900/40 text-teal-300"
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-teal-500 animate-ping" />
              <span className="text-[8px] font-mono tracking-widest font-black uppercase">SAI VERIFIED ELEVATION</span>
              <div className="w-2 h-2 rounded-full bg-teal-500" />
            </div>

            {/* Architectural Lit Window Grids (Simulating floors) */}
            <div className="flex-1 my-2 grid grid-cols-4 gap-2 p-1">
              {Array.from({ length: 16 }).map((_, wIdx) => {
                const isLit = wIdx % 3 !== 0;
                return (
                  <div
                    key={wIdx}
                    className={`rounded-sm border transition-all ${
                      isDayMode
                        ? "bg-sky-100/90 border-slate-300 shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)]"
                        : isLit
                        ? "bg-amber-200/80 shadow-[0_0_8px_rgba(251,191,36,0.5)] border-amber-300/60"
                        : "bg-slate-800/60 border-slate-700/80"
                    }`}
                  />
                );
              })}
            </div>

            {/* Grand Entrance Canopy on Ground Floor */}
            <div
              className={`w-full h-10 rounded-b-lg border-t-2 flex items-center justify-center px-4 ${
                isDayMode
                  ? "border-teal-500 bg-slate-300"
                  : "border-teal-400/50 bg-gradient-to-b from-teal-950 to-slate-950"
              }`}
            >
              <div className="w-16 h-6 rounded-t-md bg-amber-400/30 border border-amber-300/60 flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-white animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* 2.5D Landscaped Forecourt / Arrival Driveway Floor Plane */}
        <div 
          className={`absolute inset-x-4 bottom-0 h-44 origin-bottom border-t-2 shadow-2xl transition-colors duration-500 ${
            isDayMode
              ? "bg-gradient-to-b from-[#166534] via-[#15803d] to-[#14532d] border-emerald-500/60"
              : "bg-gradient-to-b from-[#0e2722] via-[#091e1a] to-[#040e0c] border-emerald-400/40"
          }`}
          style={{
            transform: "rotateX(58deg)",
            transformStyle: "preserve-3d",
            backgroundImage: isDayMode
              ? "linear-gradient(rgba(255, 255, 255, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.2) 1px, transparent 1px)"
              : "linear-gradient(rgba(52, 211, 153, 0.22) 1px, transparent 1px), linear-gradient(90deg, rgba(52, 211, 153, 0.22) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        >
          {/* Central Paved Arrival Path */}
          <div
            className={`absolute inset-y-0 left-1/2 -translate-x-1/2 w-28 border-x ${
              isDayMode
                ? "bg-gradient-to-b from-slate-200 via-slate-300 to-slate-400 border-slate-300"
                : "bg-gradient-to-b from-slate-700/30 via-slate-800/50 to-slate-900/80 border-teal-500/30"
            }`}
          />
        </div>

        {/* Landscaped Trees on Forecourt Sides */}
        <div className="absolute inset-x-8 bottom-12 h-36 flex items-end justify-between px-10 pointer-events-none">
          {/* Tree Cluster Left */}
          <div className="flex flex-col items-center">
            <div className={`w-16 h-20 rounded-full border shadow-lg ${
              isDayMode
                ? "bg-gradient-to-b from-emerald-500 via-green-600 to-emerald-800 border-emerald-300/50"
                : "bg-gradient-to-b from-emerald-600 via-teal-700 to-emerald-900 border-emerald-400/50"
            }`} />
            <div className="w-2 h-8 bg-amber-950" />
          </div>

          {/* Tree Cluster Right */}
          <div className="flex flex-col items-center">
            <div className={`w-16 h-20 rounded-full border shadow-lg ${
              isDayMode
                ? "bg-gradient-to-b from-emerald-500 via-green-600 to-emerald-800 border-emerald-300/50"
                : "bg-gradient-to-b from-emerald-600 via-teal-700 to-emerald-900 border-emerald-400/50"
            }`} />
            <div className="w-2 h-8 bg-amber-950" />
          </div>
        </div>

        {/* Architectural Overlay Tag & Day/Night Toggle Switch */}
        <div className="absolute top-4 inset-x-6 flex items-center justify-between">
          <div className="px-3 py-1.5 rounded-xl bg-slate-900/85 backdrop-blur-md border border-teal-500/40 flex items-center gap-2 shadow-lg">
            <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span className="text-[11px] font-bold text-teal-200 uppercase tracking-wider">
              2.5D Architecture • Exterior Elevation
            </span>
            {bhkDisplay && (
              <span className="text-[10px] text-teal-300 font-semibold border-l border-slate-700 pl-2">
                {bhkDisplay}
              </span>
            )}
            {price && (
              <span className="text-[10px] text-amber-300 font-bold border-l border-slate-700 pl-2">
                {price}
              </span>
            )}
          </div>

          {/* Day / Night Toggle Switch Button */}
          <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-700 shadow-xl">
            <button
              onClick={() => setIsDayMode(true)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                isDayMode
                  ? "bg-amber-400 text-slate-950 shadow-md font-black"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Switch to Bright Day Mode with Sun"
            >
              <Sun size={12} className={isDayMode ? "text-slate-950" : "text-amber-400"} />
              <span>Day</span>
            </button>
            <button
              onClick={() => setIsDayMode(false)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                !isDayMode
                  ? "bg-indigo-600 text-white shadow-md font-black"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Switch to Blackish Night Mode with Moon & Stars"
            >
              <Moon size={12} className={!isDayMode ? "text-indigo-200" : "text-indigo-400"} />
              <span>Night</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
