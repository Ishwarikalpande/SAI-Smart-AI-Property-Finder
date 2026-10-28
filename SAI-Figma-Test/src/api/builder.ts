import { apiRequest } from "./client";

export interface BuilderProfileData {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  company_name: string;
  developer_registration_no: string;
  rera_id: string;
  support_email: string;
  city: string;
  company_type: string;
  office_address: string;
  rating: number;
  verification_status: string;
}

export interface BuilderSettingsData {
  company: {
    company_name: string;
    rera_id: string;
    support_email: string;
  };
  notifications: {
    new_buyer_enquiry: boolean;
    unit_booking_alert: boolean;
    promotion_status: boolean;
  };
  privacy: {
    project_visibility: string;
    contact_sharing: boolean;
  };
}

export interface BuilderUnitItem {
  id: number;
  unit_number: string;
  bhk: number;
  type: string;
  floor: number;
  area_sqft: number;
  area: string;
  price: number;
  price_display: string;
  parking: string;
  status: "available" | "reserved" | "booked" | "sold";
}

export interface BuilderTowerItem {
  id: number;
  name: string;
  floors: number;
  total_units: number;
  units: BuilderUnitItem[];
}

export interface BuilderProjectItem {
  id: number;
  name: string;
  city: string;
  locality: string;
  location: string;
  address: string;
  construction_status: string;
  expected_completion_date: string;
  amenities: string[];
  description: string;
  status: string;
  img: string;
  towers: BuilderTowerItem[];
  total_units: number;
  available_units: number;
  reserved_units: number;
  booked_units: number;
  sold_units: number;
}

export interface BuilderEnquiryItem {
  id: number;
  property_id: number;
  project_name: string;
  unit: string;
  buyer_name: string;
  buyer_phone: string;
  message: string;
  status: string;
  budget: string;
  date: string;
}

export interface BuilderAnalyticsData {
  total_projects: number;
  total_units: number;
  available_units: number;
  booked_units: number;
  sold_units: number;
  reserved_units: number;
  total_revenue: string;
  buyer_enquiries: number;
  inventory_status_breakdown: {
    available: number;
    reserved: number;
    booked: number;
    sold: number;
  };
  revenue_trend: Array<{ month: string; sales: number }>;
}

// ── BUILDER API CALLS ─────────────────────────────────────────────────

export async function fetchBuilderProfile(): Promise<BuilderProfileData> {
  return apiRequest<BuilderProfileData>("/builder/profile");
}

export async function updateBuilderProfile(data: Partial<BuilderProfileData>): Promise<BuilderProfileData> {
  return apiRequest<BuilderProfileData>("/builder/profile", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function fetchBuilderSettings(): Promise<BuilderSettingsData> {
  return apiRequest<BuilderSettingsData>("/builder/settings");
}

export async function updateBuilderSettings(data: any): Promise<BuilderSettingsData> {
  return apiRequest<BuilderSettingsData>("/builder/settings", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function fetchBuilderProjects(): Promise<BuilderProjectItem[]> {
  return apiRequest<BuilderProjectItem[]>("/builder/projects");
}

export async function createBuilderProject(data: any): Promise<{ success: boolean; project: BuilderProjectItem }> {
  return apiRequest<{ success: boolean; project: BuilderProjectItem }>("/builder/projects", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function fetchBuilderProjectById(id: number): Promise<BuilderProjectItem> {
  return apiRequest<BuilderProjectItem>(`/builder/projects/${id}`);
}

export async function updateBuilderProject(id: number, data: any): Promise<{ success: boolean; project: BuilderProjectItem }> {
  return apiRequest<{ success: boolean; project: BuilderProjectItem }>(`/builder/projects/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteBuilderProject(id: number): Promise<{ success: boolean; message: string }> {
  return apiRequest<{ success: boolean; message: string }>(`/builder/projects/${id}`, {
    method: "DELETE",
  });
}

export interface AddTowerPayload {
  name: string;
  code?: string;
  floors_count?: number;
  units_per_floor?: number;
  total_units?: number;
  description?: string;
  status?: string;
}

export async function addProjectTower(projectId: number, data: AddTowerPayload): Promise<any> {
  return apiRequest(`/builder/projects/${projectId}/towers`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function fetchProjectTowerDetails(projectId: number, towerId: number): Promise<any> {
  return apiRequest(`/builder/projects/${projectId}/towers/${towerId}`);
}

export async function fetchBuilderUnits(params?: {
  project_id?: number;
  tower_id?: number;
  status?: string;
}): Promise<BuilderUnitItem[]> {
  const q = new URLSearchParams();
  if (params?.project_id) q.set("project_id", String(params.project_id));
  if (params?.tower_id) q.set("tower_id", String(params.tower_id));
  if (params?.status) q.set("status", params.status);
  const res = await apiRequest<any>(`/builder/units?${q.toString()}`);
  return Array.isArray(res) ? res : (res?.units || res?.data || []);
}

export async function addProjectUnit(projectId: number, data: any): Promise<any> {
  return apiRequest(`/builder/projects/${projectId}/units`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateUnitStatus(unitId: number, status: string): Promise<{ success: boolean; unit_id: number; status: string }> {
  return apiRequest<{ success: boolean; unit_id: number; status: string }>(`/builder/units/${unitId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function fetchBuilderEnquiries(): Promise<BuilderEnquiryItem[]> {
  const res = await apiRequest<any>("/builder/enquiries");
  return Array.isArray(res) ? res : (res?.enquiries || res?.data || []);
}

export async function updateBuilderEnquiryStatus(id: number, status: string): Promise<{ success: boolean; enquiry_id: number; status: string }> {
  return apiRequest<{ success: boolean; enquiry_id: number; status: string }>(`/builder/enquiries/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function fetchBuilderAnalytics(): Promise<BuilderAnalyticsData> {
  return apiRequest<BuilderAnalyticsData>("/builder/analytics");
}

export interface BuilderPromotionItem {
  id: number;
  project_id: number;
  project_name: string;
  project_image?: string;
  plan_type: string;
  cost: number;
  budget?: number;
  duration_days: number;
  start_date: string;
  end_date?: string;
  status: string;
  impressions: number;
  clicks: number;
  enquiries: number;
  leads: number;
}

export async function fetchBuilderPromotions(): Promise<BuilderPromotionItem[]> {
  const res = await apiRequest<any>("/builder/promotions");
  return Array.isArray(res) ? res : (res?.promotions || res?.data || []);
}

export async function createBuilderPromotion(data: {
  project_id?: number;
  plan_type: string;
  duration_days: number;
  budget?: number;
}): Promise<{ success: boolean; message: string; promotion_id: number }> {
  return apiRequest<{ success: boolean; message: string; promotion_id: number }>("/builder/promotions", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateBuilderPromotion(id: number, data: { status?: string; plan_type?: string }): Promise<any> {
  return apiRequest(`/builder/promotions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteBuilderPromotion(id: number): Promise<any> {
  return apiRequest(`/builder/promotions/${id}`, {
    method: "DELETE",
  });
}

export async function fetchBuilderRevenue(): Promise<any> {
  return apiRequest("/builder/revenue");
}
