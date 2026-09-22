import { TFunction } from 'i18next';
import { ApiError } from '../services/http-client';

/** Turns any thrown error into a translated message. API error codes map to `errors.<code>`. */
export function errorMessage(error: unknown, t: TFunction): string {
  if (error instanceof ApiError) {
    return t(`errors.${error.code}`, { defaultValue: t('errors.common.unknown') });
  }
  if (error instanceof TypeError) return t('errors.common.network'); // fetch failed
  return t('errors.common.unknown');
}
