import { apiRequest } from "./client";

export interface AgentProfileData {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  agency_name: string;
  license_number: string;
  experience_years: number;
  rera_id: string;
  rating: number;
  review_count: number;
  city: string;
  areas_served: string[];
  languages: string[];
  bio: string;
  profile_image: string;
  verification_status: string;
}

export interface AgentSettingsData {
  account: {
    email: string;
    phone: string;
    language: string;
  };
  notifications: {
    lead_alerts: boolean;
    enquiry_alerts: boolean;
    promotion_alerts: boolean;
  };
  privacy: {
    profile_visibility: string;
    contact_sharing: boolean;
  };
}

export interface AgentListingItem {
  id: number;
  title: string;
  property_type: string;
  listing_type: string;
  bhk: number | null;
  price: number;
  price_display: string;
  area_sqft: number;
  locality: string;
  city: string;
  state: string;
  address: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  furnishing?: string;
  amenities: string[];
  description?: string;
  status: string;
  is_active: boolean;
  is_verified: boolean;
  verification_status: string;
  badge?: string;
  rating: number;
  views: number;
  enquiries: number;
  saved: number;
  img: string;
  images: string[];
  created_at?: string;
  updated_at?: string;
}

export interface AgentListingsResponse {
  items: AgentListingItem[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface AgentEnquiryItem {
  id: number;
  property_id: number;
  property_title: string;
  property_city: string;
  property_locality: string;
  buyer_id: number;
  buyer_name: string;
  buyer_phone: string;
  buyer_email: string;
  message: string;
  status: string;
  created_at: string;
  created_at_display: string;
}

export interface AgentSiteVisitItem {
  id: number;
  property_id: number;
  property_title: string;
  property_location: string;
  buyer_id: number;
  client_name: string;
  client_phone: string;
  scheduled_at: string;
  date_display: string;
  time_display: string;
  visit_type: string;
  status: string;
  notes: string;
}

export interface AgentClientItem {
  id: number;
  name: string;
  phone: string;
  email: string;
  client_since: string;
  interested_property: string;
  current_status: string;
  site_visit_status: string;
  budget: string;
  preferred_city: string;
  preferred_bhk: number;
}

export interface AgentClientDetail extends AgentClientItem {
  requirements: {
    city: string;
    locality: string;
    budget: string;
    bhk: string;
    property_type: string;
    listing_type: string;
    preferred_amenities: string[];
  };
  interaction_history: Array<{
    type: string;
    date: string;
    title: string;
    message: string;
    status: string;
  }>;
}

export interface AgentAnalyticsData {
  time_range: string;
  total_listings: number;
  active_listings: number;
  total_views: number;
  total_enquiries: number;
  total_saves: number;
  site_visits: number;
  conversions: number;
  conversion_rate: string;
  property_performance: Array<{
    id: number;
    title: string;
    locality: string;
    views: number;
    enquiries: number;
    saves: number;
    status: string;
  }>;
  lead_status_distribution: Record<string, number>;
  views_trend: Array<{ day: string; views: number; enquiries: number }>;
}

export interface AgentPromotionItem {
  id: number;
  property_id: number;
  property_title: string;
  plan_type: string;
  cost: number;
  duration_days: number;
  start_date: string;
  status: string;
  impressions: number;
  clicks: number;
  enquiries: number;
  leads: number;
}

// ── AGENT API CALLS ───────────────────────────────────────────────────

export async function fetchAgentProfile(): Promise<AgentProfileData> {
  return apiRequest<AgentProfileData>("/agent/profile");
}

export async function updateAgentProfile(data: Partial<AgentProfileData>): Promise<AgentProfileData> {
  return apiRequest<AgentProfileData>("/agent/profile", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function fetchAgentSettings(): Promise<AgentSettingsData> {
  return apiRequest<AgentSettingsData>("/agent/settings");
}

export async function updateAgentSettings(data: any): Promise<AgentSettingsData> {
  return apiRequest<AgentSettingsData>("/agent/settings", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function fetchAgentListings(params: {
  status?: string;
  property_type?: string;
  city?: string;
  locality?: string;
  search?: string;
  sort_by?: string;
  page?: number;
  limit?: number;
} = {}): Promise<AgentListingsResponse> {
  const q = new URLSearchParams();
  if (params.status) q.set("status", params.status);
  if (params.property_type) q.set("property_type", params.property_type);
  if (params.city) q.set("city", params.city);
  if (params.locality) q.set("locality", params.locality);
  if (params.search) q.set("search", params.search);
  if (params.sort_by) q.set("sort_by", params.sort_by);
  if (params.page) q.set("page", String(params.page));
  if (params.limit) q.set("limit", String(params.limit));

  return apiRequest<AgentListingsResponse>(`/agent/listings?${q.toString()}`);
}

export async function createAgentListing(data: any): Promise<{ success: boolean; property: AgentListingItem }> {
  return apiRequest<{ success: boolean; property: AgentListingItem }>("/agent/listings", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function fetchAgentListingById(id: number): Promise<AgentListingItem> {
  return apiRequest<AgentListingItem>(`/agent/listings/${id}`);
}

export async function updateAgentListing(id: number, data: any): Promise<{ success: boolean; property: AgentListingItem }> {
  return apiRequest<{ success: boolean; property: AgentListingItem }>(`/agent/listings/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteAgentListing(id: number): Promise<{ success: boolean; message: string }> {
  return apiRequest<{ success: boolean; message: string }>(`/agent/listings/${id}`, {
    method: "DELETE",
  });
}

export async function toggleAgentListingStatus(id: number, status: string): Promise<{ success: boolean; status: string; property: AgentListingItem }> {
  return apiRequest<{ success: boolean; status: string; property: AgentListingItem }>(`/agent/listings/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function fetchAgentEnquiries(params: { property_id?: number; status?: string } = {}): Promise<AgentEnquiryItem[]> {
  const q = new URLSearchParams();
  if (params.property_id) q.set("property_id", String(params.property_id));
  if (params.status) q.set("status", params.status);
  const res = await apiRequest<any>(`/agent/enquiries?${q.toString()}`);
  return Array.isArray(res) ? res : (res?.enquiries || res?.data || []);
}

export async function updateAgentEnquiryStatus(id: number, status: string): Promise<{ success: boolean; enquiry_id: number; status: string }> {
  return apiRequest<{ success: boolean; enquiry_id: number; status: string }>(`/agent/enquiries/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function fetchAgentSiteVisits(status?: string): Promise<AgentSiteVisitItem[]> {
  const q = status ? `?status=${encodeURIComponent(status)}` : "";
  const res = await apiRequest<any>(`/agent/site-visits${q}`);
  return Array.isArray(res) ? res : (res?.site_visits || res?.data || []);
}

export async function scheduleAgentSiteVisit(data: {
  property_id: number;
  buyer_id?: number;
  date: string;
  time: string;
  notes?: string;
}): Promise<{ success: boolean; message: string; visit_id: number }> {
  return apiRequest<{ success: boolean; message: string; visit_id: number }>("/agent/site-visits", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateAgentSiteVisit(id: number, data: {
  status?: string;
  date?: string;
  time?: string;
  notes?: string;
}): Promise<{ success: boolean; visit: { id: number; status: string } }> {
  return apiRequest<{ success: boolean; visit: { id: number; status: string } }>(`/agent/site-visits/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function cancelAgentSiteVisit(id: number): Promise<{ success: boolean; message: string }> {
  return apiRequest<{ success: boolean; message: string }>(`/agent/site-visits/${id}`, {
    method: "DELETE",
  });
}

export async function fetchAgentClients(): Promise<AgentClientItem[]> {
  const res = await apiRequest<any>("/agent/clients");
  return Array.isArray(res) ? res : (res?.clients || res?.data || []);
}

export async function updateAgentClientStatus(clientId: number, status: string): Promise<{ success: boolean; client_id: number; status: string }> {
  return apiRequest<{ success: boolean; client_id: number; status: string }>(`/agent/clients/${clientId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function fetchAgentClientDetails(id: number): Promise<AgentClientDetail> {
  return apiRequest<AgentClientDetail>(`/agent/clients/${id}`);
}

export async function fetchAgentAnalytics(time_range: string = "30d"): Promise<AgentAnalyticsData> {
  return apiRequest<AgentAnalyticsData>(`/agent/analytics?time_range=${encodeURIComponent(time_range)}`);
}

export async function fetchAgentPromotions(): Promise<AgentPromotionItem[]> {
  const res = await apiRequest<any>("/agent/promotions");
  return Array.isArray(res) ? res : (res?.promotions || res?.data || []);
}

export async function createAgentPromotion(data: {
  property_id: number;
  plan_type: string;
  duration_days: number;
}): Promise<{ success: boolean; message: string; promotion_id: number }> {
  return apiRequest<{ success: boolean; message: string; promotion_id: number }>("/agent/promotions", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
