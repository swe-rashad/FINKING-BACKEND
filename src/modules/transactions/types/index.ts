export const currencyEnum = {
  Eur: 'eur',
  Usd: 'usd',
  Gbp: 'gbp',
} as const;

export type CurrencyEnumType = (typeof currencyEnum)[keyof typeof currencyEnum];

export const transactionTypeEnum = {
  Payment: 'payment',
  TopUp: 'topup',
  Transfer: 'transfer',
} as const;

export type TransactionTypeEnumType =
  (typeof transactionTypeEnum)[keyof typeof transactionTypeEnum];

export const transactionStatusEnum = {
  Failed: 'failed',
  Completed: 'completed',
  Pending: 'pending',
} as const;

export type TransactionStatusEnumType =
  (typeof transactionStatusEnum)[keyof typeof transactionStatusEnum];

export type transactionStatusEnumType = TransactionStatusEnumType;
