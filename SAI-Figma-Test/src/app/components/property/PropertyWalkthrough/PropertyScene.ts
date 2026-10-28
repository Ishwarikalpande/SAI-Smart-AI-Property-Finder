export interface WalkthroughScene {
  id: string;
  title: string;
  duration: number;
  image_url?: string | null;
  category?: string;
  animation?: "ken-burns" | "fade-slide" | "card-reveal" | string;
  subtitle?: string;
  data?: Record<string, any>;
}

export interface WalkthroughRoom {
  id: string;
  name: string;
  type: string;
  order: number;
  duration: number;
  image_url?: string | null;
  has_actual_image: boolean;
  bedroom_number?: number;
  bathroom_number?: number;
  balcony_number?: number;
  data?: Record<string, any>;
}

export interface WalkthroughPropertyInfo {
  id?: number;
  title?: string;
  property_type?: string;
  bhk?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  balconies?: number | null;
  area?: string | null;
  price?: string | null;
  city?: string | null;
  locality?: string | null;
  floor_plan?: string | null;
  amenities?: string[];
  [key: string]: any;
}

export interface PropertyWalkthrough {
  property_id: number;
  title: string;
  duration: number;
  theme?: string;
  transition?: string;
  property?: WalkthroughPropertyInfo;
  rooms?: WalkthroughRoom[];
  scenes: WalkthroughScene[];
}

export interface WalkthroughProps {
  propertyId: number;
  propertyTitle?: string;
  property?: any;
  initialWalkthrough?: PropertyWalkthrough | null;
  isOpen?: boolean;
  isModal?: boolean;
  onClose?: () => void;
  onContactClick?: () => void;
  onDetailsClick?: () => void;
  onScheduleVisitClick?: () => void;
  className?: string;
}
