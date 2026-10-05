import { Test, TestingModule } from '@nestjs/testing';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';
import { GetStatisticsDto } from './dto/get-statistics.dto';
import { RevenuePeriodEnum } from './types/statistics.type';
import { UsersRoles } from '@/modules/users/types/users.type';
import type { JwtPayload } from '@/modules/auth/types/auth.type';

describe('StatisticsController', () => {
  let controller: StatisticsController;
  let service: jest.Mocked<Partial<StatisticsService>>;

  const queryDto: GetStatisticsDto = {
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-01-31'),
  };

  const currentUser: JwtPayload = {
    jti: 'admin-jti',
    sub: 1,
    email: 'admin@finking.com',
    role: UsersRoles.Admin,
    type: 'access',
    merchantId: 10,
  };

  beforeEach(async () => {
    service = {
      getRevenueOverview: jest.fn(),
      getCategoryDistribution: jest.fn(),
      getTotalRevenue: jest.fn(),
      getTotalTransactions: jest.fn(),
      getAverageTransactionAmount: jest.fn(),
      getActiveUsers: jest.fn(),
      getLastTransactions: jest.fn(),
      exportStatistics: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StatisticsController],
      providers: [
        {
          provide: StatisticsService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<StatisticsController>(StatisticsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getRevenueOverview', () => {
    it('should delegate to service.getRevenueOverview', async () => {
      const mockResult = {
        period: RevenuePeriodEnum.Weekly,
        data: [{ date: '2025-01-01', currency: 'USD', value: 100 }],
      };
      (service.getRevenueOverview as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.getRevenueOverview(queryDto, currentUser);

      expect(service.getRevenueOverview).toHaveBeenCalledWith(
        queryDto,
        currentUser,
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('getCategoryDistribution', () => {
    it('should delegate to service.getCategoryDistribution', async () => {
      const mockResult = {
        totalTransactions: 10,
        data: [{ type: 'payment', value: 100, transactionsCount: 10 }],
      };
      (service.getCategoryDistribution as jest.Mock).mockResolvedValue(
        mockResult,
      );

      const result = await controller.getCategoryDistribution(
        queryDto,
        currentUser,
      );

      expect(service.getCategoryDistribution).toHaveBeenCalledWith(
        queryDto,
        currentUser,
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('getTotalRevenue', () => {
    it('should delegate to service.getTotalRevenue', async () => {
      (service.getTotalRevenue as jest.Mock).mockResolvedValue({ value: 5000 });

      const result = await controller.getTotalRevenue(queryDto, currentUser);

      expect(service.getTotalRevenue).toHaveBeenCalledWith(
        queryDto,
        currentUser,
      );
      expect(result).toEqual({ value: 5000 });
    });
  });

  describe('getTotalTransactions', () => {
    it('should delegate to service.getTotalTransactions', async () => {
      (service.getTotalTransactions as jest.Mock).mockResolvedValue({
        value: 120,
      });

      const result = await controller.getTotalTransactions(
        queryDto,
        currentUser,
      );

      expect(service.getTotalTransactions).toHaveBeenCalledWith(
        queryDto,
        currentUser,
      );
      expect(result).toEqual({ value: 120 });
    });
  });

  describe('getAverageTransactionAmount', () => {
    it('should delegate to service.getAverageTransactionAmount', async () => {
      (service.getAverageTransactionAmount as jest.Mock).mockResolvedValue({
        value: 41.67,
      });

      const result = await controller.getAverageTransactionAmount(
        queryDto,
        currentUser,
      );

      expect(service.getAverageTransactionAmount).toHaveBeenCalledWith(
        queryDto,
        currentUser,
      );
      expect(result).toEqual({ value: 41.67 });
    });
  });

  describe('getActiveUsers', () => {
    it('should delegate to service.getActiveUsers', async () => {
      (service.getActiveUsers as jest.Mock).mockResolvedValue({ value: 25 });

      const result = await controller.getActiveUsers(queryDto, currentUser);

      expect(service.getActiveUsers).toHaveBeenCalledWith(
        queryDto,
        currentUser,
      );
      expect(result).toEqual({ value: 25 });
    });
  });

  describe('getLastTransactions', () => {
    it('should delegate to service.getLastTransactions', async () => {
      const mockList = [{ transactionId: 1 }] as any;
      (service.getLastTransactions as jest.Mock).mockResolvedValue(mockList);

      const result = await controller.getLastTransactions(
        queryDto,
        currentUser,
      );

      expect(service.getLastTransactions).toHaveBeenCalledWith(
        queryDto,
        currentUser,
      );
      expect(result).toEqual(mockList);
    });
  });

  describe('exportStatistics', () => {
    it('should delegate to service.exportStatistics', async () => {
      const mockResult = {
        message:
          'Statistics export report generation started. File will be sent to your email.',
        recipientEmail: 'admin@finking.com',
      };
      (service.exportStatistics as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.exportStatistics(queryDto, currentUser);

      expect(service.exportStatistics).toHaveBeenCalledWith(
        queryDto,
        currentUser,
      );
      expect(result).toEqual(mockResult);
    });
  });
});
