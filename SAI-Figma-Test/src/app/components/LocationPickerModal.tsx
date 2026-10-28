import React, { useEffect, useRef, useState } from "react";
import {
  X, MapPin, Search, Navigation, Check, Building2, Sparkles, Eye, Layers,
  Globe, ExternalLink, Mic, ChevronDown, Compass, Volume2, Radio, CheckCircle2
} from "lucide-react";
import { PropertyItem } from "../../api/properties";
import { getSpeechCode } from "../i18n/langauge";
import {
  INDIAN_LOCATIONS_DB,
  resolveSpokenLocation,
  cleanVoiceLocationQuery,
  ResolvedLocationResult
} from "../utils/locationDatabase";

export interface SelectedLocationData {
  city: string;
  locality: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
}

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocationText: string;
  onSelectLocation: (data: SelectedLocationData) => void;
  properties?: PropertyItem[];
  onViewPropertyDetails?: (id: number) => void;
  currentLang?: string;
  onLanguageChange?: (code: string) => void;
}

const LANGUAGES = [
  { code: "en", name: "English", native: "English" },
  { code: "hi", name: "Hindi", native: "हिन्दी" },
  { code: "mr", name: "Marathi", native: "मराठी" },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી" },
  { code: "ta", name: "Tamil", native: "தமிழ்" },
  { code: "te", name: "Telugu", native: "తెలుగు" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ" },
  { code: "bn", name: "Bengali", native: "বাংলা" },
];

export const TEN_CITIES = [
  { name: "Pune", lat: 18.5204, lng: 73.8567, localities: ["Baner", "Wakad", "Hinjewadi", "Kharadi", "Kothrud", "Viman Nagar", "Hadapsar", "Aundh", "Bavdhan", "Balewadi"] },
  { name: "Amravati", lat: 20.9374, lng: 77.7796, localities: ["Rajapeth", "Camp", "Badnera", "Gadge Nagar", "Rathi Nagar", "Dastur Nagar"] },
  { name: "Nagpur", lat: 21.1458, lng: 79.0882, localities: ["Dharampeth", "Manish Nagar", "Wardha Road", "Civil Lines", "Ramdaspeth", "Sadar"] },
  { name: "Mumbai", lat: 19.0760, lng: 72.8777, localities: ["Andheri", "Bandra", "BKC", "Powai", "Juhu", "Thane", "Borivali", "Goregaon", "Malad", "Worli"] },
  { name: "Nashik", lat: 19.9975, lng: 73.7898, localities: ["Gangapur Road", "Indira Nagar", "College Road", "Govind Nagar", "Panchavati"] },
  { name: "Jaipur", lat: 26.9124, lng: 75.7873, localities: ["Malviya Nagar", "Vaishali Nagar", "Mansarovar", "C-Scheme", "Jagatpura"] },
  { name: "Bangalore", lat: 12.9716, lng: 77.5946, localities: ["Whitefield", "Koramangala", "Indiranagar", "HSR Layout", "Electronic City", "Marathahalli", "Bellandur", "Sarjapur"] },
  { name: "Hyderabad", lat: 17.3850, lng: 78.4867, localities: ["Gachibowli", "Hitec City", "Madhapur", "Jubilee Hills", "Banjara Hills", "Kondapur", "Kukatpally", "Miyapur"] },
  { name: "Chennai", lat: 13.0827, lng: 80.2707, localities: ["OMR", "Velachery", "Anna Nagar", "Adyar", "T Nagar", "Guindy"] },
  { name: "Delhi NCR", lat: 28.6139, lng: 77.2090, localities: ["Connaught Place", "Dwarka", "Saket", "Vasant Kunj", "Rohini", "Hauz Khas", "Greater Kailash"] },
  { name: "Ahmedabad", lat: 23.0225, lng: 72.5714, localities: ["SG Highway", "Satellite", "Bopal", "Prahlad Nagar", "Bodakdev"] },
  { name: "Kolkata", lat: 22.5726, lng: 88.3639, localities: ["Salt Lake", "New Town", "Rajarhat", "Ballygunge", "Park Street"] },
  { name: "Surat", lat: 21.1702, lng: 72.8311, localities: ["Vesu", "Adajan", "Pal", "Varachha"] },
  { name: "Indore", lat: 22.7196, lng: 75.8577, localities: ["Vijay Nagar", "Palasia", "Bhawarkua", "Rau"] },
  { name: "Bhopal", lat: 23.2599, lng: 77.4126, localities: ["Arera Colony", "MP Nagar", "Kolar Road", "Hoshangabad Road"] },
  { name: "Noida", lat: 28.5355, lng: 77.3910, localities: ["Sector 62", "Sector 137", "Sector 150", "Sector 18", "Noida Extension"] },
  { name: "Gurgaon", lat: 28.4595, lng: 77.0266, localities: ["Golf Course Rd", "Cyber City", "Sector 56", "Sohna Road", "DLF Phase 5"] },
];

export const LocationPickerModal = ({
  isOpen,
  onClose,
  currentLocationText,
  onSelectLocation,
  properties = [],
  onViewPropertyDetails,
  currentLang = "en",
  onLanguageChange,
}: LocationPickerModalProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const targetMarkerRef = useRef<any>(null);
  const propMarkersRef = useRef<any[]>([]);
  const voiceRecRef = useRef<any>(null);
  const latestVoiceTextRef = useRef<string>("");
  const isResolvingRef = useRef<boolean>(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCityName, setSelectedCityName] = useState("Pune");
  const [langCode, setLangCode] = useState(currentLang);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState("");
  const [voiceSuccessMsg, setVoiceSuccessMsg] = useState<string | null>(null);
  const [mapLayer, setMapLayer] = useState<"standard" | "satellite">("standard");
  const tileLayerRef = useRef<any>(null);

  const [selectedLocation, setSelectedLocation] = useState<SelectedLocationData>(() => {
    return {
      city: "Pune",
      locality: "Baner",
      formattedAddress: currentLocationText || "Baner, Pune, Maharashtra",
      latitude: 18.5596,
      longitude: 73.7799,
    };
  });
  const [geolocating, setGeolocating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    setLangCode(currentLang);
  }, [currentLang]);

  useEffect(() => {
    if (!isOpen) {
      if (voiceRecRef.current) {
        try { voiceRecRef.current.abort(); } catch {}
      }
      setIsListening(false);
      setSpeechTranscript("");
      setVoiceSuccessMsg(null);
      return;
    }

    const L = (window as any).L;
    if (!L || !mapContainerRef.current) return;

    // Destroy existing instance if any
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const initialCoords: [number, number] = [selectedLocation.latitude, selectedLocation.longitude];

    const map = L.map(mapContainerRef.current, {
      center: initialCoords,
      zoom: 14,
      zoomControl: true,
    });

    const standardTile = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    });

    standardTile.addTo(map);
    tileLayerRef.current = standardTile;

    // Custom Target Pin for Chosen Location
    const targetIcon = L.divIcon({
      className: "sai-target-pin-container",
      html: `
        <div style="
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, #008F8C, #004F4D);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 6px 24px rgba(0,109,106,0.7);
          border: 3.5px solid white;
          position: relative;
        ">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 44],
    });

    const marker = L.marker(initialCoords, { icon: targetIcon, draggable: true }).addTo(map);
    targetMarkerRef.current = marker;

    marker.on("dragend", async (e: any) => {
      const { lat, lng } = e.target.getLatLng();
      updateCoordinates(lat, lng);
    });

    // Map click to place target location
    map.on("click", (e: any) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      updateCoordinates(lat, lng);
    });

    mapInstanceRef.current = map;

    // Render backend properties as markers
    renderPropertyMarkers(map, L);

    // Resize recalculation
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen]);

  // Update tile layer on layer change
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    if (mapLayer === "satellite") {
      tileLayerRef.current = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        attribution: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
        maxZoom: 18,
      }).addTo(mapInstanceRef.current);
    } else {
      tileLayerRef.current = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(mapInstanceRef.current);
    }
  }, [mapLayer]);

  // Update property markers when properties change
  const renderPropertyMarkers = (map: any, L: any) => {
    propMarkersRef.current.forEach((m) => m.remove());
    propMarkersRef.current = [];

    properties.forEach((p) => {
      if (!p.latitude || !p.longitude) return;

      const priceText = p.price >= 10000000 ? `₹${(p.price / 10000000).toFixed(1)}Cr` : `₹${(p.price / 100000).toFixed(1)}L`;
      const bhkText = p.bhk ? `${p.bhk} BHK` : "";

      const propIcon = L.divIcon({
        className: "sai-prop-marker",
        html: `
          <div style="
            background: #ffffff;
            color: #006D6A;
            border: 2px solid #006D6A;
            font-size: 11px;
            font-weight: 800;
            padding: 3px 8px;
            border-radius: 9999px;
            white-space: nowrap;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: inline-flex;
            align-items: center;
            gap: 4px;
            cursor: pointer;
            transition: transform 0.2s;
          ">
            <span>${priceText}</span>
            ${bhkText ? `<span style="background: #E6F4F2; color: #008F8C; padding: 1px 5px; border-radius: 6px; font-size: 9px;">${bhkText}</span>` : ""}
          </div>
        `,
        iconSize: [80, 26],
        iconAnchor: [40, 13],
      });

      const pMarker = L.marker([p.latitude, p.longitude], { icon: propIcon }).addTo(map);

      const popupContent = document.createElement("div");
      popupContent.style.width = "220px";
      popupContent.style.fontFamily = "'Inter', sans-serif";
      popupContent.innerHTML = `
        <div style="border-radius: 12px; overflow: hidden; margin-bottom: 8px;">
          <img src="${(p as any).img || (p.media && p.media[0]?.url) || 'https://images.unsplash.com/photo-1682184805271-11671b7ecf4c?w=400'}" style="width: 100%; height: 110px; object-fit: cover;" />
        </div>
        <div style="font-weight: 800; font-size: 13px; color: #1e293b; margin-bottom: 2px;">${p.title}</div>
        <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">📍 ${p.locality}, ${p.city}</div>
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
          <span style="font-weight: 900; font-size: 14px; color: #008F8C;">${priceText}</span>
          <span style="background: #E6F4F2; color: #006D6A; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 9999px;">${p.match_score || 92}% Match</span>
        </div>
        <button id="view-prop-${p.id}" style="
          width: 100%;
          background: #006D6A;
          color: white;
          font-weight: 700;
          font-size: 11px;
          padding: 6px 0;
          border-radius: 8px;
          border: none;
          cursor: pointer;
        ">View Details</button>
      `;

      pMarker.bindPopup(popupContent);
      pMarker.on("popupopen", () => {
        const btn = document.getElementById(`view-prop-${p.id}`);
        if (btn) {
          btn.onclick = () => {
            onViewPropertyDetails?.(p.id);
            onClose();
          };
        }
      });

      propMarkersRef.current.push(pMarker);
    });
  };

  const updateCoordinates = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`, {
        headers: { "Accept-Language": langCode },
      });
      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        const locality = addr.suburb || addr.neighbourhood || addr.residential || addr.city_district || addr.quarter || "Selected Area";
        const city = addr.city || addr.town || addr.state_district || "Pune";
        const formatted = `${locality}, ${city}`;

        setSelectedCityName(city);
        setSelectedLocation({
          city,
          locality,
          formattedAddress: formatted,
          latitude: lat,
          longitude: lng,
        });
        return;
      }
    } catch {}

    setSelectedLocation(prev => ({
      ...prev,
      formattedAddress: `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`,
      latitude: lat,
      longitude: lng,
    }));
  };

  /**
   * Applies a found location result to the map, marker, and state
   */
  const applyLocationResult = (res: ResolvedLocationResult | { city: string; locality: string; formattedAddress: string; latitude: number; longitude: number }, isVoice: boolean = false) => {
    setSelectedCityName(res.city);
    setSelectedLocation({
      city: res.city,
      locality: res.locality,
      formattedAddress: res.formattedAddress,
      latitude: res.latitude,
      longitude: res.longitude,
    });

    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([res.latitude, res.longitude], 15, { animate: true });
      if (targetMarkerRef.current) {
        targetMarkerRef.current.setLatLng([res.latitude, res.longitude]);
      }
    }

    if (isVoice) {
      setVoiceSuccessMsg(`📍 Voice Located: ${res.locality}, ${res.city}`);
      setTimeout(() => {
        setVoiceSuccessMsg(null);
      }, 4500);
    }
  };

  const handleSelectCity = (cityItem: typeof TEN_CITIES[0]) => {
    setSelectedCityName(cityItem.name);
    const firstLocality = cityItem.localities[0] || cityItem.name;
    const formatted = `${firstLocality}, ${cityItem.name}`;

    applyLocationResult({
      city: cityItem.name,
      locality: firstLocality,
      formattedAddress: formatted,
      latitude: cityItem.lat,
      longitude: cityItem.lng,
    });
  };

  const handleSelectLocality = (localityName: string, cityName: string) => {
    // Check if locality is in local DB with exact coordinates
    const matchedInDb = INDIAN_LOCATIONS_DB.find(
      (l) => l.name.toLowerCase() === localityName.toLowerCase() || l.locality.toLowerCase() === localityName.toLowerCase()
    );

    if (matchedInDb) {
      applyLocationResult({
        city: matchedInDb.city,
        locality: matchedInDb.locality,
        formattedAddress: matchedInDb.formattedAddress,
        latitude: matchedInDb.lat,
        longitude: matchedInDb.lng,
      });
      return;
    }

    const matchedCity = TEN_CITIES.find(c => c.name === cityName) || TEN_CITIES[0];
    const formatted = `${localityName}, ${cityName}`;
    const lat = matchedCity.lat + (Math.random() - 0.5) * 0.03;
    const lng = matchedCity.lng + (Math.random() - 0.5) * 0.03;

    applyLocationResult({
      city: cityName,
      locality: localityName,
      formattedAddress: formatted,
      latitude: lat,
      longitude: lng,
    });
  };

  /**
   * Main Search Resolver for typed or spoken location queries
   */
  const handleSearchSubmit = async (e?: React.FormEvent, queryOverride?: string, isFromVoice: boolean = false) => {
    if (e) e.preventDefault();
    const query = (queryOverride !== undefined ? queryOverride : searchQuery).trim();
    if (!query) return;

    setIsSearching(true);

    try {
      // 1. Resolve using instant multi-tier database + geocoder
      const result = await resolveSpokenLocation(query, langCode);
      if (result) {
        applyLocationResult(result, isFromVoice);
        setSearchQuery(result.formattedAddress);
        setIsSearching(false);
        return;
      }

      // 2. Direct city fallback
      const cityMatch = TEN_CITIES.find(c => c.name.toLowerCase() === query.toLowerCase().trim());
      if (cityMatch) {
        handleSelectCity(cityMatch);
        setIsSearching(false);
        return;
      }

      // 3. Last fallback to Nominatim
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ", India")}&accept-language=${langCode}`);
      if (res.ok) {
        const results = await res.json();
        if (results && results.length > 0) {
          const first = results[0];
          const lat = parseFloat(first.lat);
          const lng = parseFloat(first.lon);
          const parts = first.display_name.split(",").map((s: string) => s.trim());
          const locality = parts[0] || query;
          const city = parts[1] || selectedCityName || "Location";

          applyLocationResult({
            city,
            locality,
            formattedAddress: `${locality}, ${city}`,
            latitude: lat,
            longitude: lng,
          }, isFromVoice);
        }
      }
    } catch (err) {
      console.warn("Search submission error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  /**
   * High-accuracy Multilingual Voice Search with live waveform & instant resolution
   */
  const handleVoiceSearch = () => {
    if (isListening) {
      try {
        voiceRecRef.current?.stop?.();
        voiceRecRef.current?.abort?.();
      } catch {}
      setIsListening(false);
      if (latestVoiceTextRef.current && !isResolvingRef.current) {
        isResolvingRef.current = true;
        handleSearchSubmit(undefined, latestVoiceTextRef.current, true);
      }
      return;
    }

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert("Speech recognition is not supported in this browser. Please use Chrome, Edge, Safari, or Brave.");
      return;
    }

    try {
      if (voiceRecRef.current) {
        voiceRecRef.current.abort();
      }
    } catch {}

    const rec = new SR();
    rec.lang = getSpeechCode(langCode);
    rec.interimResults = true;
    rec.continuous = false;
    voiceRecRef.current = rec;
    latestVoiceTextRef.current = "";
    isResolvingRef.current = false;

    rec.onstart = () => {
      setIsListening(true);
      setSpeechTranscript("");
      setVoiceSuccessMsg(null);
    };

    rec.onresult = (e: any) => {
      const text = Array.from(e.results).map((r: any) => r[0].transcript).join("");
      latestVoiceTextRef.current = text;
      setSpeechTranscript(text);
      setSearchQuery(text);

      if (e.results[e.results.length - 1].isFinal) {
        setIsListening(false);
        if (!isResolvingRef.current) {
          isResolvingRef.current = true;
          handleSearchSubmit(undefined, text, true);
        }
      }
    };

    rec.onerror = (e: any) => {
      setIsListening(false);
      if (e.error === "not-allowed") {
        alert("Microphone permission was blocked. Please click the lock or camera icon in your browser address bar to allow microphone access.");
      }
    };

    rec.onend = () => {
      setIsListening(false);
      if (latestVoiceTextRef.current && !isResolvingRef.current) {
        isResolvingRef.current = true;
        handleSearchSubmit(undefined, latestVoiceTextRef.current, true);
      }
    };

    try {
      rec.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setGeolocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setGeolocating(false);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lng], 15);
          if (targetMarkerRef.current) {
            targetMarkerRef.current.setLatLng([lat, lng]);
          }
        }
        updateCoordinates(lat, lng);
      },
      (err) => {
        setGeolocating(false);
        alert("Unable to retrieve your location: " + err.message);
      },
      { timeout: 10000 }
    );
  };

  const openInGoogleMaps = () => {
    const { latitude, longitude } = selectedLocation;
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleConfirm = () => {
    onSelectLocation(selectedLocation);
    onClose();
  };

  const currentLangObj = LANGUAGES.find(l => l.code === langCode) || LANGUAGES[0];
  const activeCityObj = TEN_CITIES.find(c => c.name.toLowerCase() === selectedCityName.toLowerCase()) || TEN_CITIES[0];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5">
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.45)] w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden border border-[#D9E5E3] z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#D9E5E3] flex items-center justify-between gap-3 bg-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#008F8C] to-[#004F4D] flex items-center justify-center text-white shadow-[0_4px_12px_rgba(0,109,106,0.35)]">
              <Compass size={22} className="animate-spin-slow" />
            </div>
            <div>
              <h2 className="font-black text-slate-800 text-base sm:text-lg flex items-center gap-2">
                <span>Interactive Property Map &amp; Voice Finder</span>
                <span className="hidden md:inline-flex items-center gap-1 bg-[#E6F4F2] text-[#006D6A] text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                  <Sparkles size={11} /> Live Voice Mic &amp; Google Maps
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Speak any locality (Baner, Wakad, Andheri, Whitefield...) or pick on the map
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Selector Dropdown inside Map */}
            <div className="relative">
              <button
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 border border-[#D9E5E3] hover:bg-[#E6F4F2] transition-colors text-xs font-bold text-slate-700"
                title="Select Language for Voice & Search"
              >
                <Globe size={14} className="text-[#006D6A]" />
                <span>{currentLangObj.native}</span>
                <ChevronDown size={12} className={`text-slate-400 transition-transform ${langDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {langDropdownOpen && (
                <div className="absolute right-0 top-11 bg-white rounded-2xl shadow-2xl border border-[#D9E5E3] py-2 w-48 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    Voice &amp; Search Language
                  </div>
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLangCode(l.code);
                        onLanguageChange?.(l.code);
                        setLangDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 text-xs transition-colors flex items-center justify-between ${
                        l.code === langCode ? "bg-[#E6F4F2] text-[#006D6A] font-bold" : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span>{l.native} <span className="text-slate-400 text-[10px]">({l.name})</span></span>
                      {l.code === langCode && <Check size={12} />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Direct Google Maps Launcher */}
            <button
              onClick={openInGoogleMaps}
              title="Open currently selected coordinates directly in Google Maps"
              className="hidden sm:flex items-center gap-1.5 bg-white border border-[#D9E5E3] hover:border-[#008F8C] text-[#006D6A] text-xs font-bold px-3 py-2 rounded-xl hover:bg-[#E6F4F2] transition-all"
            >
              <ExternalLink size={13} />
              <span>Google Maps</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors flex-shrink-0"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Search & Action Bar (Upper side of the 10 locations) */}
        <div className="px-4 sm:px-6 py-3 bg-gradient-to-r from-slate-50 to-[#F0FAF8] border-b border-[#D9E5E3] flex flex-wrap gap-2.5 items-center flex-shrink-0">
          <form onSubmit={(e) => handleSearchSubmit(e)} className="flex-1 min-w-[280px] relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isListening ? "🎙️ Listening... Speak any location now..." : `Search or speak any location in ${currentLangObj.name} (e.g. Baner, Wakad, Whitefield)...`}
              className={`w-full bg-white border rounded-2xl pl-10 pr-32 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none transition-all shadow-sm ${
                isListening
                  ? "border-red-400 ring-2 ring-red-300 bg-red-50/30"
                  : "border-[#D9E5E3] focus:ring-2 focus:ring-[#006D6A]"
              }`}
            />
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {/* Working Microphone Button */}
              <button
                type="button"
                onClick={handleVoiceSearch}
                title={isListening ? "Stop listening" : `Tap to speak location in ${currentLangObj.name}`}
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                  isListening
                    ? "bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-pulse scale-110"
                    : "bg-[#E6F4F2] hover:bg-[#006D6A] hover:text-white text-[#006D6A]"
                }`}
              >
                <Mic size={15} className={isListening ? "animate-bounce" : ""} />
              </button>
              <button
                type="submit"
                disabled={isSearching}
                className="bg-[#006D6A] text-white text-xs font-bold px-3.5 py-1.5 rounded-xl hover:bg-[#004F4D] transition-colors shadow-sm disabled:opacity-50"
              >
                {isSearching ? "Locating..." : "Locate"}
              </button>
            </div>
          </form>

          <button
            onClick={handleUseCurrentLocation}
            disabled={geolocating}
            className="flex items-center gap-1.5 bg-white border border-[#D9E5E3] text-[#006D6A] font-bold px-3.5 py-2.5 rounded-xl text-xs hover:bg-[#E6F4F2] transition-colors disabled:opacity-50 shadow-sm"
          >
            <Navigation size={13} className={geolocating ? "animate-spin text-[#006D6A]" : ""} />
            <span>{geolocating ? "Locating GPS..." : "My GPS"}</span>
          </button>
        </div>

        {/* Live Microphone Visualizer Banner */}
        {isListening && (
          <div className="px-4 sm:px-6 py-2.5 bg-gradient-to-r from-red-50 via-rose-50 to-red-50 border-b border-red-200 flex flex-wrap items-center justify-between gap-2 text-xs text-red-700 font-bold animate-in fade-in slide-in-from-top-1 duration-200 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <span className="flex items-center gap-1.5">
                <Volume2 size={15} className="animate-pulse text-red-600" />
                Listening in <strong>{currentLangObj.native} ({currentLangObj.name})</strong>:
              </span>
              <span className="italic text-slate-800 bg-white/80 px-2 py-0.5 rounded-md border border-red-200">
                "{speechTranscript || "Speak any locality or city..."}"
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-500 font-normal hidden sm:inline">Try speaking:</span>
              {["Baner", "Wakad", "Andheri", "Whitefield"].map(sample => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => {
                    setSearchQuery(sample);
                    handleSearchSubmit(undefined, sample, true);
                    setIsListening(false);
                  }}
                  className="bg-white hover:bg-red-100 text-red-700 border border-red-200 text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors"
                >
                  "{sample}"
                </button>
              ))}
              <button
                onClick={() => handleVoiceSearch()}
                className="ml-2 px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold transition-colors shadow-sm"
              >
                Stop / Locate
              </button>
            </div>
          </div>
        )}

        {/* Voice Success Feedback Banner */}
        {voiceSuccessMsg && (
          <div className="px-4 sm:px-6 py-2 bg-emerald-50 border-b border-emerald-200 flex items-center justify-between text-xs text-emerald-800 font-bold animate-in fade-in slide-in-from-top-1 duration-200 flex-shrink-0">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-600" />
              <span>{voiceSuccessMsg}</span>
            </div>
            <span className="text-[10px] bg-emerald-200/60 text-emerald-900 px-2 py-0.5 rounded-full">
              Map centered &amp; pin updated
            </span>
          </div>
        )}

        {/* 10 Popular Cities Strip (Directly Below Search Bar) */}
        <div className="px-4 sm:px-6 py-2 bg-white border-b border-[#D9E5E3] flex items-center gap-2 overflow-x-auto scrollbar-hide flex-shrink-0">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex-shrink-0 flex items-center gap-1">
            <Building2 size={12} className="text-[#006D6A]" /> 10 Cities:
          </span>
          {TEN_CITIES.map((c) => {
            const isSelected = selectedCityName.toLowerCase() === c.name.toLowerCase();
            return (
              <button
                key={c.name}
                onClick={() => handleSelectCity(c)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                  isSelected
                    ? "bg-[#006D6A] text-white shadow-[0_2px_8px_rgba(0,109,106,0.35)] scale-105"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {c.name}
              </button>
            );
          })}
        </div>

        {/* Localities for Active City */}
        {activeCityObj.localities && activeCityObj.localities.length > 0 && (
          <div className="px-4 sm:px-6 py-1.5 bg-slate-50 border-b border-[#D9E5E3] flex items-center gap-1.5 overflow-x-auto scrollbar-hide flex-shrink-0 text-xs">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex-shrink-0">
              {activeCityObj.name} Localities:
            </span>
            {activeCityObj.localities.map((loc) => {
              const isLocActive = selectedLocation.locality.toLowerCase().includes(loc.toLowerCase());
              return (
                <button
                  key={loc}
                  onClick={() => handleSelectLocality(loc, activeCityObj.name)}
                  className={`px-2.5 py-0.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                    isLocActive
                      ? "bg-[#E6F4F2] text-[#006D6A] font-bold border border-[#006D6A]/30"
                      : "bg-white text-slate-600 hover:bg-slate-200 border border-slate-200"
                  }`}
                >
                  {loc}
                </button>
              );
            })}
          </div>
        )}

        {/* Interactive Map Body */}
        <div className="flex-1 relative bg-slate-100 min-h-0">
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Map Layer Switcher (Standard / Satellite) */}
          <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm rounded-xl p-1 shadow-lg border border-[#D9E5E3] z-[1000] flex gap-1 text-xs">
            <button
              onClick={() => setMapLayer("standard")}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                mapLayer === "standard" ? "bg-[#006D6A] text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Map
            </button>
            <button
              onClick={() => setMapLayer("satellite")}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                mapLayer === "satellite" ? "bg-[#006D6A] text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Satellite
            </button>
          </div>

          {/* Floating Map Legend */}
          <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm rounded-2xl p-3 shadow-lg border border-[#D9E5E3] z-[1000] text-xs pointer-events-none hidden sm:block">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-3 h-3 rounded-full bg-[#006D6A]" />
              <span className="font-semibold text-slate-700">Selected Target Pin (Drag to Move)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full border-2 border-[#006D6A] bg-white" />
              <span className="font-semibold text-slate-700">Verified Properties ({properties.length})</span>
            </div>
          </div>
        </div>

        {/* Footer Selected Location Bar */}
        <div className="p-4 sm:p-5 bg-white border-t border-[#D9E5E3] flex flex-wrap items-center justify-between gap-4 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-[#E6F4F2] flex items-center justify-center text-[#006D6A] flex-shrink-0 shadow-inner">
              <MapPin size={22} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-[#008F8C] uppercase tracking-wider flex items-center gap-1.5">
                <span>Selected Search Location</span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-500">Language: {currentLangObj.native}</span>
              </p>
              <h4 className="font-black text-slate-800 text-base sm:text-lg truncate">
                📍 {selectedLocation.formattedAddress}
              </h4>
              <p className="text-xs text-slate-400">
                Coords: {selectedLocation.latitude.toFixed(4)}, {selectedLocation.longitude.toFixed(4)} · City: {selectedLocation.city}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={openInGoogleMaps}
              className="px-4 py-2.5 rounded-xl border border-[#D9E5E3] text-[#006D6A] font-bold text-xs hover:bg-[#E6F4F2] transition-colors flex items-center gap-1.5"
            >
              <ExternalLink size={14} />
              <span>Google Maps</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 sm:px-5 py-2.5 rounded-xl border border-[#D9E5E3] text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-5 sm:px-6 py-2.5 rounded-xl bg-[#006D6A] text-white font-bold text-sm hover:bg-[#004F4D] shadow-[0_4px_16px_rgba(0,109,106,0.4)] transition-all flex items-center gap-2"
            >
              <Check size={16} />
              <span>Confirm Location</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
