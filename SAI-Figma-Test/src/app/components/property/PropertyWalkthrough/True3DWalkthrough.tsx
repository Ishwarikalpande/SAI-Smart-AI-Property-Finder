import React, { useState, useEffect, useRef } from "react";
import { WalkthroughRoom } from "./PropertyScene";
import { Sparkles, Compass, ShieldAlert, EyeOff } from "lucide-react";
import { LivingRoomScene } from "./rooms/LivingRoomScene";
import { KitchenScene } from "./rooms/KitchenScene";
import { BedroomScene } from "./rooms/BedroomScene";
import { BathroomScene } from "./rooms/BathroomScene";
import { BalconyScene } from "./rooms/BalconyScene";
import { EntranceScene } from "./rooms/EntranceScene";
import { ExteriorScene } from "./rooms/ExteriorScene";
import { AmenityScene } from "./AmenityScene";
import { LocationScene } from "./LocationScene";
import { PropertySummaryScene } from "./PropertySummaryScene";

interface True3DWalkthroughProps {
  room: WalkthroughRoom;
  propertyData?: any;
  isReducedMotion?: boolean;
  onScheduleVisitClick?: () => void;
  onContactClick?: () => void;
  onRestart?: () => void;
}

export const True3DWalkthrough: React.FC<True3DWalkthroughProps> = ({
  room,
  propertyData,
  isReducedMotion = false,
  onScheduleVisitClick,
  onContactClick,
  onRestart,
}) => {
  // First-person camera state
  const [cameraZ, setCameraZ] = useState<number>(0);
  const [cameraPanX, setCameraPanX] = useState<number>(0);
  const [isHovering, setIsHovering] = useState<boolean>(false);

  // Smooth first-person camera movement on room change
  useEffect(() => {
    setCameraZ(-150);
    setCameraPanX(0);

    const timer = setTimeout(() => {
      setCameraZ(0);
    }, 150);

    return () => clearTimeout(timer);
  }, [room.id]);

  // Subtle interactive first-person camera pan on mouse move
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isReducedMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xRatio = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
    setCameraPanX(xRatio * 15); // subtle max 15px parallax pan
  };

  const renderRoomGeometry = () => {
    switch (room.type) {
      case "exterior":
        return <ExteriorScene roomData={room.data} />;
      case "entrance":
        return <EntranceScene roomData={room.data} />;
      case "living_room":
      case "dining":
        return <LivingRoomScene roomData={room.data} dimensions={room.data?.dimensions} />;
      case "kitchen":
      case "utility":
        return <KitchenScene roomData={room.data} dimensions={room.data?.dimensions} />;
      case "bedroom":
      case "study":
      case "pooja":
        return (
          <BedroomScene
            roomName={room.name}
            bedroomNumber={room.bedroom_number}
            roomData={room.data}
            dimensions={room.data?.dimensions}
          />
        );
      case "bathroom":
        return (
          <BathroomScene
            roomName={room.name}
            bathroomNumber={room.bathroom_number}
            roomData={room.data}
            dimensions={room.data?.dimensions}
          />
        );
      case "balcony":
        return (
          <BalconyScene
            roomName={room.name}
            balconyNumber={room.balcony_number}
            roomData={room.data}
            dimensions={room.data?.dimensions}
          />
        );
      case "amenities":
        return (
          <div className="relative w-full h-full overflow-hidden bg-gradient-to-b from-[#091522] via-[#0d2235] to-[#08111c] flex items-center justify-center p-4">
            <AmenityScene
              amenities={room.data?.amenities || ["Lift", "Security", "Power Backup", "Covered Parking"]}
              subtitle={room.data?.subtitle}
              hasParking={room.data?.has_parking}
            />
          </div>
        );
      case "location":
        return (
          <div className="relative w-full h-full overflow-hidden bg-gradient-to-b from-[#091522] via-[#0d2235] to-[#08111c] flex items-center justify-center p-4">
            <LocationScene
              city={room.data?.city || "Urban Center"}
              locality={room.data?.locality || "Prime Neighborhood"}
              address={room.data?.address}
              state={room.data?.state}
              latitude={room.data?.latitude}
              longitude={room.data?.longitude}
              distMetro={room.data?.dist_metro}
            />
          </div>
        );
      case "summary":
        return (
          <PropertySummaryScene
            propertyData={room.data || propertyData}
            onScheduleVisitClick={onScheduleVisitClick}
            onContactClick={onContactClick}
            onRestart={onRestart}
          />
        );
      default:
        return <LivingRoomScene roomData={room.data} />;
    }
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      className="relative w-full h-full overflow-hidden bg-slate-950 flex items-center justify-center select-none"
      style={{ perspective: "1200px" }}
    >
      {/* 1. First-Person 3D Camera Rig Container */}
      <div
        className="w-full h-full transition-transform duration-700 ease-out flex items-center justify-center"
        style={{
          transform: `translate3d(${cameraPanX}px, 0, ${cameraZ}px)`,
          transformStyle: "preserve-3d",
        }}
      >
        {renderRoomGeometry()}
      </div>

      {/* 2. Mandatory Section 8 & 27 Compliance Badge (Top-left) */}
      <div className="absolute top-4 left-6 z-20 pointer-events-none">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 border border-amber-400/50 text-amber-300 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-lg">
          <Compass className="w-3 h-3 text-amber-300 animate-spin" />
          <span>Illustrative 3D Room Visualization • 3D First-Person View</span>
        </div>
      </div>
    </div>
  );
};
