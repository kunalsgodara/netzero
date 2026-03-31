import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationService } from '@/services/organizationService';
import type { OrganizationCreatePayload } from '@/types/organization';

export const ORGANIZATION_KEY = ['organization'] as const;

export function useOrganization() {
  return useQuery({
    queryKey: ORGANIZATION_KEY,
    queryFn: () => organizationService.listOrganizations('-created_date', 1),
    select: (data) => data[0] ?? null,
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: OrganizationCreatePayload) => organizationService.createOrganization(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ORGANIZATION_KEY }),
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<OrganizationCreatePayload> }) =>
      organizationService.updateOrganization(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ORGANIZATION_KEY }),
  });
}
