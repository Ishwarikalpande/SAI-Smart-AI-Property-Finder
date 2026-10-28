import React, { useMemo } from "react";
import { Property3DRoom } from "./PropertyScene";
import { Compass, Maximize2, Minimize2 } from "lucide-react";

interface FloorPlanMiniMapProps {
  rooms: Property3DRoom[];
  currentRoomId: string;
  cameraPos: [number, number, number];
  cameraLookAt: [number, number, number];
  onSelectRoom: (roomId: string) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export const FloorPlanMiniMap: React.FC<FloorPlanMiniMapProps> = ({
  rooms,
  currentRoomId,
  cameraPos,
  cameraLookAt,
  onSelectRoom,
  isExpanded = false,
  onToggleExpand
}) => {
  // Calculate bounding box of all rooms to normalize 2D map coordinate scale
  const bounds = useMemo(() => {
    let minX = -6;
    let maxX = 6;
    let minZ = -18;
    let maxZ = 4;

    (rooms || []).forEach((r) => {
      const posX = r.position?.x ?? 0;
      const posZ = r.position?.z ?? 0;
      const w = (typeof r.dimensions === "object" && r.dimensions?.width) ? r.dimensions.width : 4.0;
      const l = (typeof r.dimensions === "object" && r.dimensions?.length) ? r.dimensions.length : 4.0;
      const hw = w / 2;
      const hl = l / 2;
      minX = Math.min(minX, posX - hw);
      maxX = Math.max(maxX, posX + hw);
      minZ = Math.min(minZ, posZ - hl);
      maxZ = Math.max(maxZ, posZ + hl);
    });

    const pad = 1.0;
    return {
      minX: minX - pad,
      maxX: maxX + pad,
      minZ: minZ - pad,
      maxZ: maxZ + pad,
      width: maxX - minX + pad * 2,
      depth: maxZ - minZ + pad * 2
    };
  }, [rooms]);

  const mapW = isExpanded ? 320 : 200;
  const mapH = isExpanded ? 240 : 160;

  // Transform world (X, Z) into SVG pixels
  const toSvgX = (x: number) => {
    return ((x - bounds.minX) / bounds.width) * (mapW - 20) + 10;
  };

  const toSvgY = (z: number) => {
    // Note: in 3D, -Z goes deeper into flat, +Z is entrance/front
    return ((z - bounds.minZ) / bounds.depth) * (mapH - 24) + 12;
  };

  // Camera direction angle on the horizontal plane
  const dx = cameraLookAt[0] - cameraPos[0];
  const dz = cameraLookAt[2] - cameraPos[2];
  const angleRad = Math.atan2(dz, dx);
  const angleDeg = (angleRad * 180) / Math.PI;

  const camSvgX = Math.max(6, Math.min(mapW - 6, toSvgX(cameraPos[0])));
  const camSvgY = Math.max(6, Math.min(mapH - 6, toSvgY(cameraPos[2])));

  return (
    <div
      className={`relative rounded-2xl bg-slate-900/90 border border-teal-500/40 backdrop-blur-xl shadow-2xl p-2 select-none transition-all duration-300 pointer-events-auto ${
        isExpanded ? "w-80 h-64" : "w-52 h-44"
      }`}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-1.5 pb-1 border-b border-slate-700/60 mb-1">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-teal-300 uppercase tracking-wider">
          <Compass className="w-3 h-3 text-teal-400" />
          <span>Interactive Floor Plan</span>
        </div>
        {onToggleExpand && (
          <button
            onClick={onToggleExpand}
            className="p-1 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
            title={isExpanded ? "Minimize mini-map" : "Expand mini-map"}
          >
            {isExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          </button>
        )}
      </div>

      {/* SVG architectural drawing */}
      <svg
        width={mapW}
        height={mapH - 28}
        className="rounded-xl bg-slate-950 border border-slate-800"
      >
        {/* Architectural grid lines */}
        <defs>
          <pattern id="miniGrid" width="16" height="16" patternUnits="userSpaceOnUse">
            <path d="M 16 0 L 0 0 0 16" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#miniGrid)" />

        {/* Room rectangles */}
        {(rooms || []).map((r) => {
          const w = (typeof r.dimensions === "object" && r.dimensions?.width) ? r.dimensions.width : 4.0;
          const l = (typeof r.dimensions === "object" && r.dimensions?.length) ? r.dimensions.length : 4.0;
          const posX = r.position?.x ?? 0;
          const posZ = r.position?.z ?? 0;
          const hw = w / 2;
          const hl = l / 2;
          const rx = toSvgX(posX - hw);
          const ry = toSvgY(posZ - hl);
          const rw = Math.max(12, (w / bounds.width) * (mapW - 20));
          const rh = Math.max(12, (l / bounds.depth) * (mapH - 24));
          const isActive = r.id === currentRoomId;

          return (
            <g
              key={r.id}
              onClick={() => onSelectRoom(r.id)}
              className="cursor-pointer transition-all hover:opacity-100"
            >
              <rect
                x={rx}
                y={ry}
                width={rw}
                height={rh}
                rx={4}
                className={`transition-colors duration-200 ${
                  isActive
                    ? "fill-teal-500/30 stroke-teal-400 stroke-2"
                    : "fill-slate-800/60 hover:fill-slate-700/80 stroke-slate-600/80 stroke-1"
                }`}
              />
              {/* Room name label inside rectangle */}
              <text
                x={rx + rw / 2}
                y={ry + rh / 2 + 3}
                textAnchor="middle"
                className={`text-[8px] font-bold pointer-events-none ${
                  isActive ? "fill-teal-200" : "fill-slate-300"
                }`}
              >
                {r.name.length > 10 ? r.name.slice(0, 8) + ".." : r.name}
              </text>
            </g>
          );
        })}

        {/* Live Camera Position Marker & FOV Cone */}
        <g transform={`translate(${camSvgX}, ${camSvgY})`}>
          {/* View direction cone */}
          <path
            d="M 0 0 L 18 -10 L 18 10 Z"
            transform={`rotate(${angleDeg})`}
            fill="rgba(45, 212, 191, 0.25)"
            stroke="rgba(45, 212, 191, 0.6)"
            strokeWidth="0.8"
          />
          {/* Pulsing camera dot */}
          <circle r="6" fill="#14b8a6" className="animate-ping opacity-50" />
          <circle r="4" fill="#2dd4bf" stroke="#ffffff" strokeWidth="1.5" />
        </g>
      </svg>

      {/* Mini status footer */}
      <div className="flex items-center justify-between pt-1 px-1 text-[9px] text-slate-400">
        <span>Click room to navigate</span>
        <span className="font-mono text-teal-300">● Live Camera</span>
      </div>
    </div>
  );
};
