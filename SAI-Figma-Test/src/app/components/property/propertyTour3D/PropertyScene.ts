export interface Property3DRoom {
  id: string;
  name: string;
  type: string;
  order: number;
  position: { x: number; y: number; z: number };
  dimensions: { width: number; length: number; height: number };
  floor_material?: string;
  wall_color?: string;
  camera_focus?: { position: [number, number, number]; look_at: [number, number, number] };
  label?: string;
  subtitle?: string;
  has_actual_image?: boolean;
  image_url?: string | null;
  furniture?: Array<{ type: string; position: [number, number, number]; rotation_y?: number }>;
}

export interface Property3DDoor {
  id: string;
  name: string;
  is_main_entrance?: boolean;
  is_balcony?: boolean;
  position: [number, number, number];
  rotation_y?: number;
  width: number;
  height: number;
}

export interface Property3DCameraStep {
  id: string;
  step_name: string;
  room_id: string;
  position: [number, number, number];
  look_at: [number, number, number];
  duration: number;
  action: "door_open" | "balcony_open" | "pan_180" | "exterior_view" | "complete" | "none";
  label: string;
}

export interface Property3DBuildingConfig {
  building_type: "villa" | "apartment";
  total_floors: number;
  selected_floor: number;
  facade_style?: string;
  primary_color?: string;
  accent_color?: string;
  glass_tint?: string;
  has_balconies?: boolean;
  city?: string;
  locality?: string;
}

export interface Property3DTourData {
  property_id: number;
  title: string;
  bhk: number;
  bedrooms: number;
  bathrooms: number;
  balconies: number;
  property_type: string;
  city: string;
  locality: string;
  address?: string;
  area_sqft: number;
  price_display?: string;
  is_verified_floorplan: boolean;
  floor_plan_url?: string | null;
  scene: {
    units: string;
    ceiling_height: number;
    wall_thickness: number;
  };
  building: Property3DBuildingConfig;
  rooms: Property3DRoom[];
  doors: Property3DDoor[];
  camera_path: Property3DCameraStep[];
  exterior: Record<string, any>;
  media?: Array<{ category: string; urls: string[] }>;
}

export interface Property3DTourProps {
  propertyId: number;
  propertyTitle?: string;
  property?: any;
  initialWalkthrough?: Property3DTourData | any;
  isOpen?: boolean;
  isModal?: boolean;
  onClose?: () => void;
  onContactClick?: () => void;
  onScheduleVisitClick?: () => void;
  className?: string;
}
