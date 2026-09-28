import {
  CurrencyEnumType,
  type TransactionTypeEnumType,
} from 'src/modules/transactions/types';

export const RevenuePeriodEnum = {
  Weekly: 'weekly',
  Monthly: 'monthly',
  Yearly: 'yearly',
} as const;

export type RevenuePeriodEnumType =
  (typeof RevenuePeriodEnum)[keyof typeof RevenuePeriodEnum];

export type RevenueStatisticsItem = {
  date?: string;
  currency: CurrencyEnumType;
  value: number;
};

export type RevenueStatisticsDataType = {
  period: RevenuePeriodEnumType;
  data: RevenueStatisticsItem[];
};
export type CategoryDistributionStatisticsDataType = {
  totalTransactions: number;
  data: {
    type: TransactionTypeEnumType;
    value: number;
    transactionsCount: number;
  }[];
};
