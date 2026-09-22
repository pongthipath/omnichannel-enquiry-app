import { TFunction } from 'i18next';

const locale = (lang: string) => (lang === 'th' ? 'th-TH' : 'en-GB');
const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** List rows: "16:45" today, "เมื่อวาน" yesterday, "19 ก.ย." otherwise. */
export function formatListTime(iso: string, lang: string, t: TFunction, now = new Date()): string {
  const d = new Date(iso);
  if (sameDay(d, now)) return d.toLocaleTimeString(locale(lang), { hour: '2-digit', minute: '2-digit' });
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(d, yesterday)) return t('common.yesterday');
  return d.toLocaleDateString(locale(lang), { day: 'numeric', month: 'short' });
}

export function formatTime(iso: string, lang: string): string {
  return new Date(iso).toLocaleTimeString(locale(lang), { hour: '2-digit', minute: '2-digit' });
}

export function formatDateTime(iso: string, lang: string): string {
  return new Date(iso).toLocaleString(locale(lang), { dateStyle: 'medium', timeStyle: 'short' });
}

/** Day separators in a thread: "วันนี้", "เมื่อวาน", "21 ก.ย. 2569". */
export function formatDay(iso: string, lang: string, t: TFunction, now = new Date()): string {
  const d = new Date(iso);
  if (sameDay(d, now)) return t('common.today');
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(d, yesterday)) return t('common.yesterday');
  return d.toLocaleDateString(locale(lang), { day: 'numeric', month: 'short', year: 'numeric' });
}

/** 135 → "2 ชม. 15 นาที" (absolute value; the caller says overdue or left). */
export function formatDuration(minutes: number, t: TFunction): string {
  const m = Math.abs(minutes);
  const h = Math.floor(m / 60);
  const rest = m % 60;
  if (h >= 24) return t('common.duration.days', { d: Math.floor(h / 24), h: h % 24 });
  if (h > 0) return t('common.duration.hours', { h, m: rest });
  return t('common.duration.minutes', { m: rest });
}
