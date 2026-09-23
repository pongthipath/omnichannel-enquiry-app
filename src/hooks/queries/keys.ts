import { ListEnquiriesParams } from '../../services/enquiry.service';

/** Every TanStack Query key in one place, so realtime events know what to refresh. */
export const qk = {
  me: ['auth', 'me'] as const,
  enquiries: ['enquiries'] as const,
  enquiryList: (p: ListEnquiriesParams) => ['enquiries', 'list', p] as const,
  enquiry: (id: string) => ['enquiries', 'detail', id] as const,
  messages: (chatId: string) => ['messages', chatId] as const,
  tags: ['tags'] as const,
  dashboard: (days?: number) => ['dashboard', days ?? 'all'] as const,
  customers: ['customers'] as const,
  customerList: (q: string) => ['customers', 'list', q] as const,
  customer: (id: string) => ['customers', 'detail', id] as const,
  products: (q: string) => ['products', q] as const,
  productsSettings: ['products', 'settings'] as const,
  product: (id: string) => ['products', 'detail', id] as const,
  departments: ['departments'] as const,
  departmentsSettings: ['departments', 'settings'] as const,
  roles: ['roles'] as const,
  staff: (departmentId?: string) => ['staff', departmentId ?? 'all'] as const,
  staffSettings: ['staff', 'settings'] as const,
  slaPolicies: ['sla', 'policies'] as const,
  customerOrders: (id: string) => ['customers', 'orders', id] as const,
  customerMessages: (id: string, q: string) => ['customers', 'messages', id, q] as const,
};
