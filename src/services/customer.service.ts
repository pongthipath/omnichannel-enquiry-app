import { Channel } from './enquiry.service';
import { http } from './http-client';
import { Message } from './message.service';

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

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'DELIVERING' | 'DELIVERED' | 'CANCELLED';

/** An order from the ERP, read-only — what staff quote when asked "where is my order?" (design §12). */
export interface CustomerOrder {
  id: string;
  orderNo: string;
  orderedAt: string;
  status: OrderStatus;
  totalAmount: string;
  currency: string;
  itemsSummary: string | null;
  deliveredAt: string | null;
}

/** A message seen from the customer's side: which enquiry it came from matters (design A9). */
export interface CustomerMessage extends Message {
  chatReference: string;
  chatSubject: string;
}

export const customerService = {
  list: (q?: string) =>
    http.get<{ items: CustomerListItem[]; total: number }>(
      `/customers?limit=100${q?.trim() ? `&q=${encodeURIComponent(q.trim())}` : ''}`,
    ),
  get: (id: string) => http.get<CustomerProfile>(`/customers/${id}`),
  me: () => http.get<CustomerProfile>('/customers/me'),
  update: (id: string, input: UpdateCustomerInput) => http.patch<CustomerProfile>(`/customers/${id}`, input),
  orders: (id: string) => http.get<CustomerOrder[]>(`/customers/${id}/orders`),
  messages: (id: string, q?: string, before?: string) =>
    http.get<{ items: CustomerMessage[]; nextCursor: string | null }>(
      `/customers/${id}/messages?limit=30${q?.trim() ? `&q=${encodeURIComponent(q.trim())}` : ''}${before ? `&before=${before}` : ''}`,
    ),
  /** Fold an unverified customer into the real one (design §8.5). */
  merge: (placeholderId: string, targetCustomerId: string) =>
    http.post<CustomerProfile>(`/customers/${placeholderId}/merge`, { targetCustomerId }),
};
