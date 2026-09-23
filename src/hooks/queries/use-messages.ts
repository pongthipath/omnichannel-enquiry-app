import { InfiniteData, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Attachment } from '../../services/attachment.service';
import { useOffline } from '../use-offline';
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

/** Either the server took it, or it is waiting in the outbox. */
export type SendOutcome = { message: Message; created: boolean } | { queued: true };

export interface SendInput {
  body: string;
  isInternal?: boolean;
  clientMessageId: string;
  attachmentIds?: string[];
  /** already-uploaded attachments, so the pending bubble can show them right away */
  attachments?: Attachment[];
}

/**
 * Optimistic send: the bubble shows at once (pending), the clientMessageId makes retries safe,
 * and the server copy replaces it when the response or the realtime event arrives.
 */
export function useSendMessage(chatId: string, senderType: 'STAFF' | 'CUSTOMER' = 'STAFF') {
  const qc = useQueryClient();
  const { online, enqueue } = useOffline();
  return useMutation({
    mutationFn: async (input: SendInput): Promise<SendOutcome> => {
      // offline: plain text waits in the outbox — notes and files need the server, so they still fail
      if (!online && !input.isInternal && !input.attachmentIds?.length) {
        await enqueue('message.create', { conversationId: chatId, body: input.body }, input.clientMessageId);
        return { queued: true };
      }
      return messageService.send(chatId, input);
    },
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
        attachments: input.attachments ?? [],
      };
      qc.setQueryData<InfiniteData<MessagePage, string | undefined>>(qk.messages(chatId), (d) => mergeMessage(d, pending));
    },
    onSuccess: (result) => {
      if ('queued' in result) return; // the optimistic bubble stays until the outbox drains
      const { message } = result;
      qc.setQueryData<InfiniteData<MessagePage, string | undefined>>(qk.messages(chatId), (d) => mergeMessage(d, message));
      void qc.invalidateQueries({ queryKey: qk.enquiry(chatId) }); // auto status change, last message
      void qc.invalidateQueries({ queryKey: ['enquiries', 'list'] });
    },
    onError: () => void qc.invalidateQueries({ queryKey: qk.messages(chatId) }),
  });
}

export const newClientMessageId = newId;
