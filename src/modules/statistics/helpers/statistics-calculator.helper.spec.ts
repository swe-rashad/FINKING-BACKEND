import { StatisticsCalculatorHelper } from './statistics-calculator.helper';
import { RevenuePeriodEnum } from '../types/statistics.type';
import { transactionTypeEnum } from '@/modules/transactions/types';

describe('StatisticsCalculatorHelper', () => {
  describe('getRevenuePeriod', () => {
    it('should return Weekly when days diff <= 31', () => {
      const start = new Date('2025-01-01');
      const end = new Date('2025-01-20');
      expect(StatisticsCalculatorHelper.getRevenuePeriod(start, end)).toBe(
        RevenuePeriodEnum.Weekly,
      );
    });

    it('should return Monthly when days diff is between 32 and 365', () => {
      const start = new Date('2025-01-01');
      const end = new Date('2025-04-01');
      expect(StatisticsCalculatorHelper.getRevenuePeriod(start, end)).toBe(
        RevenuePeriodEnum.Monthly,
      );
    });

    it('should return Yearly when days diff > 365', () => {
      const start = new Date('2023-01-01');
      const end = new Date('2025-01-01');
      expect(StatisticsCalculatorHelper.getRevenuePeriod(start, end)).toBe(
        RevenuePeriodEnum.Yearly,
      );
    });
  });

  describe('formatAmount', () => {
    it('should format amount to 2 decimal places with big.js precision', () => {
      expect(StatisticsCalculatorHelper.formatAmount('123.456')).toBe(123.46);
      expect(StatisticsCalculatorHelper.formatAmount(50.5)).toBe(50.5);
      expect(StatisticsCalculatorHelper.formatAmount(null)).toBe(0);
      expect(StatisticsCalculatorHelper.formatAmount(undefined)).toBe(0);
      expect(StatisticsCalculatorHelper.formatAmount('')).toBe(0);
    });
  });

  describe('parseCount', () => {
    it('should parse integer count correctly', () => {
      expect(StatisticsCalculatorHelper.parseCount('42')).toBe(42);
      expect(StatisticsCalculatorHelper.parseCount(10)).toBe(10);
      expect(StatisticsCalculatorHelper.parseCount(null)).toBe(0);
    });
  });

  describe('formatCategoryDistributionData', () => {
    it('should sum counts and format amounts correctly', () => {
      const raw = [
        { type: transactionTypeEnum.Payment, value: '100.50', transactionsCount: '5' },
        { type: transactionTypeEnum.TopUp, value: '20.25', transactionsCount: '2' },
      ];

      const result = StatisticsCalculatorHelper.formatCategoryDistributionData(raw as any);

      expect(result.totalTransactions).toBe(7);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].value).toBe(100.5);
      expect(result.data[0].transactionsCount).toBe(5);
    });
  });
});
