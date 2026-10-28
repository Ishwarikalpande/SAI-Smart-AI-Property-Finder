import { apiRequest } from "./client";
import { getPropertyImages, isReliableImageUrl } from "../app/data/propertyImages";

export interface PropertyMediaItem {
  id: number;
  media_type: string;
  media_category?: string;
  url: string;
  thumbnail_url?: string;
  sort_order: number;
}

export interface PropertyItem {
  id: number;
  title: string;
  description?: string;
  property_type: string;
  listing_type: string;
  bhk?: number | null;
  area_sqft: number;
  price: number;
  price_display?: string;
  furnishing?: string;
  amenities: string[];
  address?: string;
  locality: string;
  city: string;
  state?: string;
  country?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  status: string;
  is_verified: boolean;
  is_rera: boolean;
  badge?: string;
  match_score?: number;
  rating?: number;
  dist_metro?: string;
  sponsored?: boolean;
  sponsored_label?: string;
  owner_id?: number;
  agent_id?: number;
  builder_id?: number;
  created_at: string;
  updated_at: string;
  media: PropertyMediaItem[];
  image_url?: string;
  images_urls?: string[];
}

export interface PropertyListResponse {
  items: PropertyItem[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export async function fetchProperties(params: {
  city?: string;
  locality?: string;
  listing_type?: string;
  property_type?: string;
  bhk?: number;
  min_price?: number;
  max_price?: number;
  page?: number;
  limit?: number;
} = {}): Promise<PropertyListResponse> {
  const query = new URLSearchParams();
  if (params.city && params.city !== "All Cities") query.set("city", params.city);
  if (params.locality) query.set("locality", params.locality);
  if (params.listing_type) query.set("listing_type", params.listing_type);
  if (params.property_type) query.set("property_type", params.property_type);
  if (params.bhk !== undefined && params.bhk !== null) query.set("bhk", params.bhk.toString());
  if (params.min_price !== undefined && params.min_price !== null) query.set("min_price", params.min_price.toString());
  if (params.max_price !== undefined && params.max_price !== null) query.set("max_price", params.max_price.toString());
  if (params.page) query.set("page", params.page.toString());
  if (params.limit) query.set("limit", params.limit.toString());

  const qs = query.toString();
  return apiRequest<PropertyListResponse>(`/properties${qs ? `?${qs}` : ""}`);
}

export async function fetchCities(): Promise<string[]> {
  return apiRequest<string[]>("/properties/cities");
}

export async function fetchLocalities(city?: string): Promise<string[]> {
  return apiRequest<string[]>(`/properties/localities${city ? `?city=${encodeURIComponent(city)}` : ""}`);
}

export async function fetchPropertyById(id: number): Promise<PropertyItem> {
  return apiRequest<PropertyItem>(`/properties/${id}`);
}

export async function fetchMyProperties(): Promise<PropertyItem[]> {
  return apiRequest<PropertyItem[]>("/properties/my");
}

export async function createProperty(payload: Partial<PropertyItem>): Promise<PropertyItem> {
  return apiRequest<PropertyItem>("/properties/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateProperty(id: number, payload: Partial<PropertyItem>): Promise<PropertyItem> {
  return apiRequest<PropertyItem>(`/properties/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteProperty(id: number): Promise<void> {
  return apiRequest<void>(`/properties/${id}`, {
    method: "DELETE",
  });
}

export interface UIProperty {
  id: number;
  name: string;
  type: string;
  price: string;
  priceNum: number;
  location: string;
  img: string;
  images?: string[];
  match: number;
  badge: string;
  verified: boolean;
  area: string;
  amenities: string[];
  dist: string;
  rating: number;
  rera: boolean;
  status: string;
  sponsored?: boolean;
  sponsoredLabel?: string;
  forBuy: boolean;
  forRent: boolean;
  forCommercial: boolean;
  latitude?: number;
  longitude?: number;
  description?: string;
}

const DEFAULT_PROPERTY_IMGS = [
  "https://images.unsplash.com/photo-1682184805271-11671b7ecf4c?w=800&h=600&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1779976955613-b74623824d1c?w=800&h=600&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1711114377419-09b0cd2d786b?w=800&h=600&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1680416124510-5eae1beca412?w=800&h=600&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1700219447843-d9fafce8143f?w=800&h=600&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1764996915324-91919cee14d3?w=800&h=600&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1564078516393-cf04bd966897?w=800&h=600&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1758431145201-2846e60054b0?w=800&h=600&fit=crop&auto=format",
];

export function toUIProperty(item: PropertyItem): UIProperty {
  const fallbackImg = DEFAULT_PROPERTY_IMGS[(item.id - 1) % DEFAULT_PROPERTY_IMGS.length] || DEFAULT_PROPERTY_IMGS[0];
  const rawMediaImgs = item.media && Array.isArray(item.media) && item.media.length > 0 
    ? item.media.map(m => m.url).filter(isReliableImageUrl) 
    : undefined;
  const multiPhotos = getPropertyImages(item.id, fallbackImg, item.property_type, (rawMediaImgs && rawMediaImgs.length > 0) ? rawMediaImgs : undefined);
  const mediaImgs = multiPhotos.map(p => p.url);

  const amenitiesList = Array.isArray(item.amenities)
    ? item.amenities
    : typeof item.amenities === "string"
    ? (item.amenities as string).split(/[,\s]+/).filter(Boolean)
    : ["Parking", "Power Backup", "Security"];

  const isBuy = item.listing_type === "sale" || item.listing_type === "buy";
  const isRent = item.listing_type === "rent";
  const isComm = item.listing_type === "commercial";

  const priceNumLakhs = Math.round(item.price / 100000);

  return {
    id: item.id,
    name: item.title,
    type: item.bhk ? `${item.bhk} BHK ${item.property_type}` : item.property_type,
    price: item.price_display || (item.price >= 10000000 ? `₹${(item.price / 10000000).toFixed(1)}Cr` : `₹${priceNumLakhs}L`),
    priceNum: priceNumLakhs > 0 ? priceNumLakhs : Math.round(item.price / 1000),
    location: `${item.locality || ""}${item.locality && item.city ? ", " : ""}${item.city || ""}`,
    img: mediaImgs[0] || fallbackImg,
    images: mediaImgs,
    match: item.match_score || 88,
    badge: item.badge || (item.is_verified ? "Verified" : "Featured"),
    verified: item.is_verified,
    area: `${item.area_sqft ? item.area_sqft.toLocaleString() : "1,200"} sq ft`,
    amenities: amenitiesList,
    dist: item.dist_metro || "1.0 km Metro",
    rating: item.rating || 4.6,
    rera: item.is_rera,
    status: item.status || "Ready to Move",
    sponsored: item.sponsored,
    sponsoredLabel: item.sponsored_label,
    forBuy: isBuy || (!isRent && !isComm),
    forRent: isRent,
    forCommercial: isComm,
    latitude: item.latitude,
    longitude: item.longitude,
    description: item.description,
  };
}

export interface ComparisonField {
  category: string;
  field: string;
  values: Record<string, any>;
  is_different: boolean;
}

export interface RequirementMatrixRow {
  criterion: string;
  user_value: any;
  results: Record<string, { matched: boolean; text: string }>;
}

export interface PropertyComparisonData {
  properties: any[];
  fields: ComparisonField[];
  matrix: Record<string, any[]>;
  comparable_fields?: Record<string, any[]>;
  differences: string[];
  advantages: Record<string, string[]>;
  considerations: Record<string, string[]>;
  requirement_matrix: RequirementMatrixRow[];
  requirement_match: Array<{
    property_id: number;
    property_title: string;
    matches: string[];
    mismatches: string[];
    match_count: number;
    mismatch_count: number;
  }>;
  amenity_comparison: {
    common: string[];
    unique: Record<string, string[]>;
    checklist: Array<{ amenity: string; [propId: string]: any }>;
  };
  price_analysis: {
    cheapest_id: number;
    cheapest_title: string;
    cheapest_price: number;
    priciest_id: number;
    priciest_title: string;
    priciest_price: number;
    difference: number;
    difference_display: string;
    explanation: string;
  };
  area_analysis: {
    largest_id: number;
    largest_title: string;
    largest_area: number;
    smallest_id: number;
    smallest_title: string;
    smallest_area: number;
    difference: number;
    difference_display: string;
    explanation: string;
  };
  recommendation_reason: string;
  best_match_id?: number | null;
  summary: string;
}

export interface ComparePropertiesPayload {
  property_ids: (number | string)[];
  conversation_id?: string;
  user_requirements?: {
    city?: string;
    bhk?: number;
    budget_max?: number;
    parking_required?: boolean;
    ready_required?: boolean;
    locality?: string;
    [key: string]: any;
  };
  priority?: string;
}

export interface ComparePropertiesResponse {
  properties: any[];
  comparison: PropertyComparisonData;
  matrix: Record<string, any[]>;
  differences: string[];
  summary: string;
  best_match_id?: number | null;
}

export async function compareProperties(payload: ComparePropertiesPayload): Promise<ComparePropertiesResponse> {
  return apiRequest<ComparePropertiesResponse>("/properties/compare", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function recordPropertyView(propertyId: number): Promise<{ success: boolean; recorded: boolean; views_count: number }> {
  return apiRequest<{ success: boolean; recorded: boolean; views_count: number }>(`/properties/${propertyId}/view`, {
    method: "POST",
  });
}

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

export interface PropertyWalkthroughData {
  property_id: number;
  title: string;
  duration: number;
  theme?: string;
  transition?: string;
  property?: Record<string, any>;
  rooms?: any[];
  scenes: WalkthroughScene[];
}

export interface WalkthroughGenerateResponse {
  property_id: number;
  status: string;
  walkthrough_id: string;
  scene_count: number;
  version: number;
}

export async function fetchPropertyWalkthrough(propertyId: number): Promise<PropertyWalkthroughData> {
  return apiRequest<PropertyWalkthroughData>(`/properties/${propertyId}/walkthrough`);
}

export async function generatePropertyWalkthrough(propertyId: number, force: boolean = false): Promise<WalkthroughGenerateResponse> {
  return apiRequest<WalkthroughGenerateResponse>(`/properties/${propertyId}/walkthrough/generate`, {
    method: "POST",
    body: JSON.stringify({ force }),
  });
}

// ── 3D PROPERTY WALKTHROUGH ──────────────────────────────────────────
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
  building: {
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
  };
  rooms: Property3DRoom[];
  doors: Property3DDoor[];
  camera_path: Property3DCameraStep[];
  exterior: Record<string, any>;
  media?: Array<{ category: string; urls: string[] }>;
}

export async function fetchProperty3DTour(propertyId: number, force: boolean = false): Promise<Property3DTourData> {
  return apiRequest<Property3DTourData>(`/properties/${propertyId}/3d-tour?force=${force}`);
}

export async function saveProperty3DTour(propertyId: number, payload: Partial<Property3DTourData>): Promise<Property3DTourData> {
  return apiRequest<Property3DTourData>(`/properties/${propertyId}/3d-tour`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}



