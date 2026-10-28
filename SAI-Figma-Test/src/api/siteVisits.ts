import { apiRequest } from "./client";

export interface SiteVisitItem {
  id: number;
  property_id: number;
  buyer_id: number;
  owner_id?: number | null;
  agent_id?: number | null;
  builder_id?: number | null;
  scheduled_at: string;
  status: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SiteVisitPayload {
  property_id: number;
  scheduled_at: string;
  notes?: string | null;
}

export async function requestSiteVisit(
  propertyIdOrPayload: number | SiteVisitPayload,
  scheduledAt?: string,
  notes?: string
): Promise<SiteVisitItem> {
  const payload =
    typeof propertyIdOrPayload === "object"
      ? propertyIdOrPayload
      : {
          property_id: propertyIdOrPayload,
          scheduled_at: scheduledAt || new Date().toISOString(),
          notes,
        };

  return apiRequest<SiteVisitItem>("/site-visits/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export const scheduleSiteVisit = requestSiteVisit;

export async function fetchMySiteVisits(): Promise<SiteVisitItem[]> {
  return apiRequest<SiteVisitItem[]>("/site-visits/");
}

export const fetchSiteVisits = fetchMySiteVisits;

export async function updateSiteVisitStatus(siteVisitId: number, status: string, notes?: string): Promise<SiteVisitItem> {
  return apiRequest<SiteVisitItem>(`/site-visits/${siteVisitId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, notes }),
  });
}

