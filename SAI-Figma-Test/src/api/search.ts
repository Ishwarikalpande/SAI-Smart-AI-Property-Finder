import { apiRequest } from "./client";
import { PropertyItem, PropertyListResponse } from "./properties";

export interface NaturalLanguageSearchResponse {
  query: string;
  detected_language: string;
  parsed_intent: {
    bhk?: number | null;
    max_price?: number | null;
    min_price?: number | null;
    property_type?: string | null;
    city?: string | null;
    locality?: string | null;
    nearby_facility?: string | null;
    preferences: string[];
  };
  structured_filters: Record<string, any>;
  items: PropertyItem[];
  total: number;
}

export async function searchProperties(params: Record<string, any>): Promise<PropertyListResponse> {
  const query = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== null && val !== "") {
      query.set(key, String(val));
    }
  }
  const qs = query.toString();
  return apiRequest<PropertyListResponse>(`/search/${qs ? `?${qs}` : ""}`);
}

export async function searchNaturalLanguage(
  textQuery: string,
  city?: string,
  language: string = "en"
): Promise<NaturalLanguageSearchResponse> {
  return apiRequest<NaturalLanguageSearchResponse>("/search/natural-language", {
    method: "POST",
    body: JSON.stringify({ query: textQuery, city, language }),
  });
}

export const naturalLanguageSearch = searchNaturalLanguage;
