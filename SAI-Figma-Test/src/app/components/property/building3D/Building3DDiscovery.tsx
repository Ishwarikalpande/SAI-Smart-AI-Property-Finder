import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  fetchBuilding3DData,
  fetchProjectBuildings,
  fetchUnit3DTour,
  Building3DResponse,
  Unit3DItem,
  BookingResponse
} from "../../../../api/building3D";
import {
  generateMockBuilding3DData,
  generateMockProjectBuildings,
  generateMockUnitTour,
} from "../../../../api/mockBuilding3D";
import { Building3DCanvas } from "./Building3DCanvas";
import { BuildingControls, CameraPreset, LightingMode } from "./BuildingControls";
import { FloorSelector } from "./FloorSelector";
import { FloorLayout2D } from "./FloorLayout2D";
import { FlatDetailPanel } from "./FlatDetailPanel";
import { Compass3D } from "./Compass3D";
import { BookingModal } from "./BookingModal";
import { SmartFlatFinderModal } from "./SmartFlatFinderModal";
import { FlatComparisonModal } from "./FlatComparisonModal";
import { Property3DTour } from "../propertyTour3D/Property3DTour";
import {
  Building2,
  Sparkles,
  Scale,
  Search,
  CheckCircle,
  AlertCircle,
  Share2,
  ArrowLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Film
} from "lucide-react";

interface Building3DDiscoveryProps {
  initialBuildingId?: number;
  initialProjectId?: number;
  initialFloorNumber?: number;
  initialUnitNumber?: string;
  onBack?: () => void;
  onNavigateToBuyerDashboard?: () => void;
}

