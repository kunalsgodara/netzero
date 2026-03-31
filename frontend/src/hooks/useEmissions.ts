import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { emissionService } from '@/services/emissionService';
import type { EmissionActivityCreatePayload } from '@/types/emission';

export const EMISSIONS_KEY = ['emissions'] as const;
export const EMISSION_FACTORS_KEY = ['emissionFactors'] as const;

export function useEmissions() {
  return useQuery({
    queryKey: EMISSIONS_KEY,
    queryFn: () => emissionService.listActivities(),
  });
}

export function useEmissionFactors() {
  return useQuery({
    queryKey: EMISSION_FACTORS_KEY,
    queryFn: () => emissionService.listFactors(),
  });
}

export function useCreateEmission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: EmissionActivityCreatePayload) => emissionService.createActivity(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: EMISSIONS_KEY }),
  });
}

export function useUpdateEmission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<EmissionActivityCreatePayload> }) =>
      emissionService.updateActivity(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: EMISSIONS_KEY }),
  });
}

export function useDeleteEmission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => emissionService.deleteActivity(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: EMISSIONS_KEY }),
  });
}
