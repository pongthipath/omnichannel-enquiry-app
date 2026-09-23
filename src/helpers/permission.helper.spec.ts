import { Permission } from '../constants/permissions';
import { hasPermission, parseMask } from './permission.helper';

const maskOf = (...permissions: Permission[]) =>
  permissions.reduce((mask, p) => mask | (1n << BigInt(p)), 0n).toString();

describe('parseMask', () => {
  it('อ่านค่าที่เกิน 2^53 ได้ครบ — bit สูง ๆ จึงไม่หาย', () => {
    const mask = parseMask(maskOf(Permission.SETTINGS_SLA_EDIT, Permission.SIMULATOR_PAGE_USE));
    expect(hasPermission(mask, Permission.SETTINGS_SLA_EDIT)).toBe(true);
    expect(hasPermission(mask, Permission.SIMULATOR_PAGE_USE)).toBe(true);
    expect(hasPermission(mask, Permission.SETTINGS_ROLE_MANAGE)).toBe(false);
  });

  it('ค่าว่างหรือค่าเสียหาย = ไม่มีสิทธิ์อะไรเลย (ไม่ใช่ crash)', () => {
    expect(parseMask(null)).toBe(0n);
    expect(parseMask(undefined)).toBe(0n);
    expect(parseMask('')).toBe(0n);
    expect(parseMask('ไม่ใช่ตัวเลข')).toBe(0n);
  });
});

describe('hasPermission', () => {
  it('ตรวจทีละ bit ไม่ปนกับ bit ข้างเคียง', () => {
    const mask = parseMask(maskOf(Permission.CUSTOMER_PANEL_ORDERS_VIEW));
    expect(hasPermission(mask, Permission.CUSTOMER_PANEL_ORDERS_VIEW)).toBe(true);
    expect(hasPermission(mask, Permission.CUSTOMER_PANEL_NOTE_EDIT)).toBe(false);
    expect(hasPermission(0n, Permission.CUSTOMER_PANEL_ORDERS_VIEW)).toBe(false);
  });
});
