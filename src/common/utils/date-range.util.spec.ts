import { BadRequestException } from '@nestjs/common';
import { resolveDateRange, validateDateRange } from './date-range.util';

describe('date-range.util', () => {
  describe('validateDateRange', () => {
    it('should pass without error when dates are valid and within max range', () => {
      expect(() =>
        validateDateRange('2026-01-01', '2026-06-01', { maxDays: 365 }),
      ).not.toThrow();
    });

    it('should throw BadRequestException if date is invalid', () => {
      expect(() => validateDateRange('invalid-date', '2026-06-01')).toThrow(
        new BadRequestException('Invalid date provided'),
      );
    });

    it('should throw BadRequestException if endDate is earlier than startDate', () => {
      expect(() =>
        validateDateRange('2026-06-01', '2026-01-01', {
          startField: 'startDate',
          endField: 'endDate',
        }),
      ).toThrow(
        new BadRequestException('endDate cannot be earlier than startDate'),
      );
    });

    it('should throw BadRequestException if date range exceeds maxDays', () => {
      expect(() =>
        validateDateRange('2024-01-01', '2025-01-10', { maxDays: 365 }),
      ).toThrow(
        new BadRequestException('Date range cannot exceed 1 year (365 days)'),
      );
    });

    it('should ignore when dates are undefined', () => {
      expect(() => validateDateRange(undefined, undefined)).not.toThrow();
    });
  });

  describe('resolveDateRange', () => {
    it('should resolve default 1-year window when no dates are provided', () => {
      const result = resolveDateRange();

      expect(result.startDate).toBeInstanceOf(Date);
      expect(result.endDate).toBeInstanceOf(Date);
      expect(result.dateRange).toBeDefined();
      expect(result.startDate.getTime()).toBeLessThan(result.endDate.getTime());
    });

    it('should resolve provided valid dates', () => {
      const start = new Date('2026-01-01');
      const end = new Date('2026-03-01');
      const result = resolveDateRange({ startDate: start, endDate: end });

      expect(result.startDate.toISOString()).toBe(start.toISOString());
      expect(result.endDate.toISOString()).toBe(end.toISOString());
    });

    it('should throw BadRequestException if startDate is after endDate', () => {
      expect(() =>
        resolveDateRange({
          startDate: new Date('2026-05-01'),
          endDate: new Date('2026-01-01'),
        }),
      ).toThrow(
        new BadRequestException('startDate cannot be greater than endDate'),
      );
    });
  });
});
