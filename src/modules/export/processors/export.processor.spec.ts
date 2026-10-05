import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExportProcessor } from './export.processor';
import { Transactions } from '@/modules/transactions/entities/transaction.entity';
import { StatisticsService } from '@/modules/statistics/statistics.service';
import { ExcelService } from '../services/excel.service';
import { MailService } from '../services/mail.service';
import { RevenuePeriodEnum } from '@/modules/statistics/types/statistics.type';

describe('ExportProcessor', () => {
  let processor: ExportProcessor;
  let transactionRepository: jest.Mocked<Partial<Repository<Transactions>>>;
  let statisticsService: jest.Mocked<Partial<StatisticsService>>;
  let excelService: jest.Mocked<Partial<ExcelService>>;
  let mailService: jest.Mocked<Partial<MailService>>;

  beforeEach(async () => {
    transactionRepository = {
      find: jest.fn().mockResolvedValue([
        {
          transactionId: 1,
          amount: 100,
          currency: 'USD',
          type: 'payment',
          status: 'completed',
          merchantName: 'Store',
          dateOfOperation: new Date('2026-01-15'),
          sender: 'Alice',
          receiver: 'Bob',
        } as any,
      ]),
    };

    statisticsService = {
      getRevenueOverview: jest.fn().mockResolvedValue({
        period: RevenuePeriodEnum.Monthly,
        data: [{ date: '2026-01', currency: 'USD' as any, value: 5000 }],
      }),
      getCategoryDistribution: jest.fn().mockResolvedValue({
        totalTransactions: 10,
        data: [{ type: 'payment' as any, value: 5000, transactionsCount: 10 }],
      }),
      getTotalRevenue: jest.fn().mockResolvedValue({ value: 5000 }),
      getTotalTransactions: jest.fn().mockResolvedValue({ value: 10 }),
    };

    excelService = {
      buildTransactionsWorkbook: jest
        .fn()
        .mockResolvedValue(Buffer.from('transactions-excel')),
      buildStatisticsWorkbook: jest
        .fn()
        .mockResolvedValue(Buffer.from('statistics-excel')),
    };

    mailService = {
      sendReportMail: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExportProcessor,
        {
          provide: getRepositoryToken(Transactions),
          useValue: transactionRepository,
        },
        {
          provide: StatisticsService,
          useValue: statisticsService,
        },
        {
          provide: ExcelService,
          useValue: excelService,
        },
        {
          provide: MailService,
          useValue: mailService,
        },
      ],
    }).compile();

    processor = module.get<ExportProcessor>(ExportProcessor);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should process export-transactions job successfully', async () => {
    const job = {
      id: 'tx-job-1',
      name: 'export-transactions',
      data: {
        recipientEmail: 'finance@finking.com',
        filters: {
          dateFrom: '2026-01-01',
          dateTo: '2026-02-01',
          currency: 'USD',
        },
      },
    } as any;

    await processor.process(job);

    expect(transactionRepository.find).toHaveBeenCalled();
    expect(excelService.buildTransactionsWorkbook).toHaveBeenCalled();
    expect(mailService.sendReportMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'finance@finking.com',
        subject: expect.stringContaining('Transactions Export Report'),
        attachmentBuffer: Buffer.from('transactions-excel'),
      }),
    );
  });

  it('should process export-statistics job successfully', async () => {
    const job = {
      id: 'stats-job-1',
      name: 'export-statistics',
      data: {
        recipientEmail: 'analytics@finking.com',
        filters: {
          startDate: '2026-01-01T00:00:00.000Z',
          endDate: '2026-06-01T00:00:00.000Z',
        },
        merchantId: 10,
      },
    } as any;

    await processor.process(job);

    expect(statisticsService.getRevenueOverview).toHaveBeenCalled();
    expect(statisticsService.getCategoryDistribution).toHaveBeenCalled();
    expect(statisticsService.getTotalRevenue).toHaveBeenCalled();
    expect(statisticsService.getTotalTransactions).toHaveBeenCalled();
    expect(excelService.buildStatisticsWorkbook).toHaveBeenCalled();
    expect(mailService.sendReportMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'analytics@finking.com',
        subject: 'FinKing - Platform Statistics Export Report',
        attachmentBuffer: Buffer.from('statistics-excel'),
      }),
    );
  });

  it('should handle unknown job gracefully', async () => {
    const job = {
      id: 'unknown-job',
      name: 'unknown-export',
      data: {},
    } as any;

    await expect(processor.process(job)).resolves.not.toThrow();
    expect(mailService.sendReportMail).not.toHaveBeenCalled();
  });
});
