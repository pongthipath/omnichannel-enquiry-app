import { Attachment } from './attachment.service';
import { Channel } from './enquiry.service';
import { http } from './http-client';

export type SenderType = 'CUSTOMER' | 'STAFF' | 'SYSTEM';
export type MessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'EVENT';

/** Mirrors the API's MessageDto. */
export interface Message {
  id: string;
  chatId: string;
  clientMessageId: string | null;
  channel: Channel;
  senderType: SenderType;
  senderId: string | null;
  senderName: string | null;
  messageType: MessageType;
  body: string | null;
  eventData: (Record<string, unknown> & { kind?: string }) | null;
  isInternal: boolean;
  deliveredAt: string | null;
  readAt: string | null;
  createdAt: string;
  attachments: Attachment[];
}

export interface MessagePage {
  items: Message[]; // newest first
  nextCursor: string | null;
}

export const messageService = {
  list: (chatId: string, before?: string) =>
    http.get<MessagePage>(`/conversations/${chatId}/messages?limit=50${before ? `&before=${before}` : ''}`),
  send: (
    chatId: string,
    input: { clientMessageId: string; body: string; isInternal?: boolean; attachmentIds?: string[] },
  ) => http.post<{ message: Message; created: boolean }>(`/conversations/${chatId}/messages`, input),
};
