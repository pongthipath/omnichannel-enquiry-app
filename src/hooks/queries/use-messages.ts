import { InfiniteData, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Message, MessagePage, messageService } from '../../services/message.service';
import { newId } from '../../utils/id';
import { qk } from './keys';

/** Thread of one enquiry, oldest → newest for display. Older pages load when scrolling up. */
export function useMessages(chatId: string | undefined) {
  return useInfiniteQuery({
    queryKey: qk.messages(chatId ?? ''),
    queryFn: ({ pageParam }) => messageService.list(chatId!, pageParam),
    enabled: Boolean(chatId),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    select: (data) => data.pages.flatMap((p) => p.items).slice().reverse(),
  });
}

/** Adds a message to the cached thread once (realtime and the send response can both deliver it). */
export function mergeMessage(
  data: InfiniteData<MessagePage, string | undefined> | undefined,
  message: Message,
): InfiniteData<MessagePage, string | undefined> | undefined {
  if (!data) return data;
  const exists = data.pages.some((p) =>
    p.items.some(
      (m) => m.id === message.id || (message.clientMessageId && m.clientMessageId === message.clientMessageId),
    ),
  );
  if (exists) {
    return {
      ...data,
      pages: data.pages.map((p) => ({
        ...p,
        items: p.items.map((m) =>
          message.clientMessageId && m.clientMessageId === message.clientMessageId ? message : m,
        ),
      })),
    };
  }
  const [first, ...rest] = data.pages;
  return { ...data, pages: [{ ...first, items: [message, ...first.items] }, ...rest] };
}

/**
 * Optimistic send: the bubble shows at once (pending), the clientMessageId makes retries safe,
 * and the server copy replaces it when the response or the realtime event arrives.
 */
export function useSendMessage(chatId: string, senderType: 'STAFF' | 'CUSTOMER' = 'STAFF') {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { body: string; isInternal?: boolean; clientMessageId: string }) =>
      messageService.send(chatId, input),
    onMutate: (input) => {
      const pending: Message = {
        id: `pending-${input.clientMessageId}`,
        chatId,
        clientMessageId: input.clientMessageId,
        channel: 'MOBILE_APP',
        senderType,
        senderId: null,
        senderName: null,
        messageType: 'TEXT',
        body: input.body,
        eventData: null,
        isInternal: Boolean(input.isInternal),
        deliveredAt: null,
        readAt: null,
        createdAt: new Date().toISOString(),
      };
      qc.setQueryData<InfiniteData<MessagePage, string | undefined>>(qk.messages(chatId), (d) => mergeMessage(d, pending));
    },
    onSuccess: ({ message }) => {
      qc.setQueryData<InfiniteData<MessagePage, string | undefined>>(qk.messages(chatId), (d) => mergeMessage(d, message));
      void qc.invalidateQueries({ queryKey: qk.enquiry(chatId) }); // auto status change, last message
      void qc.invalidateQueries({ queryKey: ['enquiries', 'list'] });
    },
    onError: () => void qc.invalidateQueries({ queryKey: qk.messages(chatId) }),
  });
}

export const newClientMessageId = newId;
