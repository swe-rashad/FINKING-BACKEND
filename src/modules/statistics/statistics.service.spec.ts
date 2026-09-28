import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { getQueueToken } from '@nestjs/bullmq';
import { StatisticsService } from './statistics.service';
import { Transactions } from '@/modules/transactions/entities/transaction.entity';
import { GetStatisticsDto } from './dto/get-statistics.dto';
import { RevenuePeriodEnum } from './types/statistics.type';
import { UsersRoles } from '@/modules/users/types/users.type';
import type { JwtPayload } from '@/modules/auth/types/auth.type';

describe('StatisticsService', () => {
  let service: StatisticsService;
  let repository: jest.Mocked<Partial<Repository<Transactions>>>;
  let exportQueue: { add: jest.Mock };

  beforeEach(async () => {
    repository = {
      createQueryBuilder: jest.fn(),
      find: jest.fn(),
    };

    exportQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-stat-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatisticsService,
        {
          provide: getRepositoryToken(Transactions),
          useValue: repository,
        },
        {
          provide: getQueueToken('export-queue'),
          useValue: exportQueue,
        },
      ],
    }).compile();

    service = module.get<StatisticsService>(StatisticsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Validation & Date Handling', () => {
    it('should throw BadRequestException if dates are invalid strings', async () => {
      const payload: GetStatisticsDto = {
        startDate: 'invalid-date' as any,
        endDate: new Date('2025-01-01'),
      };

      await expect(service.getTotalRevenue(payload)).rejects.toThrow(
        new BadRequestException('Invalid date provided'),
      );
    });

    it('should throw BadRequestException if startDate is after endDate', async () => {
      const payload: GetStatisticsDto = {
        startDate: new Date('2025-05-01'),
        endDate: new Date('2025-01-01'),
      };

      await expect(service.getTotalRevenue(payload)).rejects.toThrow(
        new BadRequestException('startDate cannot be greater than endDate'),
      );
    });
  });

  describe('getTotalRevenue', () => {
    it('should return total revenue formatted as number', async () => {
      const queryBuilder: any = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ totalRevenue: '12500.50' }),
      };
      (repository.createQueryBuilder as jest.Mock).mockReturnValue(
        queryBuilder,
      );

      const payload: GetStatisticsDto = {
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31'),
      };

      const result = await service.getTotalRevenue(payload);

      expect(result).toEqual({ value: 12500.5 });
      expect(queryBuilder.getRawOne).toHaveBeenCalled();
    });

    it('should return 0 when no revenue is found', async () => {
      const queryBuilder: any = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(null),
      };
      (repository.createQueryBuilder as jest.Mock).mockReturnValue(
        queryBuilder,
      );

      const result = await service.getTotalRevenue({});

      expect(result).toEqual({ value: 0 });
    });
  });

  describe('getTotalTransactions', () => {
    it('should return total count of transactions', async () => {
      const queryBuilder: any = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ totalTransactions: '42' }),
      };
      (repository.createQueryBuilder as jest.Mock).mockReturnValue(
        queryBuilder,
      );

      const result = await service.getTotalTransactions({});

      expect(result).toEqual({ value: 42 });
    });
  });

  describe('getAverageTransactionAmount', () => {
    it('should return average transaction amount', async () => {
      const queryBuilder: any = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ averageAmount: '75.50' }),
      };
      (repository.createQueryBuilder as jest.Mock).mockReturnValue(
        queryBuilder,
      );

      const result = await service.getAverageTransactionAmount({});

      expect(result).toEqual({ value: 75.5 });
    });
  });

  describe('getActiveUsers', () => {
    it('should return active unique user count', async () => {
      const queryBuilder: any = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ activeUsersCount: '15' }),
      };
      (repository.createQueryBuilder as jest.Mock).mockReturnValue(
        queryBuilder,
      );

      const result = await service.getActiveUsers({});

      expect(result).toEqual({ value: 15 });
    });
  });

  describe('getRevenueOverview', () => {
    it('should return weekly period when date diff <= 31 days', async () => {
      const queryBuilder: any = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getRawMany: jest
          .fn()
          .mockResolvedValue([
            { date: '2025-01-05', currency: 'USD', value: '150.00' },
          ]),
      };
      (repository.createQueryBuilder as jest.Mock).mockReturnValue(
        queryBuilder,
      );

      const payload: GetStatisticsDto = {
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-20'),
      };

      const result = await service.getRevenueOverview(payload);

      expect(result.period).toBe(RevenuePeriodEnum.Weekly);
      expect(result.data).toEqual([
        { date: '2025-01-05', currency: 'USD', value: 150 },
      ]);
    });
  });

  describe('getCategoryDistribution', () => {
    it('should return grouped category distribution with totals', async () => {
      const queryBuilder: any = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { type: 'payment', value: '500.00', transactionsCount: '5' },
          { type: 'refund', value: '100.00', transactionsCount: '1' },
        ]),
      };
      (repository.createQueryBuilder as jest.Mock).mockReturnValue(
        queryBuilder,
      );

      const result = await service.getCategoryDistribution({});

      expect(result.totalTransactions).toBe(6);
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toEqual({
        type: 'payment',
        value: 500,
        transactionsCount: 5,
      });
    });
  });

  describe('getLastTransactions', () => {
    it('should fetch the last 3 transactions within date range', async () => {
      const mockList = [{ transactionId: 1 }, { transactionId: 2 }] as any;
      (repository.find as jest.Mock).mockResolvedValue(mockList);

      const result = await service.getLastTransactions({});

      expect(repository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 3,
          order: { dateOfOperation: 'DESC' },
        }),
      );
      expect(result).toEqual(mockList);
    });
  });

  describe('exportStatistics', () => {
    const adminUser: JwtPayload = {
      jti: 'admin-jti',
      sub: 1,
      email: 'admin@finking.com',
      role: UsersRoles.Admin,
      type: 'access',
    };

    it('should add export-statistics job to queue with default email', async () => {
      const result = await service.exportStatistics({}, adminUser);

      expect(exportQueue.add).toHaveBeenCalledWith('export-statistics', {
        recipientEmail: 'admin@finking.com',
        filters: {
          startDate: undefined,
          endDate: undefined,
        },
      });
      expect(result.recipientEmail).toBe('admin@finking.com');
    });

    it('should throw BadRequestException if endDate is earlier than startDate', async () => {
      await expect(
        service.exportStatistics(
          {
            startDate: new Date('2026-05-10'),
            endDate: new Date('2026-05-01'),
          },
          adminUser,
        ),
      ).rejects.toThrow('endDate cannot be earlier than startDate');
    });

    it('should throw BadRequestException if date range exceeds 1 year (365 days)', async () => {
      await expect(
        service.exportStatistics(
          {
            startDate: new Date('2024-01-01'),
            endDate: new Date('2025-01-10'),
          },
          adminUser,
        ),
      ).rejects.toThrow('Date range cannot exceed 1 year (365 days)');
    });

    it('should add job to queue with custom email and valid date range', async () => {
      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-06-01');
      const result = await service.exportStatistics(
        {
          startDate,
          endDate,
          email: 'cfo@finking.com',
        },
        adminUser,
      );

      expect(exportQueue.add).toHaveBeenCalledWith('export-statistics', {
        recipientEmail: 'cfo@finking.com',
        filters: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      });
      expect(result.recipientEmail).toBe('cfo@finking.com');
    });
  });
});
