export interface Organization {
  id: string;
  user_id: string;
  name: string;
  industry: string | null;
  country: string | null;
  reporting_year: number | null;
  reduction_target_pct: number | null;
  base_year: number | null;
  base_year_emissions_tco2e: number | null;
  revenue_gbp_m: number | null;
  onboarding_complete: boolean;
  created_date: string;
}

export interface OrganizationCreatePayload {
  name: string;
  industry?: string;
  country?: string;
  reporting_year?: number;
  reduction_target_pct?: number;
  base_year?: number;
  revenue_gbp_m?: number;
  onboarding_complete?: boolean;
}
