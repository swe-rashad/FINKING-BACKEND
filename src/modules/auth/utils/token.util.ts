export const DEFAULT_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function calculateTokenRemainingMs(
  exp?: number,
  defaultTtlMs = DEFAULT_TOKEN_TTL_MS,
): number {
  if (!exp) {
    return defaultTtlMs;
  }

  const nowSec = Math.floor(Date.now() / 1000);
  return Math.max((exp - nowSec) * 1000, 0);
}
