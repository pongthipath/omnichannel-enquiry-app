import { Channel } from './enquiry.service';
import { http } from './http-client';

export interface CustomerProfile {
  id: string;
  code: string;
  companyName: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  salespersonStaffId: string | null;
  salespersonName: string | null;
  isPlaceholder: boolean;
  channels: { id: string; channel: Channel; displayName: string | null }[];
  internalNote: string | null;
  lastContactAt: string | null;
  version: number;
}

export interface CustomerListItem extends CustomerProfile {
  openEnquiries: number;
}

export interface UpdateCustomerInput {
  companyName?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  internalNote?: string;
  salespersonStaffId?: string | null;
  version?: number;
}

export const customerService = {
  list: (q?: string) =>
    http.get<{ items: CustomerListItem[]; total: number }>(
      `/customers?limit=100${q?.trim() ? `&q=${encodeURIComponent(q.trim())}` : ''}`,
    ),
  get: (id: string) => http.get<CustomerProfile>(`/customers/${id}`),
  me: () => http.get<CustomerProfile>('/customers/me'),
  update: (id: string, input: UpdateCustomerInput) => http.patch<CustomerProfile>(`/customers/${id}`, input),
};
