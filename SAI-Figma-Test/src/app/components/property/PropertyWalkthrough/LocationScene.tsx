import React, { useEffect, useRef } from "react";
import { MapPin, Navigation, Compass, Train } from "lucide-react";

interface LocationSceneProps {
  city: string;
  locality: string;
  address?: string;
  state?: string;
  pincode?: string;
  latitude?: number | null;
  longitude?: number | null;
  distMetro?: string | null;
}

export const LocationScene: React.FC<LocationSceneProps> = ({
  city,
  locality,
  address,
  state,
  pincode,
  latitude,
  longitude,
  distMetro,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  const hasCoords = typeof latitude === "number" && typeof longitude === "number" && latitude !== 0 && longitude !== 0;

  useEffect(() => {
    if (!hasCoords || !mapContainerRef.current) return;

    try {
      const L = (window as any).L;
      if (!L) return;

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [latitude, longitude],
          zoom: 14,
          zoomControl: false,
          attributionControl: false,
          scrollWheelZoom: false,
          dragging: false,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 18,
        }).addTo(map);

        // Custom pinpoint icon
        const icon = L.divIcon({
          className: "custom-map-pin",
          html: `<div style="
            background: #006D6A;
            width: 32px;
            height: 32px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 2px solid white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
          "><div style="width: 10px; height: 10px; background: white; border-radius: 50%;"></div></div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        });

        L.marker([latitude, longitude], { icon }).addTo(map);
        mapInstanceRef.current = map;
      }
    } catch {
      // Leaflet failover safe
    }

    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {
          // ignore
        }
        mapInstanceRef.current = null;
      }
    };
  }, [hasCoords, latitude, longitude]);

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-4 z-20">
      <div className="sai-walkthrough-glass p-5 sm:p-6 rounded-2xl text-white border border-white/15 shadow-2xl sai-animate-slide-up">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2 text-teal-300 text-xs font-semibold uppercase tracking-wider">
          <Navigation className="w-4 h-4" />
          <span>Prime Urban Location</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-1">
          {locality}, {city}
        </h2>
        {state && (
          <p className="text-slate-300 text-xs sm:text-sm mb-4">
            {state} {pincode ? `• PIN ${pincode}` : ""}
          </p>
        )}

        {/* Address & Transit */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-[11px] text-slate-400 uppercase font-medium">Exact Address / Area</div>
              <div className="text-xs sm:text-sm text-slate-200 font-medium">
                {address || `${locality}, ${city}`}
              </div>
            </div>
          </div>

          {distMetro && (
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-start gap-2.5">
              <Train className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-[11px] text-slate-400 uppercase font-medium">Transit Connectivity</div>
                <div className="text-xs sm:text-sm text-emerald-200 font-semibold">{distMetro}</div>
              </div>
            </div>
          )}
        </div>

        {/* Embedded Mini-map or Blueprint Geo-Card */}
        {hasCoords ? (
          <div className="relative w-full h-44 sm:h-52 rounded-xl overflow-hidden border border-white/15 shadow-inner">
            <div ref={mapContainerRef} className="w-full h-full" />
            <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-[10px] text-teal-300 font-mono">
              Lat: {latitude?.toFixed(4)}, Long: {longitude?.toFixed(4)}
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10 flex items-center gap-3">
            <Compass className="w-6 h-6 text-teal-400 shrink-0" />
            <div className="text-xs text-slate-300">
              <span className="font-semibold text-white">{locality}</span> is centrally situated in {city}, offering seamless access to civic centers and prime regional corridors.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
