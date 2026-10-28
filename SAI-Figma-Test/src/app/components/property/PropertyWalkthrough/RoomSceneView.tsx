import React, { useState } from "react";
import {
  Sofa,
  UtensilsCrossed,
  BedDouble,
  Bath,
  SunMedium,
  Sparkles,
  Maximize2,
  Layers,
  Wind,
  Check,
  Camera,
  Grid3X3,
  Eye,
  ShieldCheck,
  Building2,
} from "lucide-react";
import { WalkthroughScene } from "./PropertyScene";
import { PropertyInfoOverlay } from "./PropertyInfoOverlay";

interface RoomSceneViewProps {
  scene: WalkthroughScene;
  index: number;
  cleanImageUrl: string | null;
  hasValidImage: boolean;
  cameraAnimClass: string;
  isReducedMotion: boolean;
  onImageLoaded: () => void;
  onImageError: () => void;
}

interface RoomConfig {
  type: string;
  name: string;
  tagline: string;
  icon: React.ReactNode;
  defaultDimensions: string;
  sqftEstimate: string;
  ambientColor: string;
  gridColor: string;
  highlights: { title: string; desc: string }[];
  hotspots: { x: number; y: number; label: string }[];
}

const ROOM_CONFIGS: Record<string, RoomConfig> = {
  living_room: {
    type: "living_room",
    name: "Living Room & Lounge",
    tagline: "Spacious central living, dining & entertaining area",
    icon: <Sofa className="w-5 h-5 text-amber-300" />,
    defaultDimensions: "16'0\" × 12'6\"",
    sqftEstimate: "200 sq.ft",
    ambientColor: "from-amber-500/15 via-teal-900/20 to-slate-950",
    gridColor: "rgba(245, 158, 11, 0.15)",
    highlights: [
      { title: "Open Concept", desc: "Seamless flow to dining area" },
      { title: "Vitrified Flooring", desc: "Polished 800×800mm tiles" },
      { title: "Natural Sunlight", desc: "Wide floor-to-ceiling balcony aperture" },
      { title: "Smart Connectivity", desc: "TV, Internet & AC points pre-installed" },
    ],
    hotspots: [
      { x: 30, y: 48, label: "Lounge Seating Zone" },
      { x: 68, y: 38, label: "Entertainment & Media Wall" },
      { x: 82, y: 65, label: "Balcony Access French Door" },
    ],
  },
  kitchen: {
    type: "kitchen",
    name: "Modular Kitchen & Dining",
    tagline: "Ergonomic culinary space with utility provisions",
    icon: <UtensilsCrossed className="w-5 h-5 text-orange-300" />,
    defaultDimensions: "10'6\" × 8'0\"",
    sqftEstimate: "84 sq.ft",
    ambientColor: "from-orange-500/15 via-teal-900/20 to-slate-950",
    gridColor: "rgba(249, 115, 22, 0.15)",
    highlights: [
      { title: "Granite Platform", desc: "High-grade scratch-resistant counter" },
      { title: "Modular Cabinetry", desc: "Soft-close hydraulic overhead units" },
      { title: "Dedicated Utility", desc: "Washing machine & sink connection" },
      { title: "Piped Gas Provision", desc: "Safe concealed copper gas pipeline" },
    ],
    hotspots: [
      { x: 38, y: 45, label: "L-Shaped Cooking Counter" },
      { x: 55, y: 32, label: "Chimney & Exhaust Vent" },
      { x: 75, y: 55, label: "Refrigerator & Pantry Niche" },
    ],
  },
  bedroom: {
    type: "bedroom",
    name: "Master Bedroom Suite",
    tagline: "Restful private sanctuary with attached ensuite bath",
    icon: <BedDouble className="w-5 h-5 text-teal-300" />,
    defaultDimensions: "14'0\" × 12'0\"",
    sqftEstimate: "168 sq.ft",
    ambientColor: "from-teal-500/15 via-cyan-950/25 to-slate-950",
    gridColor: "rgba(45, 212, 191, 0.15)",
    highlights: [
      { title: "King Size Layout", desc: "Ample clearance for dual nightstands" },
      { title: "Full-Height Wardrobe", desc: "Dedicated wardrobe recess" },
      { title: "Ensuite Access", desc: "Direct private bathroom entry" },
      { title: "Scenic Window View", desc: "Large acoustic glass windows" },
    ],
    hotspots: [
      { x: 48, y: 52, label: "King Bed & Headboard" },
      { x: 22, y: 40, label: "Built-in Wardrobe Niche" },
      { x: 78, y: 45, label: "Ensuite Bathroom Door" },
    ],
  },
  bathroom: {
    type: "bathroom",
    name: "Bathrooms & Sanitary",
    tagline: "Modern fittings with glass partition & concealed plumbing",
    icon: <Bath className="w-5 h-5 text-sky-300" />,
    defaultDimensions: "8'0\" × 5'6\"",
    sqftEstimate: "44 sq.ft",
    ambientColor: "from-sky-500/15 via-blue-950/25 to-slate-950",
    gridColor: "rgba(56, 189, 248, 0.15)",
    highlights: [
      { title: "Glass Shower Enclosure", desc: "Wet & dry zone segregation" },
      { title: "Chrome CP Fittings", desc: "Concealed diverter & rain shower" },
      { title: "Anti-Skid Flooring", desc: "Textured safety ceramic tiles" },
      { title: "24/7 Hot Water", desc: "Geyser & solar heating points" },
    ],
    hotspots: [
      { x: 35, y: 42, label: "Rain Shower & Glass Cubicle" },
      { x: 62, y: 50, label: "Vanity Basin & LED Mirror" },
      { x: 78, y: 38, label: "Wall-Hung WC & Concealed Cistern" },
    ],
  },
  balcony: {
    type: "balcony",
    name: "Scenic Balcony & Deck",
    tagline: "Private outdoor terrace with panoramic skyline views",
    icon: <SunMedium className="w-5 h-5 text-emerald-300" />,
    defaultDimensions: "11'0\" × 4'6\"",
    sqftEstimate: "50 sq.ft",
    ambientColor: "from-emerald-500/15 via-teal-950/25 to-slate-950",
    gridColor: "rgba(52, 211, 153, 0.15)",
    highlights: [
      { title: "Panoramic View", desc: "Unobstructed city & green views" },
      { title: "Toughened Glass Railing", desc: "Safe SS-304 hardware" },
      { title: "Weatherproof Deck", desc: "Anti-slip timber finish tiles" },
      { title: "Sit-Out Comfort", desc: "Coffee corner & vertical planter space" },
    ],
    hotspots: [
      { x: 45, y: 55, label: "Sit-out Bistro Table Area" },
      { x: 25, y: 42, label: "Vertical Planter Wall" },
      { x: 75, y: 48, label: "Toughened Glass Balustrade" },
    ],
  },
};

