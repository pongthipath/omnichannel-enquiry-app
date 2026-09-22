import { http } from './http-client';

export type ChatStatus = 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'WAITING_FOR_CUSTOMER' | 'RESOLVED' | 'CLOSED';
export type Priority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

/** Mirrors the API's EnquiryDto (only the fields the app uses). */
export interface Enquiry {
  id: string;
  reference: string;
  status: ChatStatus;
  enquiryType: string;
  subject: string;
  priority: Priority;
  originChannel: string;
  customer: { id: string; companyName: string; contactName: string | null } | null;
  assignedStaffId: string | null;
  isSlaBreached: boolean;
  reopenCount: number;
  lastMessageAt: string;
  lastMessagePreview: string | null;
  unreadByStaffCount: number;
  version: number;
}

export interface EnquiryPage {
  items: Enquiry[];
  nextCursor: string | null;
}

export interface ListEnquiriesParams {
  status?: ChatStatus[];
  q?: string;
  cursor?: string;
  limit?: number;
}

/** One function per endpoint of the enquiry module. */
export const enquiryService = {
  list: ({ status, q, cursor, limit = 30 }: ListEnquiriesParams = {}) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (status?.length) params.set('status', status.join(','));
    if (q) params.set('q', q);
    if (cursor) params.set('cursor', cursor);
    return http.get<EnquiryPage>(`/conversations?${params}`);
  },
};
