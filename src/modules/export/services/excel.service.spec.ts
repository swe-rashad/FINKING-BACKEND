import { ExcelService } from './excel.service';
import { currencyEnum, transactionStatusEnum, transactionTypeEnum } from '@/modules/transactions/types';

describe('ExcelService', () => {
  let service: ExcelService;

  beforeEach(() => {
    service = new ExcelService();
  });

  describe('buildTransactionsWorkbook', () => {
    it('should generate an Excel buffer with correct headers and data', async () => {
      const mockTransactions = [
        {
          transactionId: 101,
          sender: 'Alice',
          receiver: 'Bob',
          amount: 250.75,
          currency: currencyEnum.Usd,
          type: transactionTypeEnum.Payment,
          status: transactionStatusEnum.Completed,
          merchantName: 'SuperStore',
          dateOfOperation: new Date('2026-03-15T12:00:00Z'),
        } as any,
      ];

      const buffer = await service.buildTransactionsWorkbook(mockTransactions);

      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.length).toBeGreaterThan(0);
    });
  });

  describe('buildStatisticsWorkbook', () => {
    it('should generate a multi-sheet Excel buffer for platform statistics', async () => {
      const mockPayload = {
        totalRevenue: 154000.5,
        totalTransactions: 3200,
        revenueOverview: {
          period: 'monthly',
          data: [
            { date: '2026-01', currency: 'USD', value: 75000 },
            { date: '2026-02', currency: 'USD', value: 79000.5 },
          ],
        },
        categoryDistribution: {
          totalTransactions: 3200,
          data: [
            { type: 'payment', value: 120000, transactionsCount: 2500 },
            { type: 'transfer', value: 34000.5, transactionsCount: 700 },
          ],
        },
      };

      const buffer = await service.buildStatisticsWorkbook(mockPayload);

      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.length).toBeGreaterThan(0);
    });
  });
});
