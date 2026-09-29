import Big from 'big.js';
import {
  RevenuePeriodEnum,
  RevenuePeriodEnumType,
  RevenueStatisticsItem,
} from '../types/statistics.type';
import {
  CurrencyEnumType,
  TransactionTypeEnumType,
} from '@/modules/transactions/types';

export class StatisticsCalculatorHelper {

  static getRevenuePeriod(
    startDate: Date,
    endDate: Date,
  ): RevenuePeriodEnumType {
    const diffInMs = endDate.getTime() - startDate.getTime();
    const msInDay = 1000 * 60 * 60 * 24;
    const diffInDays = new Big(diffInMs).div(msInDay).toNumber();

    if (diffInDays <= 31) {
      return RevenuePeriodEnum.Weekly;
    }

    if (diffInDays <= 365) {
      return RevenuePeriodEnum.Monthly;
    }

    return RevenuePeriodEnum.Yearly;
  }

  static getDateExpression(
    period: RevenuePeriodEnumType,
    column = 'transaction.dateOfOperation',
  ): string {
    switch (period) {
      case RevenuePeriodEnum.Weekly:
        return `TO_CHAR(DATE_TRUNC('week', ${column}), 'YYYY-MM-DD')`;
      case RevenuePeriodEnum.Yearly:
        return `TO_CHAR(${column}, 'YYYY')`;
      case RevenuePeriodEnum.Monthly:
      default:
        return `TO_CHAR(${column}, 'YYYY-MM')`;
    }
  }

  static formatAmount(value: string | number | null | undefined): number {
    if (value === null || value === undefined || value === '') {
      return 0;
    }
    return new Big(value).round(2).toNumber();
  }

  static parseCount(value: string | number | null | undefined): number {
    if (value === null || value === undefined || value === '') {
      return 0;
    }
    return Number(value);
  }

  static formatRevenueData(
    rawData: Array<{ date: string; currency: CurrencyEnumType; value: string | number }>,
  ): RevenueStatisticsItem[] {
    return rawData.map((item) => ({
      date: item.date,
      currency: item.currency,
      value: this.formatAmount(item.value),
    }));
  }

  static formatCategoryDistributionData(
    rawData: Array<{
      type: TransactionTypeEnumType;
      value: string | number;
      transactionsCount: string | number;
    }>,
  ): {
    totalTransactions: number;
    data: Array<{
      type: TransactionTypeEnumType;
      value: number;
      transactionsCount: number;
    }>;
  } {
    const data = rawData.map((item) => ({
      type: item.type,
      value: this.formatAmount(item.value),
      transactionsCount: this.parseCount(item.transactionsCount),
    }));

    const totalTransactions = data.reduce(
      (sum, item) => new Big(sum).plus(item.transactionsCount).toNumber(),
      0,
    );

    return {
      totalTransactions,
      data,
    };
  }
}
