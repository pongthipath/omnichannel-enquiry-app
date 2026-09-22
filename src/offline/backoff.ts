/**
 * Retry delay for the offline sync engine (design §7): min(5s × 2^attempts, 15 min) + up to 20% jitter.
 * `random` is injectable so the function is deterministic in tests.
 */
export function nextRetryDelayMs(attempts: number, random: () => number = Math.random): number {
  const base = Math.min(5_000 * 2 ** Math.max(0, attempts), 15 * 60_000);
  return Math.round(base + base * 0.2 * random());
}
