import { httpFetch } from './httpClient';
import type { Organization, OrganizationCreatePayload } from '@/types/organization';

export const organizationService = {
  listOrganizations: (orderBy = '-created_date', limit = 10) =>
    httpFetch<Organization[]>(`/api/v1/organizations?order_by=${orderBy}&limit=${limit}`),

  createOrganization: (data: OrganizationCreatePayload) =>
    httpFetch<Organization>('/api/v1/organizations', { method: 'POST', body: JSON.stringify(data) }),

  updateOrganization: (id: string, data: Partial<OrganizationCreatePayload>) =>
    httpFetch<Organization>(`/api/v1/organizations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteOrganization: (id: string) =>
    httpFetch(`/api/v1/organizations/${id}`, { method: 'DELETE' }),
};
