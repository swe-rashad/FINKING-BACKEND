import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User } from './entities/users.entity';
import { UserNotFoundException } from './exceptions/userNotFound.exception';
import { UsersRoles, UserStatusEnum } from './types/users.type';
import { CreateUserDto } from './dto/create-user.dto';
import { GetUsersDto } from './dto/get-users.dto';
import type { JwtPayload } from '@/modules/auth/types/auth.type';
import { MerchantStatusEnum } from '@/modules/merchants/types/merchants.type';
import { BlocklistService } from '@/common/services/blocklist.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn().mockResolvedValue(true),
}));

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<Partial<Repository<User>>>;
  let configService: jest.Mocked<Partial<ConfigService>>;
  let blocklistService: { addToBlocklist: jest.Mock; isBlocked: jest.Mock };
  let jwtService: { verify: jest.Mock };

  const mockUser: User = {
    id: 1,
    name: 'John',
    lastname: 'Doe',
    email: 'john.doe@example.com',
    password: 'hashedPassword',
    role: UsersRoles.Admin,
    status: UserStatusEnum.Active,
    merchantId: 1,
    verificated: true,
    permissions: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    merchant: null as any,
  };

  beforeEach(async () => {
    repository = {
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    };

    configService = {
      get: jest.fn((key: string) => {
        if (key === 'jwtAccessSecret') return 'test_jwt_access_secret';
        if (key === 'salt') return 10;
        return null;
      }),
    };

    blocklistService = {
      addToBlocklist: jest.fn().mockResolvedValue(undefined),
      isBlocked: jest.fn().mockResolvedValue(false),
    };

    jwtService = {
      verify: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: repository,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
        {
          provide: BlocklistService,
          useValue: blocklistService,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findUserByEmail', () => {
    it('should return a user if found by email', async () => {
      (repository.findOne as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.findUserByEmail('john.doe@example.com');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: 'john.doe@example.com' },
        relations: { merchant: true },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user is not found by email', async () => {
      (repository.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.findUserByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('getUserByEmail', () => {
    it('should return a user when found', async () => {
      (repository.findOne as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.getUserByEmail('john.doe@example.com');

      expect(result).toEqual(mockUser);
    });

    it('should throw UserNotFoundException when user is not found', async () => {
      (repository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.getUserByEmail('nonexistent@example.com'),
      ).rejects.toThrow(UserNotFoundException);
    });
  });

  describe('createAdminUser', () => {
    it('should create and save an admin user with hashed password', async () => {
      (repository.create as jest.Mock).mockReturnValue({
        ...mockUser,
        role: UsersRoles.Admin,
      });
      (repository.save as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.createAdminUser({
        email: 'admin@example.com',
        password: 'password123',
        name: 'Admin',
        lastname: 'User',
        merchantId: 1,
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          role: UsersRoles.Admin,
          merchantId: 1,
        }),
      );
      expect(repository.save).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });
  });

  describe('createUser', () => {
    const createDto: CreateUserDto = {
      name: 'John',
      lastname: 'Doe',
      email: 'newuser@example.com',
      password: 'password123',
      role: UsersRoles.Employee,
      status: UserStatusEnum.Active,
      merchantId: 1,
    };

    it('should throw ConflictException if user already exists', async () => {
      (repository.findOne as jest.Mock).mockResolvedValue(mockUser);

      await expect(service.createUser(createDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw BadRequestException if trying to create user with admin role', async () => {
      (repository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.createUser({ ...createDto, role: UsersRoles.Admin }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should hash password and create a user successfully', async () => {
      (repository.findOne as jest.Mock).mockResolvedValue(null);
      (repository.create as jest.Mock).mockReturnValue({
        ...createDto,
        password: 'hashed_password',
      });
      (repository.save as jest.Mock).mockResolvedValue({
        id: 2,
        ...createDto,
        password: 'hashed_password',
      });

      const result = await service.createUser(createDto);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(repository.create).toHaveBeenCalledWith({
        ...createDto,
        role: UsersRoles.Employee,
        password: 'hashed_password',
      });
      expect(repository.save).toHaveBeenCalled();
      expect(result.password).toBe('hashed_password');
    });
  });

  describe('getUsers', () => {
    it('should return paginated list of users', async () => {
      (repository.findAndCount as jest.Mock).mockResolvedValue([[mockUser], 1]);

      const dto: GetUsersDto = {
        page: 1,
        limit: 10,
      };

      const result = await service.getUsers(dto);

      expect(result).toEqual({
        data: [mockUser],
        total: 1,
        totalItems: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });
  });

  describe('getUserDetail', () => {
    it('should return user detail when found by id', async () => {
      (repository.findOne as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.getUserDetail(1);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: { merchant: true },
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw UserNotFoundException if user detail not found', async () => {
      (repository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.getUserDetail(999)).rejects.toThrow(
        UserNotFoundException,
      );
    });
  });

  describe('deleteUser', () => {
    it('should delete user by id and optional merchantId', async () => {
      const deleteResult = { raw: [], affected: 1 };
      (repository.delete as jest.Mock).mockResolvedValue(deleteResult);

      const result = await service.deleteUser(1, 1);

      expect(repository.delete).toHaveBeenCalledWith({ id: 1, merchantId: 1 });
      expect(result).toEqual(deleteResult);
    });
  });

  describe('getCurrentUser', () => {
    const payload: JwtPayload = {
      jti: 'test-jti-1',
      sub: 1,
      email: 'john.doe@example.com',
      merchantId: 1,
      merchantName: 'Test Merchant',
      role: UsersRoles.Admin,
      status: MerchantStatusEnum.Active,
      type: 'access',
    };

    it('should return current user by sub id', async () => {
      (repository.findOne as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.getCurrentUser(payload);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: payload.sub },
        relations: { merchant: true },
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw UserNotFoundException if current user not found', async () => {
      (repository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.getCurrentUser(payload)).rejects.toThrow(
        UserNotFoundException,
      );
    });
  });

  describe('updateUser', () => {
    const payload: JwtPayload = {
      jti: 'test-jti-1',
      sub: 1,
      email: 'john.doe@example.com',
      merchantId: 1,
      merchantName: 'Test Merchant',
      role: UsersRoles.Admin,
      status: MerchantStatusEnum.Active,
      type: 'access',
    };

    it('should throw BadRequestException if trying to update role to admin', async () => {
      await expect(
        service.updateUser(2, payload, { role: UsersRoles.Admin }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update user successfully when not changing to admin', async () => {
      const updateResult = { raw: [], affected: 1, generatedMaps: [] };
      (repository.update as jest.Mock).mockResolvedValue(updateResult);

      const result = await service.updateUser(2, payload, { name: 'Updated' });

      expect(repository.update).toHaveBeenCalledWith(
        { id: 2, merchantId: 1 },
        { name: 'Updated' },
      );
      expect(result).toEqual(updateResult);
    });
  });

  describe('blockUser', () => {
    const adminPayload: JwtPayload = {
      jti: 'test-jti-admin',
      sub: 1,
      email: 'admin@merchant.com',
      merchantId: 1,
      merchantName: 'Test Merchant',
      role: UsersRoles.Admin,
      status: UserStatusEnum.Active,
      type: 'access',
    };

    const targetEmployee: User = {
      id: 2,
      name: 'Jane',
      lastname: 'Employee',
      email: 'jane@employee.com',
      password: 'password',
      role: UsersRoles.Employee,
      status: UserStatusEnum.Active,
      merchantId: 1,
      verificated: true,
      permissions: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      merchant: null as any,
    };

    it('should throw NotFoundException if user to block is not found', async () => {
      (repository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.blockUser(999, adminPayload)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user to block is an admin', async () => {
      const adminTarget = { ...targetEmployee, role: UsersRoles.Admin };
      (repository.findOne as jest.Mock).mockResolvedValue(adminTarget);

      await expect(service.blockUser(2, adminPayload)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException if user is already blocked', async () => {
      const blockedTarget = {
        ...targetEmployee,
        status: UserStatusEnum.Blocked,
      };
      (repository.findOne as jest.Mock).mockResolvedValue(blockedTarget);

      await expect(service.blockUser(2, adminPayload)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should block user and update status in database without accessToken', async () => {
      (repository.findOne as jest.Mock).mockResolvedValue(targetEmployee);
      (repository.update as jest.Mock).mockResolvedValue({ affected: 1 });

      await service.blockUser(2, adminPayload);

      expect(repository.update).toHaveBeenCalledWith(
        { id: 2, merchantId: 1 },
        { status: UserStatusEnum.Blocked },
      );
      expect(blocklistService.addToBlocklist).not.toHaveBeenCalled();
    });

    it('should decode accessToken and add jti to blocklist when provided', async () => {
      (repository.findOne as jest.Mock).mockResolvedValue(targetEmployee);
      (repository.update as jest.Mock).mockResolvedValue({ affected: 1 });

      const exp = Math.floor(Date.now() / 1000) + 3600;
      jwtService.verify.mockReturnValue({
        jti: 'token-to-block-jti',
        exp,
      });

      await service.blockUser(2, adminPayload, 'some-access-token');

      expect(repository.update).toHaveBeenCalledWith(
        { id: 2, merchantId: 1 },
        { status: UserStatusEnum.Blocked },
      );
      expect(jwtService.verify).toHaveBeenCalledWith('some-access-token', {
        secret: 'test_jwt_access_secret',
      });
      expect(blocklistService.addToBlocklist).toHaveBeenCalledWith(
        'token-to-block-jti',
        expect.any(Number),
      );
    });

    it('should ignore errors when verifying invalid accessToken', async () => {
      (repository.findOne as jest.Mock).mockResolvedValue(targetEmployee);
      (repository.update as jest.Mock).mockResolvedValue({ affected: 1 });
      jwtService.verify.mockImplementation(() => {
        throw new Error('invalid token');
      });

      await expect(
        service.blockUser(2, adminPayload, 'corrupt-token'),
      ).resolves.not.toThrow();

      expect(blocklistService.addToBlocklist).not.toHaveBeenCalled();
    });
  });
});
