import {
  calculateTokenRemainingMs,
  DEFAULT_TOKEN_TTL_MS,
} from './token.util';

describe('token.util', () => {
  describe('calculateTokenRemainingMs', () => {
    it('should return default ttl when exp is undefined', () => {
      const result = calculateTokenRemainingMs(undefined);
      expect(result).toBe(DEFAULT_TOKEN_TTL_MS);
    });

    it('should return remaining ms when exp is in the future', () => {
      const nowSec = Math.floor(Date.now() / 1000);
      const futureExp = nowSec + 60; // 60 seconds from now
      const result = calculateTokenRemainingMs(futureExp);

      expect(result).toBeGreaterThanOrEqual(59000);
      expect(result).toBeLessThanOrEqual(60000);
    });

    it('should return 0 when exp is in the past', () => {
      const nowSec = Math.floor(Date.now() / 1000);
      const pastExp = nowSec - 60; // 60 seconds ago
      const result = calculateTokenRemainingMs(pastExp);

      expect(result).toBe(0);
    });
  });
});
