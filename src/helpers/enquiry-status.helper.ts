import { BadgeTone } from '../components/common/badge';
import { Channel, ChatStatus, Enquiry, STATUS_FLOW } from '../services/enquiry.service';
import { OrderStatus } from '../services/customer.service';
import { TagColor } from '../services/tag.service';

/** Status → badge color. Label comes from i18n `enquiry.status.<STATUS>`. */
export const statusTone: Record<ChatStatus, BadgeTone> = {
  OPEN: 'cyan',
  ASSIGNED: 'primary',
  IN_PROGRESS: 'primary',
  WAITING_FOR_CUSTOMER: 'yellow',
  RESOLVED: 'green',
  CLOSED: 'gray',
};

export const tagTone: Record<TagColor, BadgeTone> = {
  yellow: 'yellow',
  blue: 'primary',
  red: 'red',
  green: 'green',
  cyan: 'cyan',
  gray: 'gray',
  purple: 'purple',
};

/** Short channel label on list rows (i18n `enquiry.channelShort.<CHANNEL>`). */
export const CHANNELS: Channel[] = ['MOBILE_APP', 'WEB_CHAT', 'LINE', 'FACEBOOK', 'PHONE'];

/** Position in the 6-step flow, for the stepper. */
export const statusStep = (status: ChatStatus) => STATUS_FLOW.indexOf(status);

/** Owner moves — same table as the API's enquiry-status.policy (OPEN → ASSIGNED happens by assigning). */
const OWNER_MOVES: Partial<Record<ChatStatus, ChatStatus[]>> = {
  ASSIGNED: ['IN_PROGRESS'],
  IN_PROGRESS: ['WAITING_FOR_CUSTOMER', 'RESOLVED'],
  WAITING_FOR_CUSTOMER: ['IN_PROGRESS', 'RESOLVED'],
  RESOLVED: ['IN_PROGRESS', 'CLOSED'],
};

/**
 * Next statuses a staff member may pick. Owner moves need an assignee and (owner or CHANGE_ANY);
 * RESOLVED/CLOSED → OPEN needs the reopen permission.
 */
export function nextStatuses(
  e: Pick<Enquiry, 'status' | 'assignedStaffId'>,
  opts: { canChange: boolean; canReopen: boolean },
): ChatStatus[] {
  const moves = e.assignedStaffId && opts.canChange ? [...(OWNER_MOVES[e.status] ?? [])] : [];
  if (opts.canReopen && (e.status === 'RESOLVED' || e.status === 'CLOSED')) moves.push('OPEN');
  return moves;
}

/** Minutes left until the SLA is due (negative = overdue); null when paused or finished. */
export function slaMinutesLeft(e: Pick<Enquiry, 'slaDueAt' | 'slaPausedAt' | 'status'>, now = Date.now()): number | null {
  if (e.slaPausedAt || e.status === 'RESOLVED' || e.status === 'CLOSED') return null;
  return Math.round((new Date(e.slaDueAt).getTime() - now) / 60_000);
}

/** Order status → badge colour: on the way is neutral, delivered green, cancelled red. */
export const orderTone: Record<OrderStatus, BadgeTone> = {
  PENDING: 'gray',
  CONFIRMED: 'primary',
  DELIVERING: 'cyan',
  DELIVERED: 'green',
  CANCELLED: 'red',
};
