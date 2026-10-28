import { apiRequest } from "./client";

export interface EnquiryItem {
  id: number;
  property_id: number;
  buyer_id: number;
  owner_id?: number | null;
  agent_id?: number | null;
  builder_id?: number | null;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface EnquiryPayload {
  property_id: number;
  message: string;
}

export async function submitEnquiry(
  propertyIdOrPayload: number | EnquiryPayload,
  message?: string
): Promise<EnquiryItem> {
  const payload =
    typeof propertyIdOrPayload === "object"
      ? propertyIdOrPayload
      : { property_id: propertyIdOrPayload, message: message || "" };

  return apiRequest<EnquiryItem>("/enquiries/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export const sendEnquiry = submitEnquiry;

export async function fetchMyEnquiries(): Promise<EnquiryItem[]> {
  return apiRequest<EnquiryItem[]>("/enquiries/");
}

export const fetchEnquiries = fetchMyEnquiries;

export async function updateEnquiryStatus(enquiryId: number, status: string): Promise<EnquiryItem> {
  return apiRequest<EnquiryItem>(`/enquiries/${enquiryId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function replyToEnquiry(
  enquiryId: string | number,
  replyText: string
): Promise<{ success: boolean; enquiry: any }> {
  return apiRequest<{ success: boolean; enquiry: any }>(`/enquiries/${enquiryId}/reply`, {
    method: "PATCH",
    body: JSON.stringify({ reply_text: replyText }),
  });
}

