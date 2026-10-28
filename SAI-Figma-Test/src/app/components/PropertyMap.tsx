import React, { useEffect, useRef, useState } from "react";
import { MapPin, Navigation, ZoomIn, ZoomOut, Eye, Layers, AlertCircle, RefreshCw } from "lucide-react";
import { PropertyItem } from "../../api/properties";

interface PropertyMapProps {
  properties: PropertyItem[];
  selectedPropertyId?: number | null;
  onSelectProperty?: (id: number) => void;
  onViewPropertyDetails?: (id: number) => void;
  city?: string;
  height?: number | string;
}

const CITY_COORDS: Record<string, [number, number]> = {
  Pune: [18.5204, 73.8567],
  Mumbai: [19.076, 72.8777],
  Bangalore: [12.9716, 77.5946],
  Delhi: [28.6139, 77.209],
  "Delhi NCR": [28.6139, 77.209],
  Hyderabad: [17.385, 78.4867],
  Ahmedabad: [23.0225, 72.5714],
  Chennai: [13.0827, 80.2707],
  Kolkata: [22.5726, 88.3639],
  Thane: [19.2183, 72.9781],
  "Navi Mumbai": [19.033, 73.0297],
  Amravati: [20.9374, 77.7796],
  Nagpur: [21.1458, 79.0882],
  Nashik: [19.9975, 73.7898],
  Jaipur: [26.9124, 75.7873],
  Surat: [21.1702, 72.8311],
  Indore: [22.7196, 75.8577],
  Bhopal: [23.2599, 77.4126],
  Noida: [28.5355, 77.391],
  Gurgaon: [28.4595, 77.0266],
};

