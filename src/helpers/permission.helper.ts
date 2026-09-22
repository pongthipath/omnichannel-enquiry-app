import { Permission } from '../constants/permissions';

/** The API sends the bitmask as a string because JSON numbers lose precision past 2^53. */
export const parseMask = (mask: string | null | undefined): bigint => {
  if (!mask) return 0n;
  try {
    return BigInt(mask);
  } catch {
    return 0n;
  }
};

export const hasPermission = (mask: bigint, permission: Permission): boolean =>
  (mask & (1n << BigInt(permission))) !== 0n;
