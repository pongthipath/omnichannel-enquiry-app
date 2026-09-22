import { BadgeTone } from '../components/common/badge';
import { ChatStatus } from '../services/enquiry.service';

/** Status → badge color. Label comes from i18n `enquiry.status.<STATUS>`. */
export const statusTone: Record<ChatStatus, BadgeTone> = {
  OPEN: 'cyan',
  ASSIGNED: 'primary',
  IN_PROGRESS: 'primary',
  WAITING_FOR_CUSTOMER: 'yellow',
  RESOLVED: 'green',
  CLOSED: 'gray',
};
