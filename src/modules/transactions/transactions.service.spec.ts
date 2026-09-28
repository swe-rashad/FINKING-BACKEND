import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { getQueueToken } from '@nestjs/bullmq';

import { TransactionsService } from '@/modules/transactions/transactions.service';
import { Transactions } from '@/modules/transactions/entities/transaction.entity';
import { DatabaseTransactionProvider } from '@/modules/transactions/providers/database-transaction.provider';
import { GetTransactionsDto } from '@/modules/transactions/dto/get-transactions.dto';
import {
  currencyEnum,
  transactionStatusEnum,
  transactionTypeEnum,
} from '@/modules/transactions/types';
import { UsersRoles } from '@/modules/users/types/users.type';
import type { JwtPayload } from '@/modules/auth/types/auth.type';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let repository: jest.Mocked<Partial<Repository<Transactions>>>;
  let provider: jest.Mocked<Partial<DatabaseTransactionProvider>>;
  let exportQueue: { add: jest.Mock };

  const mockTransaction: Transactions = {
    transactionId: 101,
    amount: 150.5,
    currency: currencyEnum.Usd,
    type: transactionTypeEnum.Payment,
    status: transactionStatusEnum.Completed,
    dateOfOperation: new Date(),
    sender: 'Alice',
    receiver: 'Bob',
    rrn: '123456789012',
    merchantName: 'Test Merchant',
    operationId: 1,
    mcc: 5411,
    merchantId: 1,
    terminalId: 'TERM01',
  };

  beforeEach(async () => {
    repository = {
      findOne: jest.fn(),
    };

    provider = {
      getTransactions: jest.fn(),
    };

    exportQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: getRepositoryToken(Transactions),
          useValue: repository,
        },
        {
          provide: DatabaseTransactionProvider,
          useValue: provider,
        },
        {
          provide: getQueueToken('export-queue'),
          useValue: exportQueue,
        },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getTransactionDetails', () => {
    it('should return transaction when found by id', async () => {
      (repository.findOne as jest.Mock).mockResolvedValue(mockTransaction);

      const result = await service.getTransactionDetails(101);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { transactionId: 101 },
      });
      expect(result).toEqual(mockTransaction);
    });

    it('should throw NotFoundException when transaction is not found', async () => {
      (repository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.getTransactionDetails(999)).rejects.toThrow(
        new NotFoundException('Transaction not found'),
      );
    });
  });

  describe('getTransactions', () => {
    it('should delegate fetching transactions to provider', async () => {
      const query: GetTransactionsDto = { page: 1, limit: 10 };
      const paginatedResult = {
        data: [mockTransaction],
        total: 1,
        totalItems: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      (provider.getTransactions as jest.Mock).mockResolvedValue(
        paginatedResult,
      );

      const result = await service.getTransactions(query);

      expect(provider.getTransactions).toHaveBeenCalledWith(query);
      expect(result).toEqual(paginatedResult);
    });

    it('should propagate error when provider fails', async () => {
      const query: GetTransactionsDto = { page: 1, limit: 10 };
      (provider.getTransactions as jest.Mock).mockRejectedValue(
        new Error('Database query failure'),
      );

      await expect(service.getTransactions(query)).rejects.toThrow(
        'Database query failure',
      );
    });
  });

  describe('exportTransactions', () => {
    const adminUser: JwtPayload = {
      jti: 'admin-jti',
      sub: 1,
      email: 'admin@finking.com',
      role: UsersRoles.Admin,
      type: 'access',
    };

    it('should add export job to BullMQ queue without merchantId constraint', async () => {
      const result = await service.exportTransactions({}, adminUser);

      expect(exportQueue.add).toHaveBeenCalledWith('export-transactions', {
        recipientEmail: 'admin@finking.com',
        filters: {},
      });
      expect(result.recipientEmail).toBe('admin@finking.com');
    });

    it('should throw BadRequestException if dateTo is earlier than dateFrom', async () => {
      await expect(
        service.exportTransactions(
          { dateFrom: '2026-05-10', dateTo: '2026-05-01' },
          adminUser,
        ),
      ).rejects.toThrow('dateTo cannot be earlier than dateFrom');
    });

    it('should throw BadRequestException if date range exceeds 1 year (365 days)', async () => {
      await expect(
        service.exportTransactions(
          { dateFrom: '2024-01-01', dateTo: '2025-01-10' },
          adminUser,
        ),
      ).rejects.toThrow('Date range cannot exceed 1 year (365 days)');
    });

    it('should accept valid date range within 1 year and use custom email', async () => {
      const result = await service.exportTransactions(
        {
          dateFrom: '2026-01-01',
          dateTo: '2026-06-01',
          email: 'finance@finking.com',
        },
        adminUser,
      );

      expect(exportQueue.add).toHaveBeenCalledWith('export-transactions', {
        recipientEmail: 'finance@finking.com',
        filters: {
          dateFrom: '2026-01-01',
          dateTo: '2026-06-01',
          email: 'finance@finking.com',
        },
      });
      expect(result.recipientEmail).toBe('finance@finking.com');
    });
  });
});
