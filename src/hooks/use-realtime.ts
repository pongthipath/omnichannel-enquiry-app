import { InfiniteData, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Message, MessagePage } from '../services/message.service';
import { connectRealtime, disconnectRealtime, RealtimeEvent, RealtimePayload } from '../services/realtime';
import { qk } from './queries/keys';
import { mergeMessage } from './queries/use-messages';

/**
 * Keeps every screen live (design v13 "realtime everywhere"): each server event refreshes the
 * queries it affects. New messages are merged straight into the open thread (no refetch).
 */
export function useRealtime(enabled: boolean) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!enabled) return;
    const socket = connectRealtime();
    const invalidate = (...keys: readonly (readonly unknown[])[]) =>
      keys.forEach((queryKey) => void qc.invalidateQueries({ queryKey }));

    const onChat = (p: RealtimePayload) => {
      invalidate(['enquiries', 'list'], ['dashboard'], qk.customers);
      if (p.data) qc.setQueryData(qk.enquiry(p.id), p.data);
      else invalidate(qk.enquiry(p.id));
      invalidate(qk.messages(p.id)); // status / assignment changes add event rows
    };
    const onMessage = (p: RealtimePayload<Message>) => {
      if (!p.data) return;
      qc.setQueryData<InfiniteData<MessagePage, string | undefined>>(qk.messages(p.data.chatId), (d) =>
        mergeMessage(d, p.data!),
      );
    };

    socket.on(RealtimeEvent.CHAT_CREATED, onChat);
    socket.on(RealtimeEvent.CHAT_UPDATED, onChat);
    socket.on(RealtimeEvent.MESSAGE_CREATED, onMessage);
    socket.on(RealtimeEvent.TAG_CHANGED, () => invalidate(qk.tags, qk.enquiries));
    socket.on(RealtimeEvent.DEPARTMENT_CHANGED, () => invalidate(qk.departments));
    socket.on(RealtimeEvent.ROLE_CHANGED, () => invalidate(qk.roles, qk.me));
    socket.on(RealtimeEvent.STAFF_CHANGED, () => invalidate(['staff'], qk.me));
    socket.on(RealtimeEvent.CUSTOMER_UPDATED, (p: RealtimePayload) => invalidate(qk.customers, qk.customer(p.id)));
    // after a reconnect we may have missed events → refetch what is on screen
    socket.io.on('reconnect', () => void qc.invalidateQueries());

    return () => disconnectRealtime();
  }, [enabled, qc]);
}
