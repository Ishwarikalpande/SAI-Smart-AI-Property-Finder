import { apiRequest } from "./client";
import { UIProperty } from "./properties";

export interface DashboardResponse {
  saved_count: number;
  upcoming_visits: number;
  comparison_count: number;
  unread_notifications: number;
  loan_eligibility: {
    amount: number;
    amount_display: string;
    monthly_income: number;
    tenure_years: number;
    interest_rate: number;
    monthly_emi: number;
    monthly_emi_display: string;
    down_payment: number;
    down_payment_display: string;
    total_interest: number;
    total_interest_display: string;
    basis_text: string;
  };
  upcoming_visits_data: Array<{
    id: number;
    property_id: number;
    name: string;
    loc: string;
    date: string;
    scheduled_at?: string;
    status: string;
    notes?: string;
    img: string;
    agent: string;
  }>;
  saved_properties_data: any[];
  market_insights: {
    city: string;
    inventory_count: number;
    inventory_label: string;
    avg_price_display: string;
    avg_sqft_display: string;
    price_trend: string;
    is_trend_up: boolean;
    best_time_to_buy: string;
  };
  recommendation: {
    text: string;
    property?: {
      id: number;
      title: string;
      locality: string;
      price_display: string;
    } | null;
  };
}

export interface LoanEligibilityParams {
  monthly_income: number;
  existing_emi?: number;
  tenure_years?: number;
  interest_rate?: number;
  property_price?: number;
}

export interface LoanEligibilityResult {
  eligible_loan: number;
  monthly_emi: number;
  down_payment: number;
  total_interest: number;
  total_repayment: number;
  tenure_years: number;
  interest_rate: number;
  monthly_income: number;
  disclaimer: string;
}

export interface EMICalculatorParams {
  loan_amount: number;
  interest_rate: number;
  tenure_years: number;
}

export interface EMICalculatorResult {
  monthly_emi: number;
  principal: number;
  total_interest: number;
  total_payment: number;
  tenure_months: number;
  interest_rate: number;
  disclaimer: string;
}

export async function fetchDashboard(city?: string): Promise<DashboardResponse> {
  const qs = city && city !== "All Cities" ? `?city=${encodeURIComponent(city)}` : "";
  return apiRequest<DashboardResponse>(`/dashboard${qs}`);
}

export async function calculateLoanEligibility(params: LoanEligibilityParams): Promise<LoanEligibilityResult> {
  return apiRequest<LoanEligibilityResult>("/loan/eligibility", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function calculateEMI(params: EMICalculatorParams): Promise<EMICalculatorResult> {
  return apiRequest<EMICalculatorResult>("/loan/emi", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function fetchUserComparisons(): Promise<{ total: number; properties: any[]; matrix: Record<string, string[]> }> {
  return apiRequest<{ total: number; properties: any[]; matrix: Record<string, string[]> }>("/compare");
}

export async function addToComparison(propertyId: number): Promise<{ message: string; comparison_count: number }> {
  return apiRequest<{ message: string; comparison_count: number }>(`/compare/${propertyId}`, {
    method: "POST",
  });
}

export async function removeFromComparison(propertyId: number): Promise<{ message: string; comparison_count: number }> {
  return apiRequest<{ message: string; comparison_count: number }>(`/compare/${propertyId}`, {
    method: "DELETE",
  });
}

export async function rescheduleSiteVisit(visitId: number, scheduledAt: string, notes?: string): Promise<any> {
  return apiRequest(`/visits/${visitId}/reschedule`, {
    method: "PUT",
    body: JSON.stringify({ scheduled_at: scheduledAt, notes }),
  });
}

export async function cancelSiteVisit(visitId: number): Promise<any> {
  return apiRequest(`/visits/${visitId}`, {
    method: "DELETE",
  });
}

export const cancelVisit = cancelSiteVisit;

export type DashboardSummary = DashboardResponse;
