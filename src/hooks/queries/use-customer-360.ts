import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { customerService } from '../../services/customer.service';
import { qk } from './keys';

/** The signed-in customer's own profile (design C5). */
export function useMyProfile() {
  return useQuery({ queryKey: ['customers', 'me'], queryFn: customerService.me, staleTime: 5 * 60_000 });
}

/** Orders panel (design §12) — only fetched when the role may see it. */
export function useCustomerOrders(customerId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: qk.customerOrders(customerId ?? ''),
    queryFn: () => customerService.orders(customerId!),
    enabled: Boolean(customerId) && enabled,
    staleTime: 60_000,
  });
}

/** The customer's whole conversation across enquiries, newest first (design A9/A10). */
export function useCustomerMessages(customerId: string | null | undefined, q: string, enabled = true) {
  return useInfiniteQuery({
    queryKey: qk.customerMessages(customerId ?? '', q),
    queryFn: ({ pageParam }) => customerService.messages(customerId!, q, pageParam),
    enabled: Boolean(customerId) && enabled,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    select: (data) => data.pages.flatMap((p) => p.items),
  });
}

/** Merging an unverified customer moves their enquiries, so almost every list needs a refresh. */
export function useMergeCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ placeholderId, targetCustomerId }: { placeholderId: string; targetCustomerId: string }) =>
      customerService.merge(placeholderId, targetCustomerId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.customers });
      void qc.invalidateQueries({ queryKey: qk.enquiries });
    },
  });
}
