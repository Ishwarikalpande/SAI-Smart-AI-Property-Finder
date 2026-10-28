import React from "react";
import { X, Compass, Layers, CheckCircle, ArrowRight } from "lucide-react";
import { FurnishedRoom } from "./furnishedFlatData";

interface FurnishedFloorPlanModalProps {
  rooms: FurnishedRoom[];
  currentRoomId: string;
  onSelectRoom: (roomId: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const FurnishedFloorPlanModal: React.FC<FurnishedFloorPlanModalProps> = ({
  rooms,
  currentRoomId,
  onSelectRoom,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const currentRoom = rooms.find((r) => r.id === currentRoomId) || rooms[0];

  // Room SVG layout coordinates in a normalized 800x600 architectural grid
  const roomZones = [
    {
      id: "entrance",
      name: "Entrance & Foyer",
      x: 360,
      y: 440,
      w: 140,
      h: 120,
      labelX: 430,
      labelY: 505,
      door: "Main Door",
    },
    {
      id: "living-room",
      name: "Living Room",
      x: 320,
      y: 180,
      w: 260,
      h: 240,
      labelX: 450,
      labelY: 300,
      door: "Balcony Access",
    },
    {
      id: "dining-area",
      name: "Dining Area",
      x: 180,
      y: 180,
      w: 120,
      h: 180,
      labelX: 240,
      labelY: 275,
      door: "Open Plan",
    },
    {
      id: "modular-kitchen",
      name: "Modular Kitchen",
      x: 180,
      y: 380,
      w: 160,
      h: 180,
      labelX: 260,
      labelY: 475,
      door: "Utility Nook",
    },
    {
      id: "master-bedroom",
      name: "Master Bedroom",
      x: 600,
      y: 80,
      w: 220,
      h: 230,
      labelX: 710,
      labelY: 200,
      door: "Ensuite Door",
    },
    {
      id: "second-bedroom",
      name: "Second Bedroom",
      x: 600,
      y: 330,
      w: 220,
      h: 210,
      labelX: 710,
      labelY: 440,
      door: "Study Nook",
    },
    {
      id: "bathroom",
      name: "Bathrooms",
      x: 480,
      y: 40,
      w: 110,
      h: 120,
      labelX: 535,
      labelY: 105,
      door: "Attached & Common",
    },
    {
      id: "balcony",
      name: "Balcony Deck",
      x: 320,
      y: 40,
      w: 140,
      h: 120,
      labelX: 390,
      labelY: 105,
      door: "Glass Sliding",
    },
  ];

  const isZoneActive = (zId: string) => {
    if (zId === currentRoomId) return true;
    if ((zId === "modular-kitchen" || zId === "kitchen") && (currentRoomId === "modular-kitchen" || currentRoomId === "kitchen")) return true;
    if ((zId === "second-bedroom" || zId === "bedroom-2") && (currentRoomId === "second-bedroom" || currentRoomId === "bedroom-2")) return true;
    if ((zId === "bathroom" || zId === "attached-bathroom" || zId === "common-bathroom") && (currentRoomId === "bathroom" || currentRoomId === "attached-bathroom" || currentRoomId === "common-bathroom")) return true;
    return false;
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-slate-900 border border-teal-500/40 rounded-3xl overflow-hidden shadow-[0_16px_60px_rgba(0,109,106,0.4)] flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/80 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-500/40">
              <Layers size={18} />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-white">
                Interactive Architectural Floor Plan
              </h3>
              <p className="text-teal-300/80 text-xs">
                Click any room on the blueprint to teleport the 360° virtual tour
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Area: Left Blueprint SVG + Right Room Info Card */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 sm:p-6">
          {/* Blueprint SVG Diagram (2 cols) */}
          <div className="lg:col-span-2 bg-slate-950/90 rounded-2xl p-3 border border-slate-800 flex items-center justify-center relative overflow-hidden">
            {/* North Indicator */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-700 text-[10px] text-teal-300 font-mono font-bold">
              <Compass size={14} className="text-teal-400" />
              <span>NORTH</span>
            </div>

            <svg
              viewBox="140 20 700 560"
              className="w-full h-auto max-h-[460px] select-none"
              style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.5))" }}
            >
              {/* Outer Flat Boundary Wall */}
              <rect
                x="160"
                y="30"
                width="680"
                height="540"
                fill="none"
                stroke="#334155"
                strokeWidth="8"
                rx="8"
              />

              {/* Grid Lines */}
              <defs>
                <pattern id="archGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(45,212,191,0.06)" strokeWidth="1" />
                </pattern>
              </defs>
              <rect x="160" y="30" width="680" height="540" fill="url(#archGrid)" />

              {/* Individual Rooms */}
              {roomZones.map((z) => {
                const isActive = isZoneActive(z.id);
                const roomInfo = rooms.find((r) => r.id === z.id || (z.id === "bathroom" && (r.id === "attached-bathroom" || r.id === "common-bathroom")));

                return (
                  <g
                    key={z.id}
                    onClick={() => {
                      onSelectRoom(z.id);
                      onClose();
                    }}
                    className="cursor-pointer transition-all duration-200 group/room"
                  >
                    {/* Room Rectangle Area */}
                    <rect
                      x={z.x}
                      y={z.y}
                      width={z.w}
                      height={z.h}
                      rx="6"
                      fill={isActive ? "rgba(20, 184, 166, 0.28)" : "rgba(30, 41, 59, 0.6)"}
                      stroke={isActive ? "#2DD4BF" : "#475569"}
                      strokeWidth={isActive ? "3" : "1.5"}
                      strokeDasharray={isActive ? "none" : "none"}
                      className="transition-colors group-hover/room:fill-teal-500/20 group-hover/room:stroke-teal-400"
                    />

                    {/* Room Label */}
                    <text
                      x={z.labelX}
                      y={z.labelY - 10}
                      textAnchor="middle"
                      fill={isActive ? "#5EEAD4" : "#F1F5F9"}
                      fontSize={isActive ? "13" : "12"}
                      fontWeight="bold"
                      className="pointer-events-none transition-colors"
                    >
                      {z.name}
                    </text>

                    {/* Dimensions subtitle */}
                    <text
                      x={z.labelX}
                      y={z.labelY + 8}
                      textAnchor="middle"
                      fill={isActive ? "#99F6E4" : "#94A3B8"}
                      fontSize="10"
                      fontFamily="monospace"
                      className="pointer-events-none"
                    >
                      {roomInfo?.dimensions || "Standard"}
                    </text>

                    {/* Active Camera Viewpoint Radar / Pulse */}
                    {isActive && (
                      <circle
                        cx={z.labelX}
                        cy={z.labelY + 28}
                        r="6"
                        fill="#2DD4BF"
                        className="animate-ping"
                      />
                    )}
                    {isActive && (
                      <circle
                        cx={z.labelX}
                        cy={z.labelY + 28}
                        r="4"
                        fill="#0F766E"
                        stroke="#5EEAD4"
                        strokeWidth="2"
                      />
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Right Selected Room Details Card */}
          <div className="bg-slate-950/80 rounded-2xl p-5 border border-slate-800 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-1 rounded-md bg-teal-500/20 text-teal-300 font-mono text-[10px] uppercase font-bold tracking-wider">
                  Active Room
                </span>
                <span className="text-slate-400 text-xs">{currentRoom.carpetAreaSqft} sq.ft carpet</span>
              </div>

              <h4 className="text-xl font-black text-white">{currentRoom.name}</h4>
              <p className="text-teal-200 text-xs font-mono mt-0.5">{currentRoom.dimensions}</p>
              <p className="text-slate-300 text-xs leading-relaxed mt-2.5">{currentRoom.subtitle}</p>

              {/* Furnishing Checklist */}
              <div className="mt-4 pt-3 border-t border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Installed Furnishings ({currentRoom.furnitureList.length} items):
                </span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                  {currentRoom.furnitureList.map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center gap-2 text-xs text-slate-200 bg-slate-900/60 p-2 rounded-lg border border-slate-800/80"
                    >
                      <CheckCircle size={13} className="text-teal-400 flex-shrink-0" />
                      <span className="truncate">{f.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              <span>Explore in 360° Virtual Tour</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
