import {
  currencyEnum,
  transactionStatusEnum,
  transactionTypeEnum,
  TransactionTypeEnumType,
} from '@/modules/transactions/types/index';

const merchants = [
  { name: 'Amazon', mcc: 5311 },
  { name: 'Apple Store', mcc: 5732 },
  { name: 'Microsoft', mcc: 5734 },
  { name: 'Netflix', mcc: 4899 },
  { name: 'Spotify', mcc: 4899 },
  { name: 'Uber', mcc: 4121 },
  { name: 'Booking.com', mcc: 4722 },
  { name: 'Nike', mcc: 5661 },
  { name: 'Adidas', mcc: 5661 },
  { name: 'Starbucks', mcc: 5812 },
  { name: 'McDonalds', mcc: 5814 },
  { name: 'IKEA', mcc: 5712 },
  { name: 'Shell', mcc: 5541 },
  { name: 'HSBC', mcc: 6011 },
  { name: 'HSBC Business', mcc: 6012 },
  { name: 'Barclays', mcc: 6011 },
  { name: 'Lloyds Bank', mcc: 6011 },
  { name: 'Wise', mcc: 4829 },
  { name: 'PayPal', mcc: 4829 },
  { name: 'Revolut', mcc: 6011 },
];

const currencies = [currencyEnum.Eur, currencyEnum.Usd, currencyEnum.Gbp];

const getRandomItem = <T>(items: T[], index: number): T => {
  return items[index % items.length];
};

const getTransactionType = (index: number): TransactionTypeEnumType => {
  const value = index % 12;

  // 50%
  if (value < 6) {
    return transactionTypeEnum.Payment;
  }

  // 16.67%
  if (value < 8) {
    return transactionTypeEnum.TopUp;
  }

  // 33.33%
  return transactionTypeEnum.Transfer;
};

const getStatus = (index: number) => {
  const value = index % 20;

  if (value < 17) {
    return transactionStatusEnum.Completed;
  }

  if (value < 19) {
    return transactionStatusEnum.Pending;
  }

  return transactionStatusEnum.Failed;
};

const getAmount = (type: TransactionTypeEnumType, index: number): number => {
  if (type === transactionTypeEnum.Transfer) {
    const amounts = [
      250, 500, 750, 1000, 1500, 2500, 5000, 7500, 10000, 15000, 25000,
    ];

    return amounts[index % amounts.length];
  }

  if (type === transactionTypeEnum.TopUp) {
    const amounts = [50, 100, 150, 250, 500, 750, 1000, 1500, 2000, 3000];

    return amounts[index % amounts.length];
  }

  const amounts = [
    12.5, 25, 42.75, 65, 89.5, 120, 180, 250, 300, 450, 680, 999.99, 1200, 1800,
    2500, 3200,
  ];

  return amounts[index % amounts.length];
};

const startDate = new Date('2024-09-21T00:00:00Z');
const endDate = new Date('2026-09-21T23:59:59Z');

const TOTAL_TRANSACTIONS = 5000;

export const transactionsMock = Array.from(
  { length: TOTAL_TRANSACTIONS },
  (_, index) => {
    const merchant = getRandomItem(merchants, index);
    const currency = getRandomItem(currencies, index);
    const type = getTransactionType(index);

    const totalTime = endDate.getTime() - startDate.getTime();

    const dateOfOperation = new Date(
      startDate.getTime() + (totalTime / TOTAL_TRANSACTIONS) * index,
    );

    dateOfOperation.setUTCHours(
      6 + (index % 16),
      (index * 7) % 60,
      (index * 13) % 60,
      0,
    );

    const senderNumber = 77000000000 + index;
    const receiverNumber = 77100000000 + index;

    return {
      sender: String(senderNumber),
      receiver: String(receiverNumber),
      amount: getAmount(type, index),
      currency,
      type,
      status: getStatus(index),
      dateOfOperation,
      rrn: 123456789000 + index,
      merchantName: merchant.name,
      operationId: 100000 + index,
      mcc: merchant.mcc,
      merchantId: 50000 + (index % merchants.length),
      terminalId: `TERM-${String((index % 1000) + 1).padStart(4, '0')}`,
    };
  },
);
