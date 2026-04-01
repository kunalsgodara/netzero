import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportService } from '@/services/reportService';
import type { ReportCreatePayload, ReportGeneratePayload } from '@/types/report';

export const REPORTS_KEY = ['reports'] as const;

export function useReports(page = 1, pageSize = 4) {
  return useQuery({
    queryKey: [...REPORTS_KEY, page, pageSize],
    queryFn: () => reportService.listReports(page, pageSize),
  });
}

export function useCreateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ReportCreatePayload) => reportService.createReport(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: REPORTS_KEY }),
  });
}

export function useGenerateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ReportGeneratePayload) => reportService.generateReport(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: REPORTS_KEY }),
  });
}

export function useUpdateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ReportCreatePayload> }) =>
      reportService.updateReport(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: REPORTS_KEY }),
  });
}

export function useDeleteReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reportService.deleteReport(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: REPORTS_KEY }),
  });
}

export function useReportData(reportId: string | null) {
  return useQuery({
    queryKey: ['report-data', reportId],
    queryFn: () => reportService.getReportData(reportId!),
    enabled: !!reportId,
  });
}

export function useAggregationPreview(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['aggregation-preview', startDate, endDate],
    queryFn: () => reportService.previewAggregation(startDate, endDate),
    enabled: !!(startDate && endDate),
  });
}
