import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  ArrowLeft, Search, SlidersHorizontal, MapPin, Building2, Sparkles,
  Check, Heart, Eye, RefreshCw, X, ChevronDown, Layers, Home,
  DollarSign, Grid, List, Map as MapIcon, ArrowRight, ShieldCheck,
  TrendingUp, Award, Phone, Compass, Info
} from "lucide-react";
import { CITY_HUBS, CITY_HUBS_MAP, CityHub } from "../data/cityHubs";
import { PropertyItem, fetchProperties, UIProperty, toUIProperty } from "../../api/properties";
import { searchProperties, searchNaturalLanguage } from "../../api/search";
import { addFavorite, removeFavorite, fetchFavorites } from "../../api/favorites";
import { PropertyMap } from "./PropertyMap";
import { SaiLogo } from "./SaiLogo";

interface CityExplorePageProps {
  initialCity?: string;
  onBackToHubs: () => void;
  navigate: (pg: any) => void;
  selectProperty: (id: number) => void;
  onOpenChatWithQuery?: (q: string) => void;
}

const ALL_CITIES = [
  "Pune", "Amravati", "Nagpur", "Mumbai", "Nashik", "Jaipur",
  "Bangalore", "Hyderabad", "Chennai", "Delhi NCR", "Ahmedabad",
  "Kolkata", "Surat", "Indore", "Bhopal", "Noida", "Gurgaon"
];

const PROPERTY_TYPES = [
  { id: "all", label: "All Types" },
  { id: "apartment", label: "Apartment" },
  { id: "villa", label: "Villa / House" },
  { id: "commercial", label: "Commercial / Office" },
  { id: "plot", label: "Plot / Land" },
];

const BHK_OPTIONS = [
  { id: "all", label: "All BHK" },
  { id: "1", label: "1 BHK" },
  { id: "2", label: "2 BHK" },
  { id: "3", label: "3 BHK" },
  { id: "4", label: "4+ BHK" },
];

const BUDGET_PRESETS = [
  { id: "all", label: "Any Budget", min: undefined, max: undefined },
  { id: "under-50l", label: "Under ₹50L", min: 0, max: 5000000 },
  { id: "50l-1cr", label: "₹50L - ₹1 Cr", min: 5000000, max: 10000000 },
  { id: "1cr-2cr", label: "₹1 Cr - ₹2 Cr", min: 10000000, max: 20000000 },
  { id: "above-2cr", label: "Above ₹2 Cr", min: 20000000, max: undefined },
];

const SORT_OPTIONS = [
  { id: "recommended", label: "Recommended" },
  { id: "price_asc", label: "Price: Low to High" },
  { id: "price_desc", label: "Price: High to Low" },
  { id: "newest", label: "Newest Listings" },
  { id: "area", label: "Area: High to Low" },
];

