import { http } from './http-client';
import { TagSummary } from './tag.service';

export type ChatStatus = 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'WAITING_FOR_CUSTOMER' | 'RESOLVED' | 'CLOSED';
export type Priority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type Channel = 'MOBILE_APP' | 'WEB_CHAT' | 'LINE' | 'FACEBOOK' | 'PHONE';
export type EnquiryType =
  | 'PRODUCT_INFORMATION'
  | 'PRICING'
  | 'COMPLAINT'
  | 'ORDER_DELIVERY'
  | 'INVOICE_PAYMENT'
  | 'SAMPLE_REQUEST'
  | 'GENERAL';
export type ScopeFilter = 'visible' | 'mine' | 'department' | 'all';

export const STATUS_FLOW: ChatStatus[] = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER', 'RESOLVED', 'CLOSED'];
export const PRIORITIES: Priority[] = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];
export const ENQUIRY_TYPES: EnquiryType[] = [
  'PRODUCT_INFORMATION',
  'PRICING',
  'COMPLAINT',
  'ORDER_DELIVERY',
  'INVOICE_PAYMENT',
  'SAMPLE_REQUEST',
  'GENERAL',
];

/** Mirrors the API's EnquiryDto. */
export interface Enquiry {
  id: string;
  reference: string;
  status: ChatStatus;
  enquiryType: EnquiryType;
  enquirySubType: string | null;
  subject: string;
  description: string;
  priority: Priority;
  originChannel: Channel;
  customerId: string;
  customer: { id: string; companyName: string; contactName: string | null } | null;
  productId: string | null;
  departmentId: string;
  departmentName: string | null;
  assignedStaffId: string | null;
  assignedStaffName: string | null;
  tags: TagSummary[];
  slaMinutes: number;
  slaDueAt: string;
  slaPausedAt: string | null;
  isSlaBreached: boolean;
  reopenCount: number;
  escalatedAt: string | null;
  lastMessageAt: string;
  lastMessagePreview: string | null;
  unreadByStaffCount: number;
  visibility: 'MINE' | 'DEPARTMENT' | 'ALL' | 'OWN_CUSTOMER';
  version: number;
  createdAt: string;
}

export interface EnquiryPage {
  items: Enquiry[];
  nextCursor: string | null;
}

export interface ListEnquiriesParams {
  scope?: ScopeFilter;
  status?: ChatStatus[];
  q?: string;
  customerId?: string;
  productId?: string;
  tagId?: string;
  cursor?: string;
  limit?: number;
}

export interface CreateEnquiryInput {
  clientRequestId: string;
  enquiryType: EnquiryType;
  subject: string;
  description: string;
  priority: Priority;
  productId?: string;
  channel?: Channel;
  /** staff creating on behalf of a customer (phone call) */
  customerId?: string;
}

export interface UpdateEnquiryInput {
  subject?: string;
  enquiryType?: EnquiryType;
  enquirySubType?: string;
  priority?: Priority;
  productId?: string | null;
}

const query = (p: ListEnquiriesParams) => {
  const params = new URLSearchParams({ limit: String(p.limit ?? 30) });
  if (p.scope && p.scope !== 'visible') params.set('scope', p.scope);
  if (p.status?.length) params.set('status', p.status.join(','));
  for (const key of ['q', 'customerId', 'productId', 'tagId', 'cursor'] as const) {
    const value = p[key]?.trim();
    if (value) params.set(key, value);
  }
  return params.toString();
};

/** One function per endpoint of the enquiry (conversations) module. */
export const enquiryService = {
  list: (p: ListEnquiriesParams = {}) => http.get<EnquiryPage>(`/conversations?${query(p)}`),
  get: (id: string) => http.get<Enquiry>(`/conversations/${id}`),
  create: (input: CreateEnquiryInput) =>
    http.post<{ enquiry: Enquiry; created: boolean }>('/conversations', input),
  update: (id: string, input: UpdateEnquiryInput) => http.patch<Enquiry>(`/conversations/${id}`, input),
  assign: (id: string, staffId: string) => http.put<Enquiry>(`/conversations/${id}/assign`, { staffId }),
  changeStatus: (id: string, status: ChatStatus, version?: number) =>
    http.put<Enquiry>(`/conversations/${id}/status`, { status, version }),
  escalate: (id: string, departmentId: string, reason: string) =>
    http.put<Enquiry>(`/conversations/${id}/escalate`, { departmentId, reason }),
  setTags: (id: string, tagIds: string[]) => http.put<Enquiry>(`/conversations/${id}/tags`, { tagIds }),
};
