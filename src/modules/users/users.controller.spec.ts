import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { GetUsersDto } from './dto/get-users.dto';
import { UsersRoles, UserStatusEnum } from './types/users.type';
import type { JwtPayload } from '@/modules/auth/types/auth.type';
import { MerchantStatusEnum } from '@/modules/merchants/types/merchants.type';
import { UpdateUserDto } from './dto/update-user.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let service: jest.Mocked<Partial<UsersService>>;

  const mockUser = {
    id: 1,
    name: 'John',
    lastname: 'Doe',
    email: 'john@example.com',
    role: UsersRoles.Admin,
    status: UserStatusEnum.Active,
    merchantId: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
    merchant: null as any,
    password: 'hashedPassword',
  };

  const mockMerchantJwt: JwtPayload = {
    jti: 'test-jti-10', sub: 10,
    email: 'admin@merchant.com',
    merchantId: 10,
    merchantName: 'Test Merchant',
    role: UsersRoles.Admin,
    status: MerchantStatusEnum.Active,
    type: 'access',
  };

  beforeEach(async () => {
    service = {
      createUser: jest.fn(),
      getUsers: jest.fn(),
      getCurrentUser: jest.fn(),
      getUserDetail: jest.fn(),
      deleteUser: jest.fn(),
      updateUser: jest.fn(),
      blockUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should delegate to userService.createUser with currentUser', async () => {
      const createDto: CreateUserDto = {
        name: 'Jane',
        lastname: 'Doe',
        email: 'jane@example.com',
        password: 'password123',
        role: UsersRoles.Employee,
        status: UserStatusEnum.Active,
      };

      (service.createUser as jest.Mock).mockResolvedValue(mockUser);

      const result = await controller.createUser(createDto, mockMerchantJwt);

      expect(service.createUser).toHaveBeenCalledWith(createDto, mockMerchantJwt);
      expect(result).toEqual(mockUser);
    });
  });

  describe('getUsers', () => {
    it('should delegate to userService.getUsers with currentUser', async () => {
      const queryDto: GetUsersDto = { page: 1, limit: 10 };
      const paginatedResult = {
        data: [mockUser],
        total: 1,
        totalItems: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
      (service.getUsers as jest.Mock).mockResolvedValue(paginatedResult);

      const result = await controller.getUsers(queryDto, mockMerchantJwt);

      expect(service.getUsers).toHaveBeenCalledWith(queryDto, mockMerchantJwt);
      expect(result).toEqual(paginatedResult);
    });
  });

  describe('getCurrentUser', () => {
    it('should delegate to userService.getCurrentUser', async () => {
      (service.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

      const result = await controller.getCurrentUser(mockMerchantJwt);

      expect(service.getCurrentUser).toHaveBeenCalledWith(mockMerchantJwt);
      expect(result).toEqual(mockUser);
    });
  });

  describe('getUserDetail', () => {
    it('should delegate to userService.getUserDetail with id and currentUser', async () => {
      (service.getUserDetail as jest.Mock).mockResolvedValue(mockUser);

      const result = await controller.getUserDetail(1, mockMerchantJwt);

      expect(service.getUserDetail).toHaveBeenCalledWith(1, mockMerchantJwt);
      expect(result).toEqual(mockUser);
    });
  });

  describe('DeleteUser', () => {
    it('should delegate to userService.deleteUser with id and currentUser', async () => {
      const deleteResult = { raw: [], affected: 1 };
      (service.deleteUser as jest.Mock).mockResolvedValue(deleteResult);

      const result = await controller.deleteUser(1, mockMerchantJwt);

      expect(service.deleteUser).toHaveBeenCalledWith(1, mockMerchantJwt);
      expect(result).toEqual(deleteResult);
    });
  });

  describe('UpdateUser', () => {
    it('should delegate to userService.updateUser with id, currentUser, and payload', async () => {
      const updatePayload: UpdateUserDto = { name: 'UpdatedName' };
      (service.updateUser as jest.Mock).mockResolvedValue(mockUser);

      const result = await controller.updateUser(
        1,
        mockMerchantJwt,
        updatePayload,
      );

      expect(service.updateUser).toHaveBeenCalledWith(
        1,
        mockMerchantJwt,
        updatePayload,
      );
      expect(result).toEqual(mockUser);
    });
  });

  describe('blockUser', () => {
    it('should delegate to userService.blockUser with id, currentUser, and optional accessToken', async () => {
      (service.blockUser as jest.Mock).mockResolvedValue(undefined);

      const result = await controller.blockUser(2, mockMerchantJwt, {
        accessToken: 'some-token',
      });

      expect(service.blockUser).toHaveBeenCalledWith(2, mockMerchantJwt, 'some-token');
      expect(result).toBeUndefined();
    });
  });
});
