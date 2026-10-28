import React from "react";
import { WalkthroughProps } from "./PropertyScene";
import { FurnishedFlatWalkthrough } from "./FurnishedFlatWalkthrough";

/**
 * Fully Furnished Flat — Interactive 3D Virtual Walkthrough
 * Features all 9 complete rooms: Entrance, Living Room, Dining Area, Kitchen,
 * Master Bedroom, Bedroom 2, Attached Bathroom, Common Bathroom, and Balcony.
 * Supports 360° panoramic look-around, touch gestures, room hotspots, floor plan,
 * and dual-mode toggle with Three.js architectural structural model.
 */
export const PropertyWalkthrough: React.FC<WalkthroughProps> = (props) => {
  return <FurnishedFlatWalkthrough {...props} />;
};

export default PropertyWalkthrough;
