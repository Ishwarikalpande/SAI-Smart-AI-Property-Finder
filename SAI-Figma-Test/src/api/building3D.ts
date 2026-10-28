import { apiRequest } from "./client";

export interface Unit3DItem {
  id: number;
  project_id: number;
  building_id: number;
  building_name: string;
  floor_id: number;
  floor_number: number;
  unit_number: string;
  unit_label: string;
  bhk: number;
  bedrooms: number;
  bathrooms: number;
  balconies: number;
  carpet_area: number;
  built_up_area: number;
  area_sqft: number;
  price: number;
  price_display: string;
  parking: string;
  direction: string;
  entrance_direction: string;
  balcony_direction: string;
  direction_angle: number;
  balcony_angle: number;
  entrance_angle: number;
  position: {
    x: number;
    y: number;
    z: number;
  };
  wing: string;
  status: "available" | "reserved" | "booked" | "sold" | "blocked";
  status_color: string;
  floor_plan_url?: string;
  has_3d_tour: boolean;
}

export interface Floor3DItem {
  id: number;
  floor_number: number;
  floor_label: string;
  floor_type: string;
  height_offset: number;
  total_units: number;
  available_units: number;
  units: Unit3DItem[];
}

export interface Building3DInfo {
  id: number;
  project_id: number;
  project_name: string;
  project_city: string;
  project_locality: string;
  name: string;
  code: string;
  floors_count: number;
  units_per_floor: number;
  total_units: number;
  status: string;
  floor_height: number;
  building_width: number;
  building_depth: number;
  orientation: number;
  front_direction: string;
  entrance_position: string;
  parking_levels: number;
  amenities: string[];
}

export interface Building3DResponse {
  building: Building3DInfo;
  inventory_summary: {
    total_units: number;
    available: number;
    reserved: number;
    booked: number;
    sold: number;
    blocked: number;
  };
  status_legend: Array<{
    status: string;
    label: string;
    color: string;
    count: number;
  }>;
  floors: Floor3DItem[];
}

export interface BookingPayload {
  unit_id: number;
  buyer_name?: string;
  buyer_email?: string;
  buyer_phone?: string;
  booking_amount?: number;
  payment_method?: string;
  notes?: string;
}

export interface BookingResponse {
  success: boolean;
  message: string;
  booking: {
    id: number;
    unit_id: number;
    unit_label: string;
    floor_number: number;
    bhk: number;
    area_sqft: number;
    direction: string;
    project_name: string;
    tower_name: string;
    price: number;
    price_display: string;
    booking_amount: number;
    booking_amount_display: string;
    status: string;
    created_at?: string;
  };
}

export interface SmartFlatFilterParams {
  city?: string;
  project_id?: number;
  building_id?: number;
  bhk?: number;
  floor?: number;
  floor_preference?: "high" | "mid" | "low";
  direction?: string;
  balcony_direction?: string;
  min_price?: number;
  max_price?: number;
  status?: string;
}

export async function fetchBuilding3DData(buildingId: number): Promise<Building3DResponse> {
  return apiRequest<Building3DResponse>(`/buildings/${buildingId}/3d-data`);
}

export async function fetchProjectBuildings(projectId: number): Promise<any[]> {
  return apiRequest<any[]>(`/projects/${projectId}/buildings`);
}

export async function fetchUnitDetails(unitId: number): Promise<Unit3DItem> {
  return apiRequest<Unit3DItem>(`/units/${unitId}`);
}

export async function fetchUnit3DTour(unitId: number): Promise<any> {
  return apiRequest<any>(`/units/${unitId}/3d-tour`);
}

export async function fetchUnitFloorPlan(unitId: number): Promise<any> {
  return apiRequest<any>(`/units/${unitId}/floor-plan`);
}

export async function fetchUnitAvailability(unitId: number): Promise<{
  unit_id: number;
  status: string;
  is_available: boolean;
  price: number;
}> {
  return apiRequest<{
    unit_id: number;
    status: string;
    is_available: boolean;
    price: number;
  }>(`/units/${unitId}/availability`);
}

export async function reserveUnit(unitId: number, payload: Partial<BookingPayload>): Promise<BookingResponse> {
  return apiRequest<BookingResponse>(`/units/${unitId}/reserve`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function bookUnit(payload: BookingPayload): Promise<BookingResponse> {
  return apiRequest<BookingResponse>(`/units/${payload.unit_id}/book`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchMyBookings(): Promise<any[]> {
  return apiRequest<any[]>("/bookings/my");
}

export async function findMyFlats(params: SmartFlatFilterParams): Promise<any[]> {
  const queryParts: string[] = [];
  if (params.city) queryParts.push(`city=${encodeURIComponent(params.city)}`);
  if (params.project_id) queryParts.push(`project_id=${params.project_id}`);
  if (params.building_id) queryParts.push(`building_id=${params.building_id}`);
  if (params.bhk) queryParts.push(`bhk=${params.bhk}`);
  if (params.floor) queryParts.push(`floor=${params.floor}`);
  if (params.floor_preference) queryParts.push(`floor_preference=${params.floor_preference}`);
  if (params.direction) queryParts.push(`direction=${encodeURIComponent(params.direction)}`);
  if (params.balcony_direction) queryParts.push(`balcony_direction=${encodeURIComponent(params.balcony_direction)}`);
  if (params.min_price) queryParts.push(`min_price=${params.min_price}`);
  if (params.max_price) queryParts.push(`max_price=${params.max_price}`);
  if (params.status) queryParts.push(`status=${params.status}`);

  const qs = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
  return apiRequest<any[]>(`/units/find${qs}`);
}

export async function generateBuildingUnits(buildingId: number, payload: {
  floors?: number;
  units_per_floor?: number;
  base_price?: number;
}): Promise<any> {
  return apiRequest<any>(`/buildings/${buildingId}/generate-units`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function update3DUnitStatus(unitId: number, statusVal: string, notes?: string): Promise<any> {
  return apiRequest<any>(`/units/${unitId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status: statusVal, notes }),
  });
}
