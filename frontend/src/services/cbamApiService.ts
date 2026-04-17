
import { httpFetch } from '@/services/httpClient';



export interface UKCBAMProduct {
  id: string;
  commodity_code: string;
  description: string;
  sector: string;
  product_type: string;
  default_intensity: string;
  valid_from: string;
  valid_to: string | null;
  includes_indirect: boolean;
  notes: string | null;
}

export interface UKETSPrice {
  quarter: string;
  price_gbp: string;
  source: string | null;
  currency: string;
}

export interface CBAMImport {
  id: string;
  org_id: string;
  supplier_id: string | null;
  product_id: string;
  import_date: string;
  import_value_gbp: string;
  quantity_tonnes: string;
  country_of_origin: string;
  import_type: string;
  data_source: string;
  emissions_intensity_actual: string | null;
  emissions_intensity_default: string;
  verifier_name: string | null;
  verification_date: string | null;
  carbon_price_deduction_gbp: string;
  deduction_evidence_note: string | null;
  uk_ets_rate_used: string | null;
  embedded_emissions_tco2e: string | null;
  cbam_liability_gbp: string | null;
  cbam_liability_default_gbp: string | null;
  potential_saving_gbp: string | null;
  is_threshold_exempt: boolean;
  exemption_reason: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditEntry {
  id: string;
  org_id: string | null;
  user_id: string | null;
  entity_type: string;
  entity_id: string | null;
  action: string;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export interface ThresholdStatus {
  total_gbp: string;
  threshold_gbp: string;
  percentage: number;
  status: 'below' | 'warning' | 'exceeded';
  imports_in_window: number;
}

export interface ImportCreatePayload {
  product_id: string;
  supplier_id?: string | null;
  import_date: string;
  import_value_gbp: number;
  quantity_tonnes: number;
  country_of_origin: string;
  import_type: string;
  data_source: string;
  emissions_intensity_actual?: number | null;
  verifier_name?: string | null;
  verification_date?: string | null;
  carbon_price_deduction_gbp: number;
  deduction_evidence_note?: string | null;
}

export interface ImportsListResponse {
  items: CBAMImport[];
  total: number;
  page: number;
  page_size: number;
}



export const cbamApi = {
  
  getProducts: () =>
    httpFetch<UKCBAMProduct[]>('/api/products'),

  getProduct: (code: string) =>
    httpFetch<UKCBAMProduct>(`/api/products/${code}`),

  
  getCurrentETSPrice: () =>
    httpFetch<UKETSPrice>('/api/ets-price/current'),

  
  listImports: (params?: { year?: number; sector?: string; page?: number; page_size?: number }) => {
    const query = new URLSearchParams();
    if (params?.year) query.set('year', String(params.year));
    if (params?.sector) query.set('sector', params.sector);
    if (params?.page) query.set('page', String(params.page));
    if (params?.page_size) query.set('page_size', String(params.page_size));
    const qs = query.toString();
    return httpFetch<ImportsListResponse>(`/api/imports${qs ? `?${qs}` : ''}`);
  },

  getImport: (id: string) =>
    httpFetch<CBAMImport>(`/api/imports/${id}`),

  createImport: (data: ImportCreatePayload) =>
    httpFetch<CBAMImport>('/api/imports', { method: 'POST', body: JSON.stringify(data) }),

  updateImport: (id: string, data: Partial<ImportCreatePayload>) =>
    httpFetch<CBAMImport>(`/api/imports/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteImport: (id: string) =>
    httpFetch(`/api/imports/${id}`, { method: 'DELETE' }),

  getImportAudit: (id: string) =>
    httpFetch<AuditEntry[]>(`/api/imports/${id}/audit`),

  
  getThresholdStatus: () =>
    httpFetch<ThresholdStatus>('/api/threshold/status'),

  
  bulkImportCSV: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return httpFetch('/api/imports/bulk-csv', {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type with boundary
    });
  },

  downloadCSVTemplate: () => {
    return httpFetch('/api/imports/csv-template');
  },

  exportExcel: (params?: { year?: number; sector?: string }) => {
    const query = new URLSearchParams();
    if (params?.year) query.set('year', String(params.year));
    if (params?.sector) query.set('sector', params.sector);
    const qs = query.toString();
    return httpFetch(`/api/imports/export-excel${qs ? `?${qs}` : ''}`);
  },
};
