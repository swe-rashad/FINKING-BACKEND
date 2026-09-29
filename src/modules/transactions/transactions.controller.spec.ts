import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsController } from '@/modules/transactions/transactions.controller';
import { TransactionsService } from '@/modules/transactions/transactions.service';
import { Transactions } from '@/modules/transactions/entities/transaction.entity';
import { GetTransactionsDto } from '@/modules/transactions/dto/get-transactions.dto';
import type {
  CurrencyEnumType,
  TransactionTypeEnumType,
  TransactionStatusEnumType,
} from '@/modules/transactions/types';
import { UsersRoles } from '@/modules/users/types/users.type';
import type { JwtPayload } from '@/modules/auth/types/auth.type';

describe('TransactionsController', () => {
  let controller: TransactionsController;
  let service: jest.Mocked<Partial<TransactionsService>>;

  const mockTransaction: Transactions = {
    transactionId: 101,
    amount: 150.5,
    currency: 'usd',
    type: 'payment',
    status: 'completed',
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

  const mockUser: JwtPayload = {
    jti: 'test-jti',
    sub: 1,
    email: 'admin@finking.com',
    role: UsersRoles.Admin,
    type: 'access',
  };

  beforeEach(async () => {
    service = {
      getTransactions: jest.fn(),
      getTransactionDetails: jest.fn(),
      exportTransactions: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [
        {
          provide: TransactionsService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<TransactionsController>(TransactionsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getTransactions', () => {
    it('should delegate query to transactionsService.getTransactions', async () => {
      const query: GetTransactionsDto = { page: 1, limit: 10 };
      const paginatedResult = {
        data: [mockTransaction],
        total: 1,
        totalItems: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      (service.getTransactions as jest.Mock).mockResolvedValue(paginatedResult);

      const result = await controller.getTransactions(query);

      expect(service.getTransactions).toHaveBeenCalledWith(query);
      expect(result).toEqual(paginatedResult);
    });
  });

  describe('getTransactionDetails', () => {
    it('should delegate id to transactionsService.getTransactionDetails', async () => {
      (service.getTransactionDetails as jest.Mock).mockResolvedValue(
        mockTransaction,
      );

      const result = await controller.getTransactionDetails(101);

      expect(service.getTransactionDetails).toHaveBeenCalledWith(101);
      expect(result).toEqual(mockTransaction);
    });
  });

  describe('exportTransactions', () => {
    it('should delegate payload and currentUser to service.exportTransactions', async () => {
      const exportDto = { email: 'report@finking.com' };
      const expectedResponse = {
        message:
          'Export report generation started. File will be sent to your email.',
        recipientEmail: 'report@finking.com',
      };
      (service.exportTransactions as jest.Mock).mockResolvedValue(
        expectedResponse,
      );

      const result = await controller.exportTransactions(exportDto, mockUser);

      expect(service.exportTransactions).toHaveBeenCalledWith(
        exportDto,
        mockUser,
      );
      expect(result).toEqual(expectedResponse);
    });
  });
});
