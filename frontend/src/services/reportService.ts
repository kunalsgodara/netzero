import { httpFetch } from './httpClient';
import type { Report, ReportCreatePayload, ReportGeneratePayload, ReportAggregation } from '@/types/report';

export const reportService = {
  listReports: (orderBy = '-created_date', limit = 100) =>
    httpFetch<Report[]>(`/api/v1/reports?order_by=${orderBy}&limit=${limit}`),

  createReport: (data: ReportCreatePayload) =>
    httpFetch<Report>('/api/v1/reports', { method: 'POST', body: JSON.stringify(data) }),

  generateReport: (data: ReportGeneratePayload) =>
    httpFetch<Report>('/api/v1/reports/generate', { method: 'POST', body: JSON.stringify(data) }),

  getReportData: (id: string) =>
    httpFetch<ReportAggregation>(`/api/v1/reports/${id}/data`),

  previewAggregation: (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.set('start_date', startDate);
    if (endDate) params.set('end_date', endDate);
    const qs = params.toString();
    return httpFetch<ReportAggregation>(`/api/v1/reports/preview${qs ? `?${qs}` : ''}`);
  },

  updateReport: (id: string, data: Partial<ReportCreatePayload>) =>
    httpFetch<Report>(`/api/v1/reports/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteReport: (id: string) =>
    httpFetch(`/api/v1/reports/${id}`, { method: 'DELETE' }),
};
