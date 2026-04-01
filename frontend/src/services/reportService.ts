import { getToken } from './httpClient';
import { httpFetch } from './httpClient';
import type { Report, ReportCreatePayload, ReportGeneratePayload, ReportAggregation, PaginatedReportsResponse } from '@/types/report';

export const reportService = {
  listReports: (page = 1, pageSize = 4, orderBy = '-created_date') =>
    httpFetch<PaginatedReportsResponse>(`/api/v1/reports?page=${page}&page_size=${pageSize}&order_by=${orderBy}`),

  createReport: (data: ReportCreatePayload) =>
    httpFetch<Report>('/api/v1/reports', { method: 'POST', body: JSON.stringify(data) }),

  generateReport: (data: ReportGeneratePayload) =>
    httpFetch<Report>('/api/v1/reports/generate', { method: 'POST', body: JSON.stringify(data) }),

  getReportData: (id: string) =>
    httpFetch<ReportAggregation>(`/api/v1/reports/${id}/data`),

  /**
   * Fetch a server-generated PDF for the given report and trigger a browser download.
   * Replaces the former client-side jsPDF generation.
   */
  downloadReportPdf: async (report: Report): Promise<void> => {
    const token = getToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`/api/v1/reports/${report.id}/pdf`, { headers });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'PDF generation failed' }));
      throw new Error(err.detail || `HTTP ${response.status}`);
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.title.replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

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
