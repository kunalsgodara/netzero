export interface EmissionActivity {
  id: string;
  user_id: string;
  activity_name: string;
  scope: 'scope_1' | 'scope_2' | 'scope_3';
  category: string | null;
  source: string | null;
  quantity: number;
  unit: string;
  emission_factor: number | null;
  co2e_kg: number | null;
  activity_date: string | null;
  reporting_period: string | null;
  created_date: string;
}

export interface EmissionFactor {
  id: string;
  scope: string;
  category: string;
  source: string;
  unit: string;
  factor: number;
  source_dataset: string;
  created_date: string;
}

export interface EmissionActivityCreatePayload {
  activity_name: string;
  scope: string;
  category?: string;
  source?: string;
  quantity: number;
  unit: string;
  emission_factor?: number;
  co2e_kg?: number;
  activity_date?: string;
  reporting_period?: string;
}
