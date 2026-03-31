export type CBAMCategory = 'cement' | 'iron_steel' | 'aluminum' | 'fertilizers' | 'electricity' | 'hydrogen';
export type DeclarationStatus = 'pending' | 'declared' | 'verified';
export type Quarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';

export interface CBAMImport {
  id: string;
  user_id: string;
  product_name: string;
  hscn_code: string;
  category: CBAMCategory;
  origin_country: string;
  quantity_tonnes: number;
  emission_factor: number | null;
  embedded_emissions: number | null;
  carbon_price_eur: number | null;
  cbam_charge_eur: number | null;
  import_date: string | null;
  quarter: Quarter | null;
  declaration_status: DeclarationStatus;
  supplier_name: string | null;
  notes: string | null;
  created_date: string;
}

export interface CBAMImportCreatePayload {
  product_name: string;
  hscn_code: string;
  category: CBAMCategory;
  origin_country: string;
  quantity_tonnes: number;
  emission_factor?: number;
  embedded_emissions?: number;
  carbon_price_eur?: number;
  cbam_charge_eur?: number;
  import_date?: string;
  quarter?: Quarter;
  declaration_status?: DeclarationStatus;
  supplier_name?: string;
  notes?: string;
}

export interface ETSPriceResponse {
  price: number;
  currency: string;
  source: string;
  status: string;
}
