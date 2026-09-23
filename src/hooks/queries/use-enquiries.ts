import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ChatStatus,
  CreateEnquiryInput,
  Enquiry,
  enquiryService,
  ListEnquiriesParams,
  UpdateEnquiryInput,
} from '../../services/enquiry.service';
import { useOffline } from '../use-offline';
import { qk } from './keys';

/** Enquiries the signed-in user may see — the API applies the scope. Keyset pages of 30. */
export function useEnquiries(params: ListEnquiriesParams = {}) {
  return useInfiniteQuery({
    queryKey: qk.enquiryList(params),
    queryFn: ({ pageParam }) => enquiryService.list({ ...params, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    select: (data) => data.pages.flatMap((p) => p.items),
  });
}

export function useEnquiry(id: string | undefined) {
  return useQuery({
    queryKey: qk.enquiry(id ?? ''),
    queryFn: () => enquiryService.get(id!),
    enabled: Boolean(id),
  });
}

/** After any change: put the fresh enquiry in its detail cache and refresh the lists. */
function useApplyEnquiry() {
  const qc = useQueryClient();
  return (enquiry: Enquiry) => {
    qc.setQueryData(qk.enquiry(enquiry.id), enquiry);
    void qc.invalidateQueries({ queryKey: ['enquiries', 'list'] });
    void qc.invalidateQueries({ queryKey: ['dashboard'] });
    void qc.invalidateQueries({ queryKey: qk.messages(enquiry.id) }); // status changes add event rows
  };
}

export function useEnquiryActions(id: string) {
  const apply = useApplyEnquiry();
  const qc = useQueryClient();
  return {
    assign: useMutation({ mutationFn: (staffId: string) => enquiryService.assign(id, staffId), onSuccess: apply }),
    changeStatus: useMutation({
      mutationFn: ({ status, version }: { status: ChatStatus; version?: number }) =>
        enquiryService.changeStatus(id, status, version),
      onSuccess: apply,
    }),
    escalate: useMutation({
      mutationFn: ({ departmentId, reason }: { departmentId: string; reason: string }) =>
        enquiryService.escalate(id, departmentId, reason),
      onSuccess: apply,
    }),
    update: useMutation({ mutationFn: (input: UpdateEnquiryInput) => enquiryService.update(id, input), onSuccess: apply }),
    setTags: useMutation({
      mutationFn: (tagIds: string[]) => enquiryService.setTags(id, tagIds),
      onSuccess: (e) => {
        apply(e);
        void qc.invalidateQueries({ queryKey: qk.tags }); // usage counts
      },
    }),
  };
}

/**
 * Offline, a new enquiry waits in the outbox under its clientRequestId (design §13–15). The screen
 * gets `queued` instead of an enquiry, so it can say "saved, will be sent" rather than pretend.
 */
/** Either the server created it, or it is waiting in the outbox. */
export type CreateOutcome = { enquiry: Enquiry; created: boolean } | { queued: true };

export function useCreateEnquiry() {
  const apply = useApplyEnquiry();
  const { online, enqueue } = useOffline();
  return useMutation({
    mutationFn: async (input: CreateEnquiryInput): Promise<CreateOutcome> => {
      if (!online) {
        const { clientRequestId, ...rest } = input;
        await enqueue('conversation.create', rest, clientRequestId);
        return { queued: true };
      }
      return enquiryService.create(input);
    },
    onSuccess: (result) => {
      if (!('queued' in result)) apply(result.enquiry);
    },
  });
}
