import { useQuery } from '@tanstack/react-query';
import { enquiryService, ListEnquiriesParams } from '../../services/enquiry.service';

export const enquiryKeys = {
  list: (params: ListEnquiriesParams) => ['enquiries', 'list', params] as const,
};

/** Enquiries the signed-in user may see — the API applies the scope (own / department / all). */
export function useEnquiries(params: ListEnquiriesParams = {}) {
  return useQuery({ queryKey: enquiryKeys.list(params), queryFn: () => enquiryService.list(params) });
}
