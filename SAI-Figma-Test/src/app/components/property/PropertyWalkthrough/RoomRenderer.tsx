import React, { useState, useEffect } from "react";
import { WalkthroughRoom } from "./PropertyScene";
import { getMediaUrl } from "./walkthroughUtils";
import { CinematicVideoPlayer } from "./CinematicVideoPlayer";
import { True3DWalkthrough } from "./True3DWalkthrough";

interface RoomRendererProps {
  room: WalkthroughRoom;
  propertyData?: any;
  viewMode?: "video" | "3d";
  isReducedMotion?: boolean;
  onScheduleVisitClick?: () => void;
  onContactClick?: () => void;
  onRestart?: () => void;
}

export const RoomRenderer: React.FC<RoomRendererProps> = ({
  room,
  propertyData,
  viewMode = "video",
  isReducedMotion = false,
  onScheduleVisitClick,
  onContactClick,
  onRestart,
}) => {
  const [imageError, setImageError] = useState<boolean>(false);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);

  // Reset image error state whenever room changes
  useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
  }, [room.id, room.image_url]);

  const cleanImageUrl = getMediaUrl(room.image_url);
  const canRenderPhoto =
    Boolean(cleanImageUrl) &&
    !imageError &&
    room.type !== "amenities" &&
    room.type !== "location" &&
    room.type !== "summary";

  const shouldUsePhotoMode = viewMode === "video" && canRenderPhoto;

  // 1. Mode A: Photo-Based Cinematic Walkthrough (When actual image exists & video mode active)
  if (shouldUsePhotoMode && cleanImageUrl) {
    return (
      <CinematicVideoPlayer
        room={room}
        cleanImageUrl={cleanImageUrl}
        isReducedMotion={isReducedMotion}
        onImageLoaded={() => setImageLoaded(true)}
        onImageError={() => {
          console.warn(
            `[SAI Tour] Real image failed to load for room ${room.id} (${cleanImageUrl}), switching seamlessly to True 3D Room Visualization.`
          );
          setImageError(true);
        }}
      />
    );
  }

  // 2. Mode B: True 3D Walkthrough (First-Person 3D Camera & Geometry with zero black screen)
  return (
    <True3DWalkthrough
      room={room}
      propertyData={propertyData}
      isReducedMotion={isReducedMotion}
      onScheduleVisitClick={onScheduleVisitClick}
      onContactClick={onContactClick}
      onRestart={onRestart}
    />
  );
};
