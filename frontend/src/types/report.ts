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
}