export const PropertyMap = ({
  properties = [],
  selectedPropertyId,
  onSelectProperty,
  onViewPropertyDetails,
  city = "Pune",
  height = 500,
}: PropertyMapProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Record<number, any>>({});
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Center based on city or default to Pune
  const defaultCenter = CITY_COORDS[city] || [18.5204, 73.8567];

  useEffect(() => {
    try {
      // Check if Leaflet is available on window
      const L = (window as any).L;
      if (!L || !mapContainerRef.current) {
        // Retry shortly if Leaflet is still loading
        const timer = setTimeout(() => {
          const retryL = (window as any).L;
          if (retryL && mapContainerRef.current && !mapInstanceRef.current) {
            initMap(retryL);
          }
        }, 500);
        return () => clearTimeout(timer);
      }

      initMap(L);
    } catch (err: any) {
      console.warn("PropertyMap initialization error:", err);
      setMapError("Map is currently unavailable");
    }

    function initMap(L: any) {
      try {
        // Destroy existing instance if any
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        const map = L.map(mapContainerRef.current, {
          center: defaultCenter,
          zoom: 12,
          zoomControl: false,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);

        mapInstanceRef.current = map;
        setMapLoaded(true);
        setMapError(null);
      } catch (err: any) {
        console.warn("Leaflet map instantiation error:", err);
        setMapError("Map is currently unavailable");
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {}
        mapInstanceRef.current = null;
      }
    };
  }, [city]);

  // Update markers when properties or mapLoaded changes
  useEffect(() => {
    try {
      const L = (window as any).L;
      const map = mapInstanceRef.current;
      if (!L || !map || !mapLoaded) return;

      // Clear previous markers
      Object.values(markersRef.current).forEach((marker: any) => {
        try {
          marker.remove();
        } catch {}
      });
      markersRef.current = {};

      const bounds: [number, number][] = [];

      properties.forEach((p) => {
        if (!p || !p.id) return;
        let lat = p.latitude;
        let lng = p.longitude;

        if (!lat || !lng) {
          const hash = (p.id * 9301 + 49297) % 233280;
          const offsetLat = ((hash % 100) - 50) * 0.0015;
          const offsetLng = (((hash / 100) % 100) - 50) * 0.0015;
          lat = defaultCenter[0] + offsetLat;
          lng = defaultCenter[1] + offsetLng;
        }

        bounds.push([lat, lng]);

        const rawPrice = Number(p.price) || 0;
        const formattedPrice =
          p.price_display ||
          (rawPrice >= 10000000
            ? `₹${(rawPrice / 10000000).toFixed(2)} Cr`
            : rawPrice >= 100000
            ? `₹${(rawPrice / 100000).toFixed(1)} L`
            : `₹${rawPrice.toLocaleString("en-IN")}`);

        const isSelected = selectedPropertyId === p.id;

        // Custom HTML Marker Icon
        const customIcon = L.divIcon({
          className: "sai-map-marker-container",
          html: `
            <div class="sai-pin ${isSelected ? "selected" : ""}" style="
              background: ${isSelected ? "#D97706" : "#006D6A"};
              color: #ffffff;
              font-size: 11px;
              font-weight: 800;
              padding: 4px 10px;
              border-radius: 9999px;
              box-shadow: 0 4px 14px rgba(0,0,0,0.3);
              white-space: nowrap;
              display: flex;
              align-items: center;
              gap: 4px;
              cursor: pointer;
              border: 2px solid #ffffff;
              transform: translate(-50%, -50%);
              transition: all 0.2s ease-in-out;
            ">
              <span>${formattedPrice}</span>
            </div>
          `,
          iconSize: [60, 24],
          iconAnchor: [30, 12],
        });

        const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);

        const imageUrl =
          p.media && p.media.length > 0
            ? (typeof p.media[0] === "string" ? p.media[0] : (p.media[0]?.url || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&q=80"))
            : "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&q=80";

        const safeTitle = p.title || "Property Listing";
        const popupHtml = `
          <div style="font-family: inherit; width: 220px; overflow: hidden; border-radius: 12px;">
            <img src="${imageUrl}" alt="${safeTitle}" style="width: 100%; height: 110px; object-fit: cover; border-radius: 8px 8px 0 0;" />
            <div style="padding: 10px;">
              <div style="font-weight: 800; font-size: 13px; color: #1e293b; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${safeTitle}
              </div>
              <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">
                ${p.bhk ? `${p.bhk} BHK • ` : ""}${p.locality || ""}, ${p.city || ""}
              </div>
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                <span style="font-weight: 800; color: #006D6A; font-size: 14px;">${formattedPrice}</span>
                ${p.is_rera ? '<span style="background: #E6F4F2; color: #006D6A; font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 4px;">RERA</span>' : ""}
              </div>
              <button id="view-prop-btn-${p.id}" style="
                width: 100%;
                background: #006D6A;
                color: #ffffff;
                border: none;
                padding: 6px 0;
                border-radius: 6px;
                font-weight: 700;
                font-size: 11px;
                cursor: pointer;
              ">View Details</button>
            </div>
          </div>
        `;

        marker.bindPopup(popupHtml, {
          maxWidth: 240,
          className: "sai-leaflet-popup",
        });

        marker.on("popupopen", () => {
          const btn = document.getElementById(`view-prop-btn-${p.id}`);
          if (btn && onViewPropertyDetails) {
            btn.onclick = () => onViewPropertyDetails(p.id);
          }
        });

        marker.on("click", () => {
          if (onSelectProperty) onSelectProperty(p.id);
        });

        markersRef.current[p.id] = marker;
      });

      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
      }
    } catch (err) {
      console.warn("Error updating map markers:", err);
    }
  }, [properties, mapLoaded, selectedPropertyId]);

  // Synchronize selection: pan & open popup when selectedPropertyId changes
  useEffect(() => {
    try {
      if (!selectedPropertyId || !markersRef.current[selectedPropertyId]) return;
      const marker = markersRef.current[selectedPropertyId];
      const map = mapInstanceRef.current;
      if (marker && map) {
        map.panTo(marker.getLatLng(), { animate: true, duration: 0.8 });
        marker.openPopup();
      }
    } catch {}
  }, [selectedPropertyId]);

  const handleLocateMe = () => {
    if ("geolocation" in navigator && mapInstanceRef.current) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const latLng = [pos.coords.latitude, pos.coords.longitude];
          mapInstanceRef.current.flyTo(latLng, 14, { duration: 1.2 });

          const L = (window as any).L;
          if (L) {
            L.circleMarker(latLng, {
              radius: 8,
              color: "#3B82F6",
              fillColor: "#60A5FA",
              fillOpacity: 0.8,
            })
              .addTo(mapInstanceRef.current)
              .bindPopup("Your Location")
              .openPopup();
          }
        },
        (err) => {
          console.warn("Geolocation denied or error:", err);
        }
      );
    }
  };

  const handleZoom = (delta: number) => {
    if (mapInstanceRef.current) {
      const current = mapInstanceRef.current.getZoom();
      mapInstanceRef.current.setZoom(current + delta);
    }
  };

  if (mapError) {
    return (
      <div
        className="relative rounded-2xl overflow-hidden border border-[#D9E5E3] bg-slate-50 flex flex-col items-center justify-center p-6 text-center shadow-xs"
        style={{ height }}
      >
        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mb-3">
          <MapPin size={22} className="text-amber-600" />
        </div>
        <h4 className="font-bold text-slate-800 text-sm mb-1">{mapError}</h4>
        <p className="text-slate-500 text-xs max-w-xs mb-4">
          Interactive map tiles could not be loaded. Property list and details are fully active.
        </p>
        <button
          onClick={() => {
            setMapError(null);
            const L = (window as any).L;
            if (L && mapContainerRef.current) {
              setMapLoaded(false);
            }
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#006D6A] hover:bg-[#004F4D] text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
        >
          <RefreshCw size={13} />
          <span>Retry Map</span>
        </button>
      </div>
    );
  }

  return (
    <div
      className="relative rounded-2xl overflow-hidden border border-[#D9E5E3] shadow-md bg-[#F8FAF9]"
      style={{ height }}
    >
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Controls Overlay */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <button
          onClick={() => handleZoom(1)}
          className="w-10 h-10 bg-white/95 hover:bg-white text-slate-700 rounded-xl shadow-md flex items-center justify-center border border-slate-200 transition-all hover:scale-105"
          title="Zoom In"
        >
          <ZoomIn size={16} />
        </button>
        <button
          onClick={() => handleZoom(-1)}
          className="w-10 h-10 bg-white/95 hover:bg-white text-slate-700 rounded-xl shadow-md flex items-center justify-center border border-slate-200 transition-all hover:scale-105"
          title="Zoom Out"
        >
          <ZoomOut size={16} />
        </button>
        <button
          onClick={handleLocateMe}
          className="w-10 h-10 bg-white/95 hover:bg-white text-[#006D6A] rounded-xl shadow-md flex items-center justify-center border border-slate-200 transition-all hover:scale-105"
          title="Locate Me"
        >
          <Navigation size={16} />
        </button>
      </div>

      {/* City Badge & Property Count */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-200 shadow-sm">
        <MapPin size={14} className="text-[#006D6A]" />
        <span className="text-xs font-bold text-slate-800">{city}</span>
        <span className="text-xs text-slate-400 font-medium">•</span>
        <span className="text-xs text-[#006D6A] font-semibold">
          {properties.length} Listings
        </span>
      </div>

      {/* Bottom helper pill */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-slate-900/80 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-xs font-medium shadow-lg pointer-events-none flex items-center gap-2">
        <span>Click pin to view property card</span>
      </div>
    </div>
  );
};
