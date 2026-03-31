import { httpFetch } from './httpClient';
import type { EmissionActivity, EmissionFactor, EmissionActivityCreatePayload } from '@/types/emission';

export const emissionService = {
  listActivities: (orderBy = '-created_date', limit = 500) =>
    httpFetch<EmissionActivity[]>(`/api/v1/emission-activities?order_by=${orderBy}&limit=${limit}`),

  createActivity: (data: EmissionActivityCreatePayload) =>
    httpFetch<EmissionActivity>('/api/v1/emission-activities', { method: 'POST', body: JSON.stringify(data) }),

  updateActivity: (id: string, data: Partial<EmissionActivityCreatePayload>) =>
    httpFetch<EmissionActivity>(`/api/v1/emission-activities/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteActivity: (id: string) =>
    httpFetch(`/api/v1/emission-activities/${id}`, { method: 'DELETE' }),

  listFactors: () =>
    httpFetch<EmissionFactor[]>('/api/v1/emission-factors'),
};
