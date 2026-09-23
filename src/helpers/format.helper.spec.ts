import { TFunction } from 'i18next';
import { formatBytes, formatDuration, formatListTime, formatMoney } from './format.helper';

/** The screens pass a real i18next t; here the key plus its values is enough to assert on. */
const t = ((key: string, vars?: Record<string, unknown>) =>
  vars ? `${key}(${Object.values(vars).join(',')})` : key) as unknown as TFunction;

describe('formatBytes', () => {
  it('ขึ้นหน่วยตามขนาด และใช้ทศนิยมเฉพาะตอนที่ยังอ่านง่าย', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(20 * 1024)).toBe('20 KB');
    expect(formatBytes(2.5 * 1024 * 1024)).toBe('2.5 MB');
  });
});

describe('formatMoney', () => {
  it('ใส่คั่นหลักพันและทศนิยม 2 ตำแหน่ง พร้อมสกุลเงินต่อท้าย', () => {
    expect(formatMoney('18400.00', 'THB', 'th')).toBe('18,400.00 THB');
    expect(formatMoney(950.5, 'THB', 'en')).toBe('950.50 THB');
  });

  it('ค่าที่ไม่ใช่ตัวเลขส่งกลับตามเดิม ไม่พังหน้าจอ', () => {
    expect(formatMoney('-', 'THB', 'th')).toBe('- THB');
  });
});

describe('formatDuration', () => {
  it('ใช้ค่าสัมบูรณ์ — ผู้เรียกเป็นคนบอกว่าเลยกำหนดหรือเหลือเวลา', () => {
    expect(formatDuration(-90, t)).toBe(formatDuration(90, t));
  });
});

describe('formatListTime', () => {
  const now = new Date('2026-09-23T10:00:00');

  it('วันนี้แสดงเวลา เมื่อวานแสดงคำว่าเมื่อวาน เก่ากว่านั้นแสดงวันที่', () => {
    expect(formatListTime('2026-09-23T08:15:00', 'en', t, now)).toMatch(/08:15/);
    expect(formatListTime('2026-09-22T22:00:00', 'en', t, now)).toBe('common.yesterday');
    expect(formatListTime('2026-09-01T09:00:00', 'en', t, now)).toMatch(/Sep/);
  });
});
