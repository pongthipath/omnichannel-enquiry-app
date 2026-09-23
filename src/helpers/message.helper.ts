import { TFunction } from 'i18next';
import { Message } from '../services/message.service';

type EventData = Record<string, unknown> & { kind?: string };
const status = (t: TFunction, s: unknown) => (typeof s === 'string' ? t(`enquiry.status.${s}`) : '');

/** Timeline sentence for an EVENT row ("ธนา มอบหมายให้ สุดา (CS)"). */
export function eventText(m: Message, t: TFunction): string {
  const d = (m.eventData ?? {}) as EventData;
  const actor = m.senderName ?? t('events.system');
  switch (d.kind) {
    case 'ASSIGNED':
    case 'REASSIGNED':
      return t('events.assigned', { actor, staff: d.staffName ?? '' });
    case 'STATUS_CHANGED':
      if (d.by === 'CUSTOMER') return t('events.customerClosed');
      if (d.by === 'OWNER_REPLY') return t('events.autoInProgress');
      if (d.by === 'CUSTOMER_MESSAGE') return t('events.customerResumed', { to: status(t, d.to) });
      return t('events.statusChanged', { actor, to: status(t, d.to) });
    case 'ESCALATED':
      return t('events.escalated', { actor, department: d.toDepartmentName ?? '', reason: d.reason ?? '' });
    case 'REOPENED':
      return t('events.reopened', { count: Number(d.reopenCount ?? 1) });
    case 'TAGS_CHANGED': {
      const list = (key: 'added' | 'removed') => (Array.isArray(d[key]) ? (d[key] as string[]) : []);
      const parts = [
        list('added').length ? t('events.tagsAdded', { tags: list('added').join(', ') }) : null,
        list('removed').length ? t('events.tagsRemoved', { tags: list('removed').join(', ') }) : null,
      ].filter(Boolean);
      return t('events.tagsChanged', { actor, changes: parts.join(' · ') });
    }
    case 'UPDATED': {
      // { changes: { priority: { from, to }, … } } — name the fields, and translate the enum values
      const changes = (d.changes ?? {}) as Record<string, { from?: unknown; to?: unknown }>;
      const value = (field: string, v: unknown) => {
        if (v === null || v === undefined || v === '') return t('events.empty');
        if (field === 'priority') return t(`enquiry.priority.${String(v)}`);
        if (field === 'enquiryType') return t(`enquiry.type.${String(v)}`);
        if (field === 'productId') return t('events.aProduct');
        return String(v);
      };
      const fields = Object.entries(changes).map(([field, c]) =>
        t('events.fieldChange', { field: t(`events.field.${field}`, { defaultValue: field }), to: value(field, c?.to) }),
      );
      return fields.length ? t('events.updatedFields', { actor, fields: fields.join(' · ') }) : t('events.updated', { actor });
    }
    case 'CREATED':
      return t('events.created');
    default:
      return t('events.generic');
  }
}

/** Tone of the event pill. */
export function eventTone(m: Message): 'blue' | 'green' | 'yellow' | 'gray' {
  const d = (m.eventData ?? {}) as EventData;
  if (d.kind === 'REOPENED' || d.to === 'WAITING_FOR_CUSTOMER' || d.kind === 'TAGS_CHANGED') return 'yellow';
  if (d.to === 'RESOLVED' || d.to === 'CLOSED') return 'green';
  if (d.kind === 'ASSIGNED' || d.kind === 'REASSIGNED' || d.kind === 'ESCALATED') return 'blue';
  return 'gray';
}

/** Same calendar day? — thread day separators. */
export const isSameDay = (a: string, b: string) => new Date(a).toDateString() === new Date(b).toDateString();
