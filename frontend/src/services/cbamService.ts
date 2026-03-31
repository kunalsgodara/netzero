import { httpFetch } from './httpClient';
import type { CBAMImport, CBAMImportCreatePayload, ETSPriceResponse } from '@/types/cbam';

export const cbamService = {
  listImports: (orderBy = '-created_date', limit = 200) =>
    httpFetch<CBAMImport[]>(`/api/v1/cbam-imports?order_by=${orderBy}&limit=${limit}`),

  createImport: (data: CBAMImportCreatePayload) =>
    httpFetch<CBAMImport>('/api/v1/cbam-imports', { method: 'POST', body: JSON.stringify(data) }),

  updateImport: (id: string, data: Partial<CBAMImportCreatePayload>) =>
    httpFetch<CBAMImport>(`/api/v1/cbam-imports/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteImport: (id: string) =>
    httpFetch(`/api/v1/cbam-imports/${id}`, { method: 'DELETE' }),

  getEtsPrice: () =>
    httpFetch<ETSPriceResponse>('/api/v1/cbam-imports/eu-ets-price'),
};
