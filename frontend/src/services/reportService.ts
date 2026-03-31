import { httpFetch } from './httpClient';
import type { Report, ReportCreatePayload } from '@/types/report';

export const reportService = {
  listReports: (orderBy = '-created_date', limit = 100) =>
    httpFetch<Report[]>(`/api/v1/reports?order_by=${orderBy}&limit=${limit}`),

  createReport: (data: ReportCreatePayload) =>
    httpFetch<Report>('/api/v1/reports', { method: 'POST', body: JSON.stringify(data) }),

  updateReport: (id: string, data: Partial<ReportCreatePayload>) =>
    httpFetch<Report>(`/api/v1/reports/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteReport: (id: string) =>
    httpFetch(`/api/v1/reports/${id}`, { method: 'DELETE' }),
};