export function CityExplorePage({
  initialCity = "Pune",
  onBackToHubs,
  navigate,
  selectProperty,
  onOpenChatWithQuery
}: CityExplorePageProps) {
  // Normalize current city name
  const [selectedCity, setSelectedCity] = useState<string>(() => {
    const match = ALL_CITIES.find(c => c.toLowerCase() === initialCity.toLowerCase());
    return match || "Pune";
  });

  // State
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredPropertyId, setHoveredPropertyId] = useState<number | null>(null);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());

  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [propertyType, setPropertyType] = useState("all");
  const [bhk, setBhk] = useState("all");
  const [budgetPreset, setBudgetPreset] = useState("all");
  const [selectedLocality, setSelectedLocality] = useState("all");
  const [furnishing, setFurnishing] = useState("all");
  const [sortBy, setSortBy] = useState("recommended");
  const [showFiltersModal, setShowFiltersModal] = useState(false);

  // View state: on mobile, toggle between 'list' and 'map'
  const [mobileTab, setMobileTab] = useState<"list" | "map">("list");
  const [cardLayout, setCardLayout] = useState<"grid" | "list">("grid");

  // City dropdown open/close
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const cityDropdownRef = useRef<HTMLDivElement>(null);

  // Sync city when initialCity prop changes
  useEffect(() => {
    if (initialCity) {
      const match = ALL_CITIES.find(c => c.toLowerCase() === initialCity.toLowerCase());
      if (match && match !== selectedCity) {
        setSelectedCity(match);
      }
    }
  }, [initialCity]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close city dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(e.target as Node)) {
        setCityDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch user favorites
  useEffect(() => {
    fetchFavorites()
      .then(res => {
        if (Array.isArray(res)) {
          setFavorites(new Set(res.map((f: any) => f.property_id || f.id)));
        }
      })
      .catch(() => {});
  }, []);

  // City hub information
  const currentHub: CityHub = useMemo(() => {
    const found = CITY_HUBS_MAP.get(selectedCity.toLowerCase());
    if (found) return found;
    return {
      name: selectedCity,
      state: "India",
      tag: "Verified Real Estate Hub",
      img: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&q=80",
      listingsCount: "Verified Listings",
      avgPrice: "Best Rates",
      growth: "+10% YoY",
      popularAreas: []
    };
  }, [selectedCity]);

  // Load properties specifically for the selected city from backend API
  const loadCityProperties = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Construct search params
      const selectedBudget = BUDGET_PRESETS.find(b => b.id === budgetPreset);
      const params: Record<string, any> = {
        city: selectedCity,
        limit: 50,
      };

      if (debouncedSearch) {
        params.q = debouncedSearch;
      }
      if (selectedLocality && selectedLocality !== "all") {
        params.locality = selectedLocality;
      }
      if (propertyType && propertyType !== "all") {
        params.property_type = propertyType;
      }
      if (bhk && bhk !== "all") {
        params.bhk = parseInt(bhk, 10);
      }
      if (selectedBudget?.min !== undefined) {
        params.min_price = selectedBudget.min;
      }
      if (selectedBudget?.max !== undefined) {
        params.max_price = selectedBudget.max;
      }
      if (furnishing && furnishing !== "all") {
        params.furnishing = furnishing;
      }
      if (sortBy && sortBy !== "recommended") {
        params.sort_by = sortBy;
      }

      // Execute search query
      const res = await searchProperties(params);
      if (res && Array.isArray(res.items)) {
        // Strict double-check: verify items actually belong to selected city
        const cityFiltered = res.items.filter(
          p => p.city && p.city.toLowerCase() === selectedCity.toLowerCase()
        );
        setProperties(cityFiltered);
      } else {
        // Fallback to direct fetchProperties
        const directRes = await fetchProperties({ city: selectedCity, limit: 50 });
        if (directRes && directRes.items) {
          const cityFiltered = directRes.items.filter(
            p => p.city && p.city.toLowerCase() === selectedCity.toLowerCase()
          );
          setProperties(cityFiltered);
        } else {
          setProperties([]);
        }
      }
    } catch (err: any) {
      console.warn("Failed to load properties for", selectedCity, err);
      setError("Unable to load properties right now.");
    } finally {
      setLoading(false);
    }
  }, [selectedCity, debouncedSearch, selectedLocality, propertyType, bhk, budgetPreset, furnishing, sortBy]);

  useEffect(() => {
    loadCityProperties();
  }, [loadCityProperties]);

  // Localities list for this city
  const availableLocalities = useMemo(() => {
    const list = new Set<string>();
    // From cityHub popular areas
    if (currentHub.popularAreas) {
      currentHub.popularAreas.forEach(a => list.add(a));
    }
    // From loaded properties
    properties.forEach(p => {
      if (p.locality) list.add(p.locality);
    });
    return Array.from(list);
  }, [currentHub, properties]);

  // Handle City Change
  const handleCitySelect = (cityName: string) => {
    setSelectedCity(cityName);
    setSelectedLocality("all");
    setSearchQuery("");
    setDebouncedSearch("");
    setCityDropdownOpen(false);

    // Deep-linking: update browser URL
    const slug = cityName.toLowerCase().replace(/\s+/g, "-");
    const targetUrl = `/properties/city/${slug}`;
    try {
      window.history.pushState({ page: "city-explore", city: cityName }, "", targetUrl);
    } catch {}
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Toggle Favorite
  const handleToggleFavorite = async (e: React.MouseEvent, propId: number) => {
    e.stopPropagation();
    const isFav = favorites.has(propId);
    try {
      if (isFav) {
        await removeFavorite(propId);
        setFavorites(prev => {
          const next = new Set(prev);
          next.delete(propId);
          return next;
        });
      } else {
        await addFavorite(propId);
        setFavorites(prev => {
          const next = new Set(prev);
          next.add(propId);
          return next;
        });
      }
    } catch {
      // Toggle locally on error for smooth UX
      setFavorites(prev => {
        const next = new Set(prev);
        if (isFav) next.delete(propId);
        else next.add(propId);
        return next;
      });
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery("");
    setDebouncedSearch("");
    setPropertyType("all");
    setBhk("all");
    setBudgetPreset("all");
    setSelectedLocality("all");
    setFurnishing("all");
    setSortBy("recommended");
  };

  const hasActiveFilters = Boolean(
    debouncedSearch ||
    propertyType !== "all" ||
    bhk !== "all" ||
    budgetPreset !== "all" ||
    selectedLocality !== "all" ||
    furnishing !== "all" ||
    sortBy !== "recommended"
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* ───────────────────────────────────────────────────────────
          1. CITY EXPLORE HEADER & HERO BANNER
      ─────────────────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-[#003836] via-[#004F4D] to-[#006D6A] text-white pt-6 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden shadow-lg border-b border-[#005B58]">
        {/* Subtle Background Pattern & Glow */}
        <div className="absolute inset-0 opacity-15 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, #67E8F9 0%, transparent 60%), radial-gradient(circle at 80% 70%, #008F8C 0%, transparent 50%)" }} />
        <div className="absolute right-0 bottom-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Top Bar: Back Button & City Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 sm:mb-8">
            <button
              onClick={onBackToHubs}
              className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 active:scale-95 text-white font-bold px-4 py-2.5 rounded-2xl text-xs sm:text-sm backdrop-blur-md transition-all border border-white/20 shadow-sm"
            >
              <ArrowLeft size={16} />
              <span>Back to Property Hubs</span>
            </button>

            {/* City Switcher Dropdown */}
            <div className="relative" ref={cityDropdownRef}>
              <button
                type="button"
                onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
                className="inline-flex items-center gap-2 bg-black/40 hover:bg-black/55 active:scale-95 text-white font-black px-4 py-2.5 rounded-2xl text-xs sm:text-sm backdrop-blur-md transition-all border border-white/25 shadow-sm"
              >
                <MapPin size={15} className="text-[#67E8F9]" />
                <span>{selectedCity}</span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${cityDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {cityDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white text-slate-800 rounded-3xl shadow-2xl border border-slate-200 p-2 z-50 max-h-80 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    Switch Property Hub ({ALL_CITIES.length})
                  </div>
                  <div className="py-1">
                    {ALL_CITIES.map((c) => {
                      const isSel = c.toLowerCase() === selectedCity.toLowerCase();
                      const hubInfo = CITY_HUBS_MAP.get(c.toLowerCase());
                      return (
                        <button
                          key={c}
                          onClick={() => handleCitySelect(c)}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors ${
                            isSel
                              ? "bg-[#006D6A] text-white"
                              : "hover:bg-[#E6F4F2] text-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={isSel ? "text-white" : "text-[#008F8C]"}>📍</span>
                            <span>{c}</span>
                          </div>
                          {hubInfo?.avgPrice && (
                            <span className={`text-[10px] ${isSel ? "text-white/80" : "text-slate-400"}`}>
                              {hubInfo.avgPrice}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* City Headline & Metadata */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
            <div className="lg:col-span-8">
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider text-[#67E8F9] border border-white/20 mb-3">
                <Compass size={13} />
                <span>{currentHub.state || "India"} · Verified Property Hub</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight uppercase leading-none drop-shadow-sm">
                {selectedCity}
              </h1>

              <p className="text-base sm:text-xl font-bold text-[#E6F4F2] mt-2">
                {currentHub.tag || "Smart Real Estate Hub"}
              </p>

              <p className="text-xs sm:text-sm text-white/80 mt-1 max-w-2xl leading-relaxed">
                Explore verified residential & commercial properties in {selectedCity}. Filter by locality, BHK, and price with real-time interactive mapping.
              </p>
            </div>

            {/* City Key Statistics Card */}
            <div className="lg:col-span-4 bg-white/10 backdrop-blur-md rounded-3xl p-4 sm:p-5 border border-white/20 shadow-inner">
              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="bg-black/20 rounded-2xl p-3 border border-white/10">
                  <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider">Live Inventory</p>
                  <p className="text-lg sm:text-xl font-black text-white mt-0.5">
                    {loading ? "..." : `${properties.length} Verified`}
                  </p>
                  <p className="text-[10px] text-[#67E8F9] font-semibold mt-0.5">{currentHub.listingsCount}</p>
                </div>

                <div className="bg-black/20 rounded-2xl p-3 border border-white/10">
                  <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider">Avg Rate</p>
                  <p className="text-lg sm:text-xl font-black text-[#67E8F9] mt-0.5">
                    {currentHub.avgPrice}
                  </p>
                  <p className="text-[10px] text-emerald-300 font-semibold mt-0.5 flex items-center gap-0.5">
                    <TrendingUp size={10} /> {currentHub.growth || "+12% YoY"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────
          2. SEARCH & FILTER CONTROLS BAR (Sticky)
      ─────────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-slate-200 py-3.5 px-4 sm:px-6 lg:px-8 shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search properties in ${selectedCity} (e.g. Baner, 2 BHK, Luxury)...`}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-10 py-2.5 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#008F8C] focus:bg-white transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Quick Filter Selectors (Desktop & Tablet) */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Property Type Dropdown */}
            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#008F8C]"
            >
              {PROPERTY_TYPES.map(t => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>

            {/* BHK Dropdown */}
            <select
              value={bhk}
              onChange={(e) => setBhk(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#008F8C]"
            >
              {BHK_OPTIONS.map(b => (
                <option key={b.id} value={b.id}>{b.label}</option>
              ))}
            </select>

            {/* Budget Dropdown */}
            <select
              value={budgetPreset}
              onChange={(e) => setBudgetPreset(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#008F8C]"
            >
              {BUDGET_PRESETS.map(b => (
                <option key={b.id} value={b.id}>{b.label}</option>
              ))}
            </select>

            {/* Locality Dropdown if available */}
            {availableLocalities.length > 0 && (
              <select
                value={selectedLocality}
                onChange={(e) => setSelectedLocality(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#008F8C] max-w-[130px] truncate"
              >
                <option value="all">All Localities</option>
                {availableLocalities.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            )}

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#008F8C]"
            >
              {SORT_OPTIONS.map(s => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>

            {/* Clear Filters if active */}
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-2xl transition-colors inline-flex items-center gap-1"
              >
                <X size={12} /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Mobile View Toggle (List vs Map) */}
        <div className="md:hidden mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500">
            {properties.length} {properties.length === 1 ? "Property" : "Properties"} in {selectedCity}
          </span>

          <div className="flex bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={() => setMobileTab("list")}
              className={`px-3 py-1 text-xs font-black rounded-xl transition-all ${
                mobileTab === "list"
                  ? "bg-[#006D6A] text-white shadow"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              List View
            </button>
            <button
              onClick={() => setMobileTab("map")}
              className={`px-3 py-1 text-xs font-black rounded-xl transition-all flex items-center gap-1 ${
                mobileTab === "map"
                  ? "bg-[#006D6A] text-white shadow"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <MapIcon size={12} />
              <span>Map View</span>
            </button>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────
          3. MAIN CONTENT: DUAL-COLUMN LIST + INTERACTIVE MAP LAYOUT
      ─────────────────────────────────────────────────────────── */}
      <section className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: PROPERTY CARDS STREAM (hidden on mobile if mobileTab === 'map') */}
          <div className={`lg:col-span-7 space-y-4 ${mobileTab === "map" ? "hidden md:block" : "block"}`}>
            {/* Header info bar */}
            <div className="hidden md:flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-black text-slate-800 text-sm">
                  {properties.length} Verified {properties.length === 1 ? "Property" : "Properties"} in {selectedCity}
                </span>
                {hasActiveFilters && (
                  <span className="text-[11px] bg-[#E6F4F2] text-[#006D6A] font-bold px-2 py-0.5 rounded-full border border-[#D9E5E3]">
                    Filtered
                  </span>
                )}
              </div>

              {/* Grid / List layout switcher */}
              <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl">
                <button
                  onClick={() => setCardLayout("grid")}
                  className={`p-1.5 rounded-lg transition-colors ${cardLayout === "grid" ? "bg-white text-[#006D6A] shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                  title="Grid Layout"
                >
                  <Grid size={15} />
                </button>
                <button
                  onClick={() => setCardLayout("list")}
                  className={`p-1.5 rounded-lg transition-colors ${cardLayout === "list" ? "bg-white text-[#006D6A] shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                  title="List Layout"
                >
                  <List size={15} />
                </button>
              </div>
            </div>

            {/* AI Search Prompt Suggestion Pill */}
            {onOpenChatWithQuery && (
              <div className="bg-[#E6F4F2] border border-[#006D6A]/30 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-[#004F4D] font-medium min-w-0">
                  <Sparkles size={16} className="text-[#008F8C] flex-shrink-0 animate-pulse" />
                  <span className="truncate">
                    Ask SAI AI: <strong className="font-bold">"Show me best 2 BHK under 80L in {selectedCity}"</strong>
                  </span>
                </div>
                <button
                  onClick={() => onOpenChatWithQuery(`Show me best verified properties in ${selectedCity}`)}
                  className="bg-[#006D6A] text-white font-bold px-3 py-1.5 rounded-xl hover:bg-[#004F4D] transition-colors flex-shrink-0 text-[11px]"
                >
                  Ask AI
                </button>
              </div>
            )}

            {/* LOADING SKELETON STATE */}
            {loading && (
              <div className={cardLayout === "grid" ? "grid grid-cols-1 sm:grid-cols-2 gap-4" : "space-y-4"}>
                {[1, 2, 3, 4].map(n => (
                  <div key={n} className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm animate-pulse space-y-3">
                    <div className="w-full h-44 bg-slate-200 rounded-2xl" />
                    <div className="h-4 bg-slate-200 rounded-md w-3/4" />
                    <div className="h-3 bg-slate-100 rounded-md w-1/2" />
                    <div className="flex justify-between items-center pt-2">
                      <div className="h-5 bg-slate-200 rounded-md w-1/3" />
                      <div className="h-8 bg-slate-200 rounded-xl w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ERROR STATE */}
            {!loading && error && (
              <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center space-y-3">
                <p className="font-bold text-red-700 text-base">{error}</p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={loadCityProperties}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors inline-flex items-center gap-1.5"
                  >
                    <RefreshCw size={14} /> Retry
                  </button>
                  <button
                    onClick={() => handleCitySelect("Pune")}
                    className="bg-white border border-red-300 text-red-700 font-bold text-xs px-4 py-2 rounded-xl hover:bg-red-50 transition-colors"
                  >
                    Switch to Pune
                  </button>
                </div>
              </div>
            )}

            {/* EMPTY STATE */}
            {!loading && !error && properties.length === 0 && (
              <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-slate-200 shadow-sm space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-[#E6F4F2] flex items-center justify-center mx-auto text-[#006D6A]">
                  <Building2 size={32} />
                </div>
                <h3 className="font-black text-slate-800 text-xl">
                  No properties found in {selectedCity}
                </h3>
                <p className="text-slate-500 text-sm max-w-md mx-auto">
                  {hasActiveFilters
                    ? "We couldn't find listings matching your active filters. Try broadening your criteria or reset your filters."
                    : `Currently there are no listed properties in ${selectedCity}. Explore other major property hubs nearby!`}
                </p>

                <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                  {hasActiveFilters && (
                    <button
                      onClick={handleClearFilters}
                      className="bg-[#006D6A] hover:bg-[#004F4D] text-white font-bold text-xs px-5 py-2.5 rounded-2xl shadow transition-colors"
                    >
                      Clear Filters
                    </button>
                  )}
                  <button
                    onClick={() => handleCitySelect("Pune")}
                    className="bg-[#E6F4F2] hover:bg-[#D9E5E3] text-[#006D6A] font-bold text-xs px-4 py-2.5 rounded-2xl border border-[#006D6A]/30 transition-colors"
                  >
                    Explore Pune (20+ Listings)
                  </button>
                  <button
                    onClick={() => handleCitySelect("Mumbai")}
                    className="bg-[#E6F4F2] hover:bg-[#D9E5E3] text-[#006D6A] font-bold text-xs px-4 py-2.5 rounded-2xl border border-[#006D6A]/30 transition-colors"
                  >
                    Explore Mumbai
                  </button>
                  <button
                    onClick={() => handleCitySelect("Bangalore")}
                    className="bg-[#E6F4F2] hover:bg-[#D9E5E3] text-[#006D6A] font-bold text-xs px-4 py-2.5 rounded-2xl border border-[#006D6A]/30 transition-colors"
                  >
                    Explore Bangalore
                  </button>
                </div>
              </div>
            )}

            {/* REAL PROPERTIES LIST */}
            {!loading && !error && properties.length > 0 && (
              <div className={cardLayout === "grid" ? "grid grid-cols-1 sm:grid-cols-2 gap-4" : "space-y-4"}>
                {properties.map((p) => {
                  const isHovered = hoveredPropertyId === p.id;
                  const isFav = favorites.has(p.id);

                  // Extract clean image url
                  const imgUrl =
                    p.media && p.media.length > 0
                      ? (typeof p.media[0] === "string" ? p.media[0] : (p.media[0]?.url || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80"))
                      : "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80";

                  const rawPrice = Number(p.price) || 0;
                  const priceStr =
                    p.price_display ||
                    (rawPrice >= 10000000
                      ? `₹${(rawPrice / 10000000).toFixed(2)} Cr`
                      : rawPrice >= 100000
                      ? `₹${(rawPrice / 100000).toFixed(1)} L`
                      : `₹${rawPrice.toLocaleString("en-IN")}`);

                  return (
                    <div
                      key={p.id}
                      onMouseEnter={() => setHoveredPropertyId(p.id)}
                      onMouseLeave={() => setHoveredPropertyId(null)}
                      onClick={() => {
                        selectProperty(p.id);
                        navigate("property");
                      }}
                      className={`group bg-white rounded-3xl overflow-hidden border transition-all duration-300 cursor-pointer flex flex-col justify-between shadow-sm hover:shadow-xl hover:-translate-y-1 ${
                        isHovered
                          ? "border-[#008F8C] ring-2 ring-[#008F8C]/30 shadow-lg"
                          : "border-slate-200/90"
                      }`}
                    >
                      {/* Image Container with Badges */}
                      <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                        <img
                          src={imgUrl}
                          alt={p.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                        />

                        {/* Top Badges */}
                        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="bg-[#006D6A] text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow flex items-center gap-1">
                              <ShieldCheck size={11} /> Verified
                            </span>
                            {p.is_rera && (
                              <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow">
                                RERA
                              </span>
                            )}
                            <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                              {p.property_type || "Apartment"}
                            </span>
                          </div>

                          {/* Favorite Heart Button */}
                          <button
                            type="button"
                            onClick={(e) => handleToggleFavorite(e, p.id)}
                            className={`p-2 rounded-full backdrop-blur-md transition-transform pointer-events-auto active:scale-90 ${
                              isFav
                                ? "bg-red-500 text-white shadow"
                                : "bg-white/80 hover:bg-white text-slate-700"
                            }`}
                            title={isFav ? "Saved to Favorites" : "Save Property"}
                          >
                            <Heart size={14} className={isFav ? "fill-white" : ""} />
                          </button>
                        </div>

                        {/* Bottom Gradient Overlay with Price */}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent p-3 flex items-end justify-between">
                          <span className="text-white font-black text-lg drop-shadow-md">
                            {priceStr}
                          </span>
                          <span className="text-white/90 text-[11px] font-semibold bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-lg">
                            {p.area_sqft} sq.ft
                          </span>
                        </div>
                      </div>

                      {/* Card Content Body */}
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-black text-slate-800 text-sm sm:text-base leading-snug line-clamp-1 group-hover:text-[#006D6A] transition-colors">
                            {p.title}
                          </h4>

                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 truncate">
                            <MapPin size={12} className="text-[#008F8C] flex-shrink-0" />
                            <span>{p.locality ? `${p.locality}, ` : ""}{p.city}</span>
                          </p>

                          {/* Spec Pills */}
                          <div className="flex flex-wrap items-center gap-1.5 mt-2.5 text-[11px]">
                            {p.bhk && (
                              <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-md">
                                {p.bhk} BHK
                              </span>
                            )}
                            {p.furnishing && (
                              <span className="bg-[#E6F4F2] text-[#006D6A] font-bold px-2 py-0.5 rounded-md capitalize">
                                {p.furnishing}
                              </span>
                            )}
                            <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-md">
                              {p.status === "available" ? "Ready" : p.status}
                            </span>
                          </div>
                        </div>

                        {/* View Details Button */}
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[11px] text-slate-400 font-semibold">
                            {p.match_score ? `${p.match_score}% AI Match` : "Verified Property"}
                          </span>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              selectProperty(p.id);
                              navigate("property");
                            }}
                            className="bg-[#006D6A] group-hover:bg-[#004F4D] text-white font-black text-xs px-3.5 py-1.5 rounded-xl shadow-sm transition-all flex items-center gap-1"
                          >
                            <span>View Details</span>
                            <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: STICKY INTERACTIVE MAP (hidden on mobile if mobileTab === 'list') */}
          <div className={`lg:col-span-5 sticky top-24 z-10 ${mobileTab === "list" ? "hidden md:block" : "block"}`}>
            <div className="bg-white rounded-3xl p-3 border border-slate-200 shadow-md">
              <div className="flex items-center justify-between mb-2 px-2 pt-1">
                <div className="flex items-center gap-1.5">
                  <MapPin size={15} className="text-[#006D6A]" />
                  <span className="font-black text-slate-800 text-xs sm:text-sm">
                    Interactive Map · {selectedCity}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-semibold">
                  {properties.length} Pins
                </span>
              </div>

              {/* Leaflet Map Centered around Selected City */}
              <div className="rounded-2xl overflow-hidden border border-slate-200 relative">
                <PropertyMap
                  city={selectedCity}
                  properties={properties}
                  selectedPropertyId={hoveredPropertyId}
                  onSelectProperty={(id) => setHoveredPropertyId(id)}
                  onViewPropertyDetails={(id) => {
                    selectProperty(id);
                    navigate("property");
                  }}
                  height={520}
                />
              </div>

              {/* Map footer helper */}
              <p className="text-[10px] text-slate-400 text-center mt-2">
                Click any pin to inspect pricing and view full walkthrough & 3D tour.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
