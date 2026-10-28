import { apiRequest, getStoredToken } from "./client";

export interface VerificationReview {
  id: number;
  reviewer_id?: number;
  action: string;
  reason?: string;
  details?: Record<string, any>;
  created_at: string;
}

export interface VerificationDocumentItem {
  id: number;
  user_id: number;
  property_id?: number;
  project_id?: number;
  account_type: string;
  document_type: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  version: number;
  status: "PENDING" | "UNDER_REVIEW" | "VERIFIED" | "REJECTED" | "RESUBMISSION_REQUIRED";
  extracted_data?: Record<string, any>;
  checks_data?: Record<string, any>;
  rejection_reason?: string;
  resubmission_reason?: string;
  reviewed_by?: number;
  reviewed_at?: string;
  uploaded_at: string;
  updated_at: string;
  user_name?: string;
  user_email?: string;
  property_title?: string;
  project_name?: string;
  reviews?: VerificationReview[];
}

export interface VerificationStats {
  total_documents: number;
  pending_review: number;
  under_review: number;
  verified: number;
  rejected: number;
  resubmission_required: number;
}

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:8000/api";

export async function uploadVerificationDocument(formData: FormData): Promise<{ success: boolean; document: VerificationDocumentItem }> {
  const token = getStoredToken();
  const headers = new Headers();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE_URL}/verification/upload`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.detail || errorData?.error?.message || "Failed to upload document");
  }

  return res.json();
}

export async function fetchMyVerificationDocuments(params: {
  property_id?: number;
  project_id?: number;
} = {}): Promise<VerificationDocumentItem[]> {
  const q = new URLSearchParams();
  if (params.property_id) q.set("property_id", String(params.property_id));
  if (params.project_id) q.set("project_id", String(params.project_id));
  const res = await apiRequest<any>(`/verification/my-documents?${q.toString()}`);
  return Array.isArray(res) ? res : (res?.documents || res?.data || []);
}

export async function fetchVerificationDocumentDetails(id: number): Promise<VerificationDocumentItem> {
  return apiRequest<VerificationDocumentItem>(`/verification/documents/${id}`);
}

export function getSecureDocumentViewUrl(id: number): string {
  const token = getStoredToken();
  return `${API_BASE_URL}/verification/documents/${id}/view${token ? `?token=${encodeURIComponent(token)}` : ""}`;
}

// ── ADMIN VERIFICATION API CALLS ──────────────────────────────────────

export async function fetchAdminVerificationStats(): Promise<VerificationStats> {
  return apiRequest<VerificationStats>("/admin/verification/stats");
}

export async function fetchAdminVerificationDocuments(params: {
  account_type?: string;
  document_type?: string;
  status?: string;
  search?: string;
} = {}): Promise<VerificationDocumentItem[]> {
  const q = new URLSearchParams();
  if (params.account_type) q.set("account_type", params.account_type);
  if (params.document_type) q.set("document_type", params.document_type);
  if (params.status) q.set("status", params.status);
  if (params.search) q.set("search", params.search);
  return apiRequest<VerificationDocumentItem[]>(`/admin/verification/?${q.toString()}`);
}

export async function approveVerificationDocument(id: number, notes?: string): Promise<any> {
  return apiRequest(`/admin/verification/${id}/approve`, {
    method: "POST",
    body: JSON.stringify({ notes }),
  });
}

export async function rejectVerificationDocument(id: number, reason: string): Promise<any> {
  return apiRequest(`/admin/verification/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function requestVerificationResubmission(id: number, reason: string): Promise<any> {
  return apiRequest(`/admin/verification/${id}/resubmission`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

// ── PROPERTY SPECIFIC VERIFICATION & TRUST SCORE ──────────────────────

export interface PropertyDocumentItem {
  id: number;
  property_id: number;
  document_type: string;
  document_name: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  file_size_formatted: string;
  status: "VERIFIED" | "UNDER_REVIEW" | "REJECTED" | "PENDING";
  version: number;
  rejection_reason?: string;
  uploaded_at?: string;
  verified_at?: string;
  verified_by?: string;
  rera_number?: string;
  view_url: string;
}

export interface PropertyDocumentCategory {
  key: string;
  name: string;
  status: "VERIFIED" | "UNDER_REVIEW" | "REJECTED" | "NOT_UPLOADED";
  weight: number;
  document_count: number;
  documents: PropertyDocumentItem[];
}

export interface PropertyVerificationSummary {
  property_id: number;
  property_title: string;
  city: string;
  locality: string;
  trust_score: number;
  trust_grade: string;
  summary: {
    total_uploaded: number;
    verified_count: number;
    under_review_count: number;
    rejected_count: number;
    status_text: string;
    is_fully_verified: boolean;
  };
  categories: PropertyDocumentCategory[];
  documents: PropertyDocumentItem[];
}

export async function fetchPropertyDocuments(propertyId: number): Promise<PropertyVerificationSummary> {
  return apiRequest<PropertyVerificationSummary>(`/properties/${propertyId}/documents`);
}

export async function fetchPropertyDocumentDetails(documentId: number): Promise<PropertyDocumentItem> {
  return apiRequest<PropertyDocumentItem>(`/property-documents/${documentId}`);
}

export async function uploadPropertyDocument(propertyId: number, formData: FormData): Promise<{ success: boolean; message: string; document: PropertyDocumentItem }> {
  const token = getStoredToken();
  const headers = new Headers();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(`${API_BASE_URL}/properties/${propertyId}/documents`, {
    method: "POST",
    headers,
    body: formData,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.detail || errorData?.error?.message || "Failed to upload document");
  }
  return res.json();
}

export function getPropertyDocumentViewUrl(id: number): string {
  const token = getStoredToken();
  return `${API_BASE_URL}/property-documents/${id}/view${token ? `?token=${encodeURIComponent(token)}` : ""}`;
}
