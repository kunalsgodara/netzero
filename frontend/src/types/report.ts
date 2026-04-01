export type ReportType = 'secr' | 'cbam_declaration' | 'executive_summary';
export type ReportStatus = 'draft' | 'generated' | 'submitted' | 'approved';

export interface Report {
  id: string;
  user_id: string;
  title: string;
  type: ReportType;
  period: string;
  status: ReportStatus;
  total_emissions_tco2e: number | null;
  total_cbam_charge_eur: number | null;
  notes: string | null;
  start_date: string | null;
  end_date: string | null;
  created_date: string;
}

export interface ReportCreatePayload {
  title: string;
  type: ReportType;
  period: string;
  status?: ReportStatus;
  total_emissions_tco2e?: number;
  total_cbam_charge_eur?: number;
  notes?: string;
  start_date?: string;
  end_date?: string;
}

export interface ReportGeneratePayload {
  title: string;
  type: ReportType;
  period: string;
  start_date?: string;
  end_date?: string;
}

// --- Aggregation types ---

export interface ScopeBreakdown {
  scope: string;
  label: string;
  emissions_tco2e: number;
  description: string;
}

export interface CategoryBreakdown {
  category: string;
  scope: string;
  emissions_tco2e: number;
  share_pct: number;
}

export interface ActivityDetail {
  activity_name: string;
  scope: string;
  source: string | null;
  quantity: number;
  unit: string;
  co2e_tco2e: number;
  activity_date: string | null;
}

export interface CBAMCategoryBreakdown {
  category: string;
  total_qty_tonnes: number;
  embedded_emissions_tco2e: number;
  cbam_charge_eur: number;
}

export interface CBAMImportDetail {
  product_name: string;
  hscn_code: string;
  origin_country: string;
  supplier_name: string | null;
  quantity_tonnes: number;
  embedded_emissions: number;
  cbam_charge_eur: number;
  declaration_status: string;
}

export interface OrganizationInfo {
  name: string;
  industry: string | null;
  country: string | null;
  reporting_year: number | null;
  base_year: number | null;
  reduction_target_pct: number | null;
}

export interface ReportAggregation {
  organization: OrganizationInfo | null;
  total_emissions_tco2e: number;
  scope_breakdown: ScopeBreakdown[];
  category_breakdown: CategoryBreakdown[];
  activities: ActivityDetail[];
  activity_count: number;
  total_cbam_charge_eur: number;
  total_embedded_emissions_tco2e: number;
  cbam_category_breakdown: CBAMCategoryBreakdown[];
  cbam_imports: CBAMImportDetail[];
  cbam_import_count: number;
  pending_declarations: number;
}

export interface PaginatedReportsResponse {
  items: Report[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}
