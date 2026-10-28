import { apiRequest } from "./client";
import { PropertyItem } from "./properties";

export interface AIChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AIChatAction {
  type: string;
  label: string;
  payload?: any;
}

export interface AIMapPin {
  property_id: number;
  latitude: number;
  longitude: number;
  title: string;
  price: number;
  price_display?: string;
  locality?: string;
  city?: string;
}

export interface AIChatResponse {
  success: boolean;
  conversation_id: string;
  intent: string;
  language: string;
  message: string;
  properties: PropertyItem[];
  map_data?: AIMapPin[];
  actions: AIChatAction[];
  document_actions?: Array<{ label: string; document_id: number; view_url: string; document_name: string }>;
}

export interface AIComparisonMatrix {
  summary: string;
  comparison_table: Array<{
    feature: string;
    [key: string]: any;
  }>;
  pros_cons: Record<string, { pros: string[]; cons: string[] }>;
  recommendation_reason: string;
  best_overall_property_id?: number;
}

export interface AICompareResponse {
  success: boolean;
  comparison: AIComparisonMatrix;
  properties: PropertyItem[];
  language: string;
}

export interface AIRecommendResponse {
  success: boolean;
  explanation: string;
  recommendations: PropertyItem[];
  language: string;
}

export interface InvestmentPredictionResponse {
  success: boolean;
  property_id: number;
  property_title: string;
  current_price: number;
  area_sqft: number;
  metrics: {
    monthly_rent_estimate: number;
    annual_rental_income: number;
    gross_rental_yield_pct: number;
    price_per_sqft: number;
    projected_value_1yr: number;
    projected_value_3yr: number;
    projected_value_5yr: number;
    projected_value_10yr: number;
    holding_period_years: number;
    projected_future_value: number;
    projected_total_return_pct: number;
    investment_score_out_of_10: number;
  };
  assumptions: string[];
  disclaimer: string;
  language: string;
}

export interface SupportedLanguage {
  code: string;
  name: string;
  native_name: string;
}

export interface SupportedLanguagesResponse {
  count: number;
  languages: SupportedLanguage[];
}

export async function chatWithAI(
  message: string,
  conversationId?: string,
  language: string = "auto"
): Promise<AIChatResponse> {
  return apiRequest<AIChatResponse>("/ai/chat", {
    method: "POST",
    body: JSON.stringify({
      message,
      conversation_id: conversationId,
      language,
    }),
  });
}

export async function comparePropertiesAI(
  propertyIds: number[],
  language: string = "en"
): Promise<AICompareResponse> {
  return apiRequest<AICompareResponse>("/ai/compare", {
    method: "POST",
    body: JSON.stringify({
      property_ids: propertyIds,
      language,
    }),
  });
}

export async function recommendPropertiesAI(
  criteria: {
    city?: string;
    bhk?: number;
    max_price?: number;
    min_price?: number;
    property_type?: string;
    listing_type?: string;
    locality?: string;
    amenities?: string[];
    user_notes?: string;
  },
  language: string = "en"
): Promise<AIRecommendResponse> {
  return apiRequest<AIRecommendResponse>("/ai/recommend", {
    method: "POST",
    body: JSON.stringify({
      criteria,
      language,
    }),
  });
}

export async function predictInvestmentAI(
  propertyId: number,
  holdingYears: number = 5,
  expectedAnnualAppreciationPct?: number,
  language: string = "en"
): Promise<InvestmentPredictionResponse> {
  return apiRequest<InvestmentPredictionResponse>("/ai/investment-predict", {
    method: "POST",
    body: JSON.stringify({
      property_id: propertyId,
      holding_years: holdingYears,
      expected_annual_appreciation_pct: expectedAnnualAppreciationPct,
      language,
    }),
  });
}

export async function getSupportedLanguages(): Promise<SupportedLanguagesResponse> {
  return apiRequest<SupportedLanguagesResponse>("/ai/languages");
}

export async function transcribeVoice(audioBlob: Blob, language: string = "auto"): Promise<{
  text: string;
  detected_language: string;
  confidence: number;
}> {
  const formData = new FormData();
  formData.append("file", audioBlob, "voice_input.wav");
  formData.append("language", language);

  const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:8000/api";
  const res = await fetch(`${API_BASE_URL}/ai/voice-search`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Voice processing failed" }));
    throw new Error(err.detail || "Voice search error");
  }

  return res.json();
}
