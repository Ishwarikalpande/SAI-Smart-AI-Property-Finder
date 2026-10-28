import React from "react";
import {
  Car,
  Dumbbell,
  Waves,
  Trees,
  Shield,
  Building,
  Zap,
  Camera,
  Flame,
  Wifi,
  Sparkles,
  ArrowUpDown,
  Users,
  Compass,
} from "lucide-react";

interface AmenitySceneProps {
  amenities: string[];
  subtitle?: string;
  hasParking?: boolean;
}

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  parking: <Car className="w-5 h-5 text-teal-300" />,
  car: <Car className="w-5 h-5 text-teal-300" />,
  gym: <Dumbbell className="w-5 h-5 text-emerald-300" />,
  fitness: <Dumbbell className="w-5 h-5 text-emerald-300" />,
  pool: <Waves className="w-5 h-5 text-cyan-300" />,
  swimming: <Waves className="w-5 h-5 text-cyan-300" />,
  garden: <Trees className="w-5 h-5 text-green-300" />,
  park: <Trees className="w-5 h-5 text-green-300" />,
  security: <Shield className="w-5 h-5 text-amber-300" />,
  clubhouse: <Users className="w-5 h-5 text-indigo-300" />,
  club: <Users className="w-5 h-5 text-indigo-300" />,
  lift: <ArrowUpDown className="w-5 h-5 text-blue-300" />,
  elevator: <ArrowUpDown className="w-5 h-5 text-blue-300" />,
  power: <Zap className="w-5 h-5 text-yellow-300" />,
  backup: <Zap className="w-5 h-5 text-yellow-300" />,
  cctv: <Camera className="w-5 h-5 text-rose-300" />,
  wifi: <Wifi className="w-5 h-5 text-sky-300" />,
  gas: <Flame className="w-5 h-5 text-orange-300" />,
  vastu: <Compass className="w-5 h-5 text-purple-300" />,
};

function getAmenityIcon(name: string): React.ReactNode {
  const lower = name.toLowerCase();
  for (const [key, icon] of Object.entries(AMENITY_ICONS)) {
    if (lower.includes(key)) {
      return icon;
    }
  }
  return <Sparkles className="w-5 h-5 text-teal-300" />;
}

export const AmenityScene: React.FC<AmenitySceneProps> = ({
  amenities,
  subtitle,
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 text-center z-20">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs font-semibold uppercase tracking-wider mb-2 backdrop-blur-md">
        <Sparkles className="w-3.5 h-3.5" />
        Verified Project Amenities
      </div>

      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight mb-2 drop-shadow-lg">
        Curated Lifestyle Amenities
      </h2>
      <p className="text-slate-300 text-sm max-w-md mx-auto mb-6 drop-shadow">
        {subtitle || "Premium facilities provided exclusively for residents"}
      </p>

      {/* Grid of Amenity Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 max-h-[50vh] overflow-y-auto pr-1">
        {amenities.map((amenity, idx) => (
          <div
            key={idx}
            style={{ animationDelay: `${idx * 60}ms` }}
            className="sai-walkthrough-glass p-3.5 sm:p-4 rounded-xl flex flex-col items-center justify-center text-center gap-2 border border-white/10 hover:border-teal-400/40 transition-all sai-animate-scale-in"
          >
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shadow-inner">
              {getAmenityIcon(amenity)}
            </div>
            <span className="text-xs sm:text-sm font-semibold text-slate-100 tracking-wide line-clamp-2">
              {amenity}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