export const RoomSceneView: React.FC<RoomSceneViewProps> = ({
  scene,
  cleanImageUrl,
  hasValidImage,
  cameraAnimClass,
  isReducedMotion,
  onImageLoaded,
  onImageError,
}) => {
  const data = scene.data || {};
  const sceneId = scene.id.toLowerCase();

  // Resolve matching room config
  let configKey = "living_room";
  if (sceneId.includes("kitchen")) configKey = "kitchen";
  else if (sceneId.includes("bed")) configKey = "bedroom";
  else if (sceneId.includes("bath")) configKey = "bathroom";
  else if (sceneId.includes("balcony")) configKey = "balcony";
  else if (sceneId.includes("living") || sceneId.includes("hall")) configKey = "living_room";

  const room = ROOM_CONFIGS[configKey] || ROOM_CONFIGS["living_room"];

  // User toggle between photo view and architectural 3D blueprint
  const [viewMode, setViewMode] = useState<"photo" | "blueprint">(
    hasValidImage ? "photo" : "blueprint"
  );

  const isShowingPhoto = hasValidImage && viewMode === "photo";

  return (
    <div className="relative w-full h-full flex flex-col justify-between overflow-hidden select-none">
      {/* ── BACKGROUND LAYER ────────────────────────────────────────────── */}
      {isShowingPhoto ? (
        <img
          key={cleanImageUrl}
          src={cleanImageUrl!}
          alt={scene.title}
          onLoad={onImageLoaded}
          onError={onImageError}
          className={`absolute inset-0 w-full h-full object-cover z-0 ${cameraAnimClass}`}
        />
      ) : (
        /* ── ANIMATED ARCHITECTURAL 3D ROOM BLUEPRINT SIMULATION ────────── */
        <div className="absolute inset-0 z-0 bg-[#07111e] overflow-hidden flex items-center justify-center">
          {/* Ambient room lighting gradient */}
          <div
            className={`absolute inset-0 bg-gradient-to-br ${room.ambientColor} opacity-90 transition-all duration-700`}
          />

          {/* Isometric Perspective Grid Lines */}
          <svg
            className="absolute inset-0 w-full h-full opacity-25"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id={`grid-${configKey}`}
                width="60"
                height="35"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 60 0 L 0 17.5 L 60 35 L 120 17.5 Z"
                  fill="none"
                  stroke="rgba(45, 212, 191, 0.35)"
                  strokeWidth="0.8"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#grid-${configKey})`} />
          </svg>

          {/* Central 3D Architectural Room Wireframe SVG */}
          <div className="relative z-10 w-full max-w-2xl px-6 aspect-[16/9] flex items-center justify-center">
            <svg
              viewBox="0 0 800 450"
              className="w-full h-full drop-shadow-[0_10px_35px_rgba(0,0,0,0.8)]"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Floor Plane Isometric Base */}
              <polygon
                points="400,100 700,240 400,380 100,240"
                fill="rgba(15, 23, 42, 0.75)"
                stroke="rgba(45, 212, 191, 0.6)"
                strokeWidth="2"
                strokeDasharray="6 3"
              />

              {/* Room Corner Vertical Pillars */}
              <line x1="100" y1="240" x2="100" y2="120" stroke="rgba(45, 212, 191, 0.35)" strokeWidth="1.5" />
              <line x1="400" y1="100" x2="400" y2="10" stroke="rgba(45, 212, 191, 0.45)" strokeWidth="1.5" />
              <line x1="700" y1="240" x2="700" y2="120" stroke="rgba(45, 212, 191, 0.35)" strokeWidth="1.5" />

              {/* Back Wall Guides */}
              <polygon points="100,120 400,10 400,100 100,240" fill="rgba(45, 212, 191, 0.04)" />
              <polygon points="400,10 700,120 700,240 400,100" fill="rgba(20, 184, 166, 0.06)" />

              {/* Specific Room Furniture & Layout Outlines */}
              {configKey === "living_room" && (
                <g className="sai-animate-scale-in">
                  {/* Sofa Outline */}
                  <polygon
                    points="320,240 460,180 500,200 360,260"
                    fill="rgba(245, 158, 11, 0.25)"
                    stroke="#F59E0B"
                    strokeWidth="2"
                  />
                  {/* Coffee Table */}
                  <polygon
                    points="380,265 430,245 450,255 400,275"
                    fill="rgba(255, 255, 255, 0.2)"
                    stroke="rgba(255, 255, 255, 0.7)"
                    strokeWidth="1.5"
                  />
                  {/* TV Media Console Wall */}
                  <polygon
                    points="200,185 270,150 280,155 210,190"
                    fill="rgba(45, 212, 191, 0.3)"
                    stroke="#2DD4BF"
                    strokeWidth="2"
                  />
                  {/* French Window to Balcony */}
                  <line x1="560" y1="170" x2="650" y2="215" stroke="#38BDF8" strokeWidth="4" />
                </g>
              )}

              {configKey === "kitchen" && (
                <g className="sai-animate-scale-in">
                  {/* L-Shaped Kitchen Countertop */}
                  <polygon
                    points="260,200 380,140 420,160 300,220"
                    fill="rgba(249, 115, 22, 0.25)"
                    stroke="#F97316"
                    strokeWidth="2"
                  />
                  <polygon
                    points="420,160 540,215 510,230 390,175"
                    fill="rgba(249, 115, 22, 0.25)"
                    stroke="#F97316"
                    strokeWidth="2"
                  />
                  {/* Cooktop Burner Marks */}
                  <ellipse cx="340" cy="180" rx="14" ry="7" fill="none" stroke="#FDBA74" strokeWidth="1.5" />
                  <ellipse cx="375" cy="165" rx="12" ry="6" fill="none" stroke="#FDBA74" strokeWidth="1.5" />
                  {/* Sink Basin */}
                  <ellipse cx="460" cy="190" rx="18" ry="9" fill="rgba(56, 189, 248, 0.3)" stroke="#38BDF8" strokeWidth="1.5" />
                </g>
              )}

              {configKey === "bedroom" && (
                <g className="sai-animate-scale-in">
                  {/* King Bed Base */}
                  <polygon
                    points="320,220 480,145 540,175 380,250"
                    fill="rgba(45, 212, 191, 0.25)"
                    stroke="#2DD4BF"
                    strokeWidth="2"
                  />
                  {/* Headboard */}
                  <polygon
                    points="480,145 540,175 540,145 480,115"
                    fill="rgba(45, 212, 191, 0.45)"
                    stroke="#2DD4BF"
                    strokeWidth="2"
                  />
                  {/* Pillows */}
                  <polygon points="450,155 490,135 505,142 465,162" fill="white" opacity="0.6" />
                  <polygon points="485,170 525,150 540,157 500,177" fill="white" opacity="0.6" />
                  {/* Wardrobe Line */}
                  <polygon
                    points="180,195 240,165 250,170 190,200"
                    fill="rgba(255, 255, 255, 0.2)"
                    stroke="#94A3B8"
                    strokeWidth="1.5"
                  />
                </g>
              )}

              {configKey === "bathroom" && (
                <g className="sai-animate-scale-in">
                  {/* Walk-in Shower Enclosure Base */}
                  <polygon
                    points="260,200 360,150 400,170 300,220"
                    fill="rgba(56, 189, 248, 0.25)"
                    stroke="#38BDF8"
                    strokeWidth="2"
                  />
                  {/* Glass Partition Wall */}
                  <polygon points="360,150 400,170 400,90 360,70" fill="rgba(56, 189, 248, 0.2)" stroke="#7DD3FC" strokeWidth="1.5" />
                  {/* Vanity Unit */}
                  <polygon
                    points="420,180 500,220 480,230 400,190"
                    fill="rgba(255, 255, 255, 0.25)"
                    stroke="#E2E8F0"
                    strokeWidth="1.5"
                  />
                </g>
              )}

              {configKey === "balcony" && (
                <g className="sai-animate-scale-in">
                  {/* Outdoor Timber Deck */}
                  <polygon
                    points="240,240 560,135 620,165 300,270"
                    fill="rgba(52, 211, 153, 0.22)"
                    stroke="#34D399"
                    strokeWidth="2"
                  />
                  {/* Glass Railing */}
                  <line x1="240" y1="240" x2="300" y2="270" stroke="#67E8F9" strokeWidth="3" />
                  <line x1="300" y1="270" x2="620" y2="165" stroke="#67E8F9" strokeWidth="3" />
                  {/* Bistro Chairs / Planter Outlines */}
                  <circle cx="410" cy="205" r="14" fill="rgba(255,255,255,0.25)" stroke="#34D399" strokeWidth="1.5" />
                  <circle cx="470" cy="185" r="14" fill="rgba(255,255,255,0.25)" stroke="#34D399" strokeWidth="1.5" />
                </g>
              )}

              {/* Dimension Callout Lines */}
              <g className="text-xs font-mono" fill="#2DD4BF" opacity="0.85">
                <text x="210" y="275" fill="#2DD4BF" fontSize="12" fontWeight="bold">
                  {room.defaultDimensions}
                </text>
                <text x="560" y="125" fill="#2DD4BF" fontSize="12" fontWeight="bold">
                  {room.sqftEstimate}
                </text>
              </g>
            </svg>

            {/* Pulsing Hotspot Callout Badges */}
            {room.hotspots.map((h, i) => (
              <div
                key={i}
                style={{ left: `${h.x}%`, top: `${h.y}%` }}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/85 backdrop-blur-md border border-teal-400/40 text-teal-300 text-[10px] sm:text-xs font-bold shadow-xl animate-pulse cursor-default"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                <span>{h.label}</span>
              </div>
            ))}
          </div>

          {/* Architectural Badge & Subtitle */}
          <div className="absolute top-16 left-6 z-20 hidden sm:flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-teal-400/30 text-teal-300 text-xs font-bold uppercase tracking-wider shadow-lg">
              <Grid3X3 className="w-3.5 h-3.5" />
              Architectural Room Simulation
            </span>
            <span className="text-slate-400 text-xs">
              • Verified room geometry & specifications
            </span>
          </div>
        </div>
      )}

      {/* ── TOP ACTION BAR: ROOM TYPE PILL & VIEW SWITCHER ─────────────── */}
      <div className="relative z-30 p-4 sm:p-6 flex items-start justify-between gap-3 pointer-events-auto">
        {/* Room Identification Pill */}
        <div className="flex items-center gap-2.5 bg-slate-950/80 backdrop-blur-md p-2 sm:px-4 sm:py-2.5 rounded-2xl border border-white/15 shadow-xl">
          <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center shrink-0">
            {room.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-teal-300">
                Room Inspection
              </span>
              <span className="text-white/40 text-[10px]">•</span>
              <span className="text-slate-300 text-[10px] font-mono">
                {room.defaultDimensions} ({room.sqftEstimate})
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-extrabold text-white leading-tight">
              {scene.title || room.name}
            </h3>
          </div>
        </div>

        {/* View Switcher: Photo vs 3D Blueprint (when photo exists) */}
        {hasValidImage && (
          <div className="flex items-center bg-slate-950/80 backdrop-blur-md p-1 rounded-xl border border-white/15 shadow-lg">
            <button
              onClick={() => setViewMode("photo")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === "photo"
                  ? "bg-teal-500 text-slate-950 shadow-md"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Photo</span>
            </button>
            <button
              onClick={() => setViewMode("blueprint")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === "blueprint"
                  ? "bg-teal-500 text-slate-950 shadow-md"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>3D Blueprint</span>
            </button>
          </div>
        )}
      </div>

      {/* ── BOTTOM AREA: STRUCTURED ROOM HIGHLIGHTS & PROPERTY OVERLAY ─── */}
      <div className="relative z-30 p-4 sm:p-6 flex flex-col gap-3 pointer-events-auto">
        {/* Structured Room Features Ribbon */}
        <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-2 max-w-4xl">
          {room.highlights.map((item, idx) => (
            <div
              key={idx}
              className="sai-walkthrough-glass px-3 py-2 rounded-xl flex items-center gap-2 border border-white/10 shadow-lg"
            >
              <div className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-white truncate">{item.title}</p>
                <p className="text-[9px] text-slate-300 truncate">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Factual Property Information Overlay */}
        <div className="w-full">
          <PropertyInfoOverlay
            sceneType={scene.title || room.name}
            title={data.title || data.label || room.name}
            subtitle={
              scene.subtitle ||
              [data.city || data.location, data.area, data.price].filter(Boolean).join(" • ")
            }
            bhk={data.bhk || (data.count as number)}
            area={data.area}
            price={data.price}
            location={data.location}
            furnishing={data.furnishing}
            badge={data.badge}
            isVerified={data.is_verified}
            isRera={data.is_rera}
            features={data.features}
          />
        </div>
      </div>
    </div>
  );
};
