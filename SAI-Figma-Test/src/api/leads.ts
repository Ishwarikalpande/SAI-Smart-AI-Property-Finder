import { apiRequest } from "./client";

export interface LeadResponse {
  id: number;
  agent_id: number;
  buyer_id?: number | null;
  property_id?: number | null;
  status: "NEW" | "CONTACTED" | "INTERESTED" | "SITE_VISIT" | "NEGOTIATION" | "CLOSED";
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadCreate {
  buyer_id?: number | null;
  property_id?: number | null;
  status?: string;
  notes?: string;
}

export interface LeadUpdate {
  status?: string;
  notes?: string;
}

export async function fetchAgentLeads(): Promise<LeadResponse[]> {
  return apiRequest<LeadResponse[]>("/leads/");
}

export async function createAgentLead(payload: LeadCreate): Promise<LeadResponse> {
  return apiRequest<LeadResponse>("/leads/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAgentLead(id: number, payload: LeadUpdate): Promise<LeadResponse> {
  return apiRequest<LeadResponse>(`/leads/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