export const Building3DDiscovery: React.FC<Building3DDiscoveryProps> = ({
  initialBuildingId = 10, // Tower A of ABC Residency
  initialProjectId = 5,
  initialFloorNumber = 20,
  initialUnitNumber = "C",
  onBack,
  onNavigateToBuyerDashboard,
}) => {
  const [buildingId, setBuildingId] = useState<number>(initialBuildingId);
  const [projectId, setProjectId] = useState<number>(initialProjectId);
  const [buildingData, setBuildingData] = useState<Building3DResponse | null>(null);
  const [siblingBuildings, setSiblingBuildings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selection state
  const [selectedFloorNumber, setSelectedFloorNumber] = useState<number>(initialFloorNumber);
  const [selectedUnit, setSelectedUnit] = useState<Unit3DItem | null>(null);

  // 3D Visualizer controls state
  const [lightingMode, setLightingMode] = useState<LightingMode>("day");
  const [explodedView, setExplodedView] = useState(false);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>("reset");

  // Modals state
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [finderModalOpen, setFinderModalOpen] = useState(false);
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [comparedUnits, setComparedUnits] = useState<Unit3DItem[]>([]);

  // 3D Walkthrough Tour State
  const [activeTourUnit, setActiveTourUnit] = useState<Unit3DItem | null>(null);
  const [activeTourScene, setActiveTourScene] = useState<any>(null);
  const [loadingTour, setLoadingTour] = useState(false);

  // Floor blueprint expand state
  const [floorLayoutOpen, setFloorLayoutOpen] = useState(true);

  // URL Deep-link Sync
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const bId = urlParams.get("buildingId");
      const fNum = urlParams.get("floor");
      const uNum = urlParams.get("unit");

      if (bId) setBuildingId(Number(bId));
      if (fNum) setSelectedFloorNumber(Number(fNum));
    } catch {}
  }, []);

  // Fetch Building Data
  const loadBuildingData = useCallback(async (bId: number) => {
    setLoading(true);
    setError(null);
    try {
      let res = await fetchBuilding3DData(bId);
      if (!res || !Array.isArray(res.floors) || res.floors.length === 0 || !res.building) {
        res = generateMockBuilding3DData(bId);
      }
      setBuildingData(res);
      setProjectId(res.building?.project_id || 5);

      // Find initial unit or floor
      const currentFloorUnits = (res.floors || []).find((f) => f.floor_number === selectedFloorNumber)?.units || [];
      const matchUnit = initialUnitNumber
        ? (currentFloorUnits || []).find((u) => u.unit_number.toUpperCase() === initialUnitNumber.toUpperCase())
        : currentFloorUnits?.[0];

      if (matchUnit) {
        setSelectedUnit(matchUnit);
      } else if (currentFloorUnits.length > 0) {
        setSelectedUnit(currentFloorUnits[0]);
      }

      // Also load sibling buildings (for Tower A <-> Tower B switching)
      if (res.building?.project_id) {
        fetchProjectBuildings(res.building.project_id)
          .then((blds) => {
            if (Array.isArray(blds) && blds.length > 0) {
              setSiblingBuildings(blds);
            } else {
              setSiblingBuildings(generateMockProjectBuildings(res.building.project_id));
            }
          })
          .catch(() => {
            setSiblingBuildings(generateMockProjectBuildings(res.building.project_id));
          });
      }
    } catch (err: any) {
      console.warn("Using offline 3D building fallback data:", err);
      const fallback = generateMockBuilding3DData(bId);
      setBuildingData(fallback);
      setProjectId(fallback.building.project_id);
      const currentFloorUnits = (fallback.floors || []).find((f) => f.floor_number === selectedFloorNumber)?.units || [];
      const matchUnit = initialUnitNumber
        ? (currentFloorUnits || []).find((u) => u.unit_number.toUpperCase() === initialUnitNumber.toUpperCase())
        : currentFloorUnits?.[0];
      if (matchUnit) {
        setSelectedUnit(matchUnit);
      } else if (currentFloorUnits.length > 0) {
        setSelectedUnit(currentFloorUnits[0]);
      }
      setSiblingBuildings(generateMockProjectBuildings(fallback.building.project_id));
    } finally {
      setLoading(false);
    }
  }, [selectedFloorNumber, initialUnitNumber]);

  useEffect(() => {
    loadBuildingData(buildingId);
  }, [buildingId, loadBuildingData]);

  // When floor changes, update selected unit to first unit on that floor if not already on it
  const handleSelectFloor = (fn: number) => {
    setSelectedFloorNumber(fn);
    if (buildingData && Array.isArray(buildingData.floors)) {
      const fl = buildingData.floors.find((f) => f.floor_number === fn);
      if (fl && Array.isArray(fl.units) && fl.units.length > 0) {
        // Try to keep the same unit letter if it exists (e.g. C)
        const sameLetter = selectedUnit
          ? fl.units.find((u) => u.unit_number === selectedUnit.unit_number)
          : null;
        setSelectedUnit(sameLetter || fl.units[0]);
      }
    }
  };

  const handleSelectUnit = (u: Unit3DItem) => {
    setSelectedUnit(u);
    if (u.floor_number !== selectedFloorNumber) {
      setSelectedFloorNumber(u.floor_number);
    }
  };

  // Launch Unit 3D Virtual Tour
  const handleStartTour = async (u: Unit3DItem) => {
    setLoadingTour(true);
    try {
      let tourData = await fetchUnit3DTour(u.id);
      if (!tourData || !Array.isArray(tourData.rooms) || tourData.rooms.length === 0) {
        tourData = generateMockUnitTour(u.id);
      }
      setActiveTourScene(tourData);
      setActiveTourUnit(u);
    } catch (err) {
      console.warn("Unit tour fetch fallback:", err);
      const fallbackTour = generateMockUnitTour(u.id);
      setActiveTourScene(fallbackTour);
      setActiveTourUnit(u);
    } finally {
      setLoadingTour(false);
    }
  };

  // Compare handlers
  const handleAddToCompare = (u: Unit3DItem) => {
    if (!comparedUnits.some((x) => x.id === u.id)) {
      if (comparedUnits.length >= 4) {
        alert("You can compare up to 4 flats simultaneously.");
        return;
      }
      setComparedUnits([...comparedUnits, u]);
    }
    setCompareModalOpen(true);
  };

  const handleRemoveCompare = (uId: number) => {
    setComparedUnits(comparedUnits.filter((x) => x.id !== uId));
  };

  const currentFloor = useMemo(() => {
    if (!buildingData || !Array.isArray(buildingData.floors)) return undefined;
    return buildingData.floors.find((f) => f.floor_number === selectedFloorNumber);
  }, [buildingData, selectedFloorNumber]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070D18] flex flex-col items-center justify-center text-white">
        <div className="w-14 h-14 rounded-full border-4 border-teal-500/20 border-t-teal-400 animate-spin mb-4" />
        <h2 className="text-xl font-black tracking-wide text-slate-100">Constructing 3D Building Discovery Model...</h2>
        <p className="text-xs text-slate-400 mt-1">Generating floor plates, orientation bearings, and real-time inventory...</p>
      </div>
    );
  }

  if (error || !buildingData) {
    return (
      <div className="min-h-screen bg-[#070D18] flex flex-col items-center justify-center text-white p-6 text-center">
        <AlertCircle size={44} className="text-rose-400 mb-3" />
        <h2 className="text-xl font-bold">Unable to Load Building</h2>
        <p className="text-sm text-slate-400 mt-1 max-w-md">{error}</p>
        <button
          onClick={() => loadBuildingData(buildingId)}
          className="mt-4 px-5 py-2.5 bg-teal-600 hover:bg-teal-500 rounded-xl text-xs font-bold transition-colors cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070D18] text-white flex flex-col relative overflow-hidden select-none">
      {/* ── TOP NAV BAR ─────────────────────────────────────────────── */}
      <header className="h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Go back"
            >
              <ArrowLeft size={16} />
            </button>
          )}

          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm sm:text-base tracking-wide text-white">
                {buildingData.building.project_name}
              </span>
              <span className="text-slate-500 text-xs">·</span>
              <span className="text-xs font-bold text-teal-400">
                {buildingData.building.name}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {buildingData.building.project_locality}, {buildingData.building.project_city} · {buildingData.building.floors_count} Storeys · {buildingData.inventory_summary.total_units} Units
            </p>
          </div>
        </div>

        {/* Tower Switcher & Smart Tools */}
        <div className="flex items-center gap-2 sm:gap-3">
          {(siblingBuildings || []).length > 1 && (
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
              <span className="text-[10px] text-slate-400 uppercase px-1.5">Tower:</span>
              {(siblingBuildings || []).map((b) => (
                <button
                  key={b.id}
                  onClick={() => setBuildingId(b.id)}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    b.id === buildingId ? "bg-teal-600 text-white shadow" : "text-slate-400 hover:text-white"
                  }`}
                >
                  {b.name}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => setFinderModalOpen(true)}
            className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 border border-slate-700 transition-colors"
          >
            <Search size={13} className="text-teal-400" />
            <span className="hidden sm:inline">Find My Flat</span>
          </button>

          <button
            onClick={() => setCompareModalOpen(true)}
            className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 border border-slate-700 transition-colors relative"
          >
            <Scale size={13} className="text-teal-400" />
            <span className="hidden sm:inline">Compare</span>
            {comparedUnits.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-teal-500 text-slate-950 text-[10px] font-black flex items-center justify-center">
                {comparedUnits.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ── STATUS LEGEND BAR ───────────────────────────────────────── */}
      <div className="bg-slate-950/80 border-b border-slate-850 px-4 py-1.5 flex items-center justify-between text-[11px] overflow-x-auto whitespace-nowrap z-20">
        <div className="flex items-center gap-4">
          <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">Inventory Status:</span>
          {(buildingData.status_legend || []).map((leg) => (
            <div key={leg.status} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: leg.color }} />
              <span className="text-slate-300 font-semibold">{leg.label}</span>
              <span className="text-slate-500">({leg.count})</span>
            </div>
          ))}
        </div>

        <div className="text-slate-400 hidden md:flex items-center gap-3">
          <span>Building Facing: <strong className="text-white">{buildingData.building.front_direction}</strong></span>
          <span>·</span>
          <span>Clear Height: <strong className="text-white">{buildingData.building.floor_height}m</strong></span>
        </div>
      </div>

      {/* ── MAIN 3D VIEWPORT CONTAINER ──────────────────────────────── */}
      <div className="flex-1 relative flex flex-col min-h-0">
        {/* 3D WebGL Canvas */}
        <div className="w-full h-full absolute inset-0">
          <Building3DCanvas
            data={buildingData}
            selectedFloorNumber={selectedFloorNumber}
            onSelectFloor={handleSelectFloor}
            selectedUnitId={selectedUnit?.id}
            onSelectUnit={handleSelectUnit}
            lightingMode={lightingMode}
            explodedView={explodedView}
            cameraPreset={cameraPreset}
            onCameraPresetHandled={() => setCameraPreset("reset")}
          />
        </div>

        {/* Floating Top Controls Toolbar */}
        <div className="absolute top-4 left-4 z-20">
          <BuildingControls
            onPresetChange={(preset) => setCameraPreset(preset)}
            onZoomIn={() => {
              // Zoom handled via camera ref or wheel
            }}
            onZoomOut={() => {}}
            lightingMode={lightingMode}
            onLightingChange={setLightingMode}
            explodedView={explodedView}
            onToggleExplodedView={() => setExplodedView(!explodedView)}
            onResetView={() => setCameraPreset("reset")}
          />
        </div>

        {/* Floating Sky & Celestial Simulation Indicator */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/85 backdrop-blur-md border border-slate-700/70 text-xs shadow-xl">
          {lightingMode === "day" && (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span className="text-amber-300 font-bold">Bright Day Mode</span>
              <span className="text-slate-400">· Radiant Sun & Daylight Sky</span>
            </>
          )}
          {lightingMode === "sunset" && (
            <>
              <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping" />
              <span className="text-orange-300 font-bold">Sunset Dusk Mode</span>
              <span className="text-slate-400">· Golden Hour Horizon</span>
            </>
          )}
          {lightingMode === "night" && (
            <>
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
              <span className="text-indigo-200 font-bold">Blackish Night Mode</span>
              <span className="text-slate-400">· Luminous Moon & Twinkling Stars</span>
            </>
          )}
        </div>

        {/* Floating 3D Compass */}
        <div className="absolute top-4 right-4 z-20 hidden sm:block">
          <Compass3D
            buildingOrientation={buildingData.building.orientation}
            unitDirection={selectedUnit?.direction}
            unitAngle={selectedUnit?.direction_angle}
            entranceDirection={selectedUnit?.entrance_direction}
            balconyDirection={selectedUnit?.balcony_direction}
          />
        </div>

        {/* Floating Floor Selector Stepper */}
        <div className="absolute bottom-6 left-4 z-20">
          <FloorSelector
            buildingName={buildingData.building.name}
            floors={buildingData.floors}
            selectedFloorNumber={selectedFloorNumber}
            onSelectFloor={handleSelectFloor}
            selectedUnitLabel={selectedUnit?.unit_label}
          />
        </div>

        {/* Floating Selected Flat Details Card */}
        {selectedUnit && (
          <div className="absolute bottom-6 right-4 z-20">
            <FlatDetailPanel
              unit={selectedUnit}
              projectName={buildingData.building.project_name}
              towerName={buildingData.building.name}
              onStartTour={handleStartTour}
              onOpenBooking={() => setBookingModalOpen(true)}
              onViewFloorPlan={() => setFloorLayoutOpen(true)}
              onAddToCompare={handleAddToCompare}
              isInCompare={comparedUnits.some((x) => x.id === selectedUnit.id)}
            />
          </div>
        )}
      </div>

      {/* ── EXPANDABLE 2D FLOOR CORRIDOR & BLUEPRINT DRAWER ─────────── */}
      {floorLayoutOpen && currentFloor && (
        <div className="bg-slate-950/95 border-t border-slate-800 p-4 z-20 max-h-72 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                Floor {selectedFloorNumber} Corridor Layout & Unit Matrix
              </span>
              <button
                onClick={() => setFloorLayoutOpen(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Hide Layout ▲
              </button>
            </div>
            <FloorLayout2D
              floorNumber={selectedFloorNumber}
              units={currentFloor.units}
              selectedUnitId={selectedUnit?.id}
              onSelectUnit={handleSelectUnit}
              onStartTour={handleStartTour}
            />
          </div>
        </div>
      )}

      {/* ── TRANSACTION-SAFE BOOKING MODAL ──────────────────────────── */}
      {selectedUnit && (
        <BookingModal
          isOpen={bookingModalOpen}
          onClose={() => setBookingModalOpen(false)}
          unit={selectedUnit}
          projectName={buildingData.building.project_name}
          towerName={buildingData.building.name}
          onBookingSuccess={() => {
            loadBuildingData(buildingId);
            onNavigateToBuyerDashboard?.();
          }}
        />
      )}

      {/* ── SMART FLAT FINDER MODAL ─────────────────────────────────── */}
      <SmartFlatFinderModal
        isOpen={finderModalOpen}
        onClose={() => setFinderModalOpen(false)}
        defaultCity={buildingData.building.project_city}
        onSelectUnitResult={(foundUnit) => {
          if (foundUnit.tower_id && foundUnit.tower_id !== buildingId) {
            setBuildingId(foundUnit.tower_id);
          }
          if (foundUnit.floor_number) {
            setSelectedFloorNumber(foundUnit.floor_number);
          }
        }}
      />

      {/* ── FLAT COMPARISON MODAL ───────────────────────────────────── */}
      <FlatComparisonModal
        isOpen={compareModalOpen}
        onClose={() => setCompareModalOpen(false)}
        units={comparedUnits}
        onRemoveUnit={handleRemoveCompare}
        onSelectUnit={handleSelectUnit}
        onStartTour={handleStartTour}
      />

      {/* ── 3D VIRTUAL WALKTHROUGH TOUR MODAL ────────────────────────── */}
      {activeTourUnit && activeTourScene && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
          <div className="h-14 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Film size={18} className="text-teal-400" />
              <div>
                <h3 className="font-black text-sm text-white">
                  3D Walkthrough · {activeTourUnit.unit_label}
                </h3>
                <p className="text-[10px] text-slate-400">
                  {buildingData.building.name} · Level {activeTourUnit.floor_number} · Facing {activeTourUnit.direction}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {activeTourUnit.status === "available" && (
                <button
                  onClick={() => {
                    setActiveTourUnit(null);
                    setActiveTourScene(null);
                    setBookingModalOpen(true);
                  }}
                  className="py-1.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow transition-colors cursor-pointer"
                >
                  Book This Flat
                </button>
              )}
              <button
                onClick={() => {
                  setActiveTourUnit(null);
                  setActiveTourScene(null);
                }}
                className="py-1.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Return to Building
              </button>
            </div>
          </div>

          <div className="flex-1 relative">
            <Property3DTour
              initialWalkthrough={activeTourScene}
              propertyId={activeTourUnit.id}
              propertyTitle={activeTourUnit.unit_label}
              property={{
                id: activeTourUnit.id,
                title: activeTourUnit.unit_label,
                name: activeTourUnit.unit_label,
                bhk: activeTourUnit.bhk,
                area_sqft: activeTourUnit.area_sqft || activeTourUnit.carpet_area,
                price: activeTourUnit.price_display,
                city: buildingData?.building?.project_city || "Amravati",
              }}
              onClose={() => {
                setActiveTourUnit(null);
                setActiveTourScene(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
