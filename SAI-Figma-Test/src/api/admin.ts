import { apiRequest } from "./client";
import { UserResponse } from "./auth";
import { PropertyItem } from "./properties";

export interface AdminSystemStats {
  total_users: number;
  total_buyers: number;
  total_sellers: number;
  total_agents: number;
  total_builders: number;
  total_properties: number;
  active_listings: number;
  total_enquiries: number;
  total_site_visits: number;
  open_reports: number;
}

export async function fetchAdminStats(): Promise<AdminSystemStats> {
  return apiRequest<AdminSystemStats>("/admin/stats");
}

export async function fetchAdminUsers(role?: string): Promise<UserResponse[]> {
  const q = role ? `?role=${encodeURIComponent(role)}` : "";
  return apiRequest<UserResponse[]>(`/admin/users${q}`);
}

export async function toggleUserStatus(userId: number, is_active: boolean): Promise<UserResponse> {
  return apiRequest<UserResponse>(`/admin/users/${userId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ is_active }),
  });
}

export async function togglePropertyVerification(propertyId: number, is_verified: boolean): Promise<PropertyItem> {
  return apiRequest<PropertyItem>(`/admin/properties/${propertyId}/verify`, {
    method: "PATCH",
    body: JSON.stringify({ is_verified }),
  });
}

export interface AuditLogEntry {
  id: number;
  user_id?: number;
  action: string;
  entity_type?: string;
  entity_id?: string;
  ip_address?: string;
  user_agent?: string;
  details?: any;
  created_at: string;
}

export async function fetchAuditLogs(limit: number = 50, offset: number = 0): Promise<AuditLogEntry[]> {
  return apiRequest<AuditLogEntry[]>(`/admin/audit-logs?limit=${limit}&offset=${offset}`);
}

