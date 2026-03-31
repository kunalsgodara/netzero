import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cbamService } from '@/services/cbamService';
import type { CBAMImportCreatePayload } from '@/types/cbam';

export const CBAM_IMPORTS_KEY = ['cbamImports'] as const;
export const ETS_PRICE_KEY = ['etsPrice'] as const;

export function useCBAMImports() {
  return useQuery({
    queryKey: CBAM_IMPORTS_KEY,
    queryFn: () => cbamService.listImports(),
  });
}

export function useEtsPrice() {
  return useQuery({
    queryKey: ETS_PRICE_KEY,
    queryFn: () => cbamService.getEtsPrice(),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useCreateCBAMImport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CBAMImportCreatePayload) => cbamService.createImport(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CBAM_IMPORTS_KEY }),
  });
}

export function useUpdateCBAMImport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CBAMImportCreatePayload> }) =>
      cbamService.updateImport(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CBAM_IMPORTS_KEY }),
  });
}

export function useDeleteCBAMImport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cbamService.deleteImport(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CBAM_IMPORTS_KEY }),
  });
}
