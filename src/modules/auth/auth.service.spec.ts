import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { Merchant } from '@/modules/merchants/entities/merchant.entity';
import { UsersService } from '@/modules/users/users.service';
import { User } from '@/modules/users/entities/users.entity';
import { UsersRoles, UserStatusEnum } from '@/modules/users/types/users.type';
import {
  JwtTokenTypeEnum,
  type JwtPayload,
  type SignInPayload,
} from './types/auth.type';
import { SignUpDto } from './dto/sign-up.dto';
import { MerchantStatusEnum } from '@/modules/merchants/types/merchants.type';
import { BlocklistService } from '@/common/services/blocklist.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: jest.Mocked<Partial<UsersService>>;
  let jwtService: jest.Mocked<Partial<JwtService>>;
  let configService: jest.Mocked<Partial<ConfigService>>;
  let dataSource: jest.Mocked<Partial<DataSource>>;
  let blocklistService: { addToBlocklist: jest.Mock; isBlocked: jest.Mock };

  const mockMerchant: Merchant = {
    id: 1,
    merchantName: 'Test Merchant',
    email: 'test@merchant.com',
    status: MerchantStatusEnum.Active,
    verificated: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    users: [],
  };

  const mockUser: User = {
    id: 2,
    name: 'Jane',
    lastname: 'Employee',
    email: 'jane@user.com',
    password: 'hashedUserPassword',
    role: UsersRoles.Employee,
    status: UserStatusEnum.Active,
    merchantId: 1,
    verificated: true,
    permissions: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    merchant: mockMerchant,
  };

  const mockManager = {
    getRepository: jest.fn((entity) => {
      if (entity === Merchant) {
        return {
          findOne: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockReturnValue(mockMerchant),
          save: jest.fn().mockResolvedValue(mockMerchant),
        };
      }
      return {
        create: jest.fn().mockReturnValue({ ...mockUser, role: UsersRoles.Admin }),
        save: jest.fn().mockResolvedValue({ ...mockUser, role: UsersRoles.Admin }),
      };
    }),
  };

  beforeEach(async () => {
    usersService = {
      findUserByEmail: jest.fn(),
      createAdminUser: jest.fn(),
    };

    jwtService = {
      signAsync: jest.fn(),
    };

    configService = {
      get: jest.fn((key: string) => {
        if (key === 'refreshTokenExpireIn') return '7d';
        if (key === 'jwtRefreshSecret') return 'refresh_secret_key';
        return null;
      }),
    };

    dataSource = {
      transaction: jest.fn((cb: any) => cb(mockManager)),
    };

    blocklistService = {
      addToBlocklist: jest.fn().mockResolvedValue(undefined),
      isBlocked: jest.fn().mockResolvedValue(false),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: usersService,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
        {
          provide: BlocklistService,
          useValue: blocklistService,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signIn', () => {
    const payload: SignInPayload = {
      email: 'jane@user.com',
      password: 'correct_password',
    };

    it('should throw UnauthorizedException if user email is not found', async () => {
      (usersService.findUserByEmail as jest.Mock).mockResolvedValue(null);

      await expect(authService.signIn(payload)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      (usersService.findUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.signIn(payload)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );
    });

    it('should throw ForbiddenException if user status is Blocked', async () => {
      const blockedUser = { ...mockUser, status: UserStatusEnum.Blocked };
      (usersService.findUserByEmail as jest.Mock).mockResolvedValue(blockedUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(authService.signIn(payload)).rejects.toThrow(
        new ForbiddenException('Your account has been blocked'),
      );
    });

    it('should throw ForbiddenException if user status is ForceChangePassword', async () => {
      const forceChangeUser = {
        ...mockUser,
        status: UserStatusEnum.ForceChangePassword,
      };
      (usersService.findUserByEmail as jest.Mock).mockResolvedValue(forceChangeUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(authService.signIn(payload)).rejects.toThrow(
        new ForbiddenException('You must change your password before continuing'),
      );
    });

    it('should return accessToken and refreshToken when user credentials are valid', async () => {
      (usersService.findUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwtService.signAsync as jest.Mock)
        .mockResolvedValueOnce('user_access_token')
        .mockResolvedValueOnce('user_refresh_token');

      const result = await authService.signIn(payload);

      expect(result).toEqual({
        accessToken: 'user_access_token',
        refreshToken: 'user_refresh_token',
      });
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: mockUser.id,
          email: mockUser.email,
          role: mockUser.role,
          type: JwtTokenTypeEnum.Access,
        }),
      );
    });
  });

  describe('signUp', () => {
    const signUpDto: SignUpDto = {
      merchantName: 'New Merchant',
      name: 'Jane',
      lastname: 'Doe',
      email: 'new@merchant.com',
      password: 'password123',
    };

    it('should throw ConflictException if user with email already exists', async () => {
      (usersService.findUserByEmail as jest.Mock).mockResolvedValue(mockUser);

      await expect(authService.signUp(signUpDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should create merchant and admin user in transaction and return auth tokens', async () => {
      (usersService.findUserByEmail as jest.Mock).mockResolvedValue(null);
      (jwtService.signAsync as jest.Mock)
        .mockResolvedValueOnce('new_access_token')
        .mockResolvedValueOnce('new_refresh_token');

      const result = await authService.signUp(signUpDto);

      expect(dataSource.transaction).toHaveBeenCalled();
      expect(result).toEqual({
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
      });
    });
  });

  describe('refreshToken', () => {
    const validRefreshPayload: JwtPayload = {
      jti: 'test-jti-2',
      sub: 2,
      email: 'jane@user.com',
      merchantId: 1,
      merchantName: 'Test Merchant',
      role: UsersRoles.Employee,
      status: UserStatusEnum.Active,
      type: JwtTokenTypeEnum.Refresh,
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    it('should throw UnauthorizedException if token type is not refresh', async () => {
      const invalidPayload = {
        ...validRefreshPayload,
        type: JwtTokenTypeEnum.Access,
      };

      await expect(authService.refreshToken(invalidPayload)).rejects.toThrow(
        new UnauthorizedException('Invalid token type'),
      );
    });

    it('should throw UnauthorizedException if refresh token is revoked in blocklist', async () => {
      blocklistService.isBlocked.mockResolvedValue(true);

      await expect(
        authService.refreshToken(validRefreshPayload),
      ).rejects.toThrow(
        new UnauthorizedException('Refresh token has been revoked'),
      );

      expect(blocklistService.isBlocked).toHaveBeenCalledWith('test-jti-2');
    });

    it('should throw UnauthorizedException if user is not found', async () => {
      blocklistService.isBlocked.mockResolvedValue(false);
      (usersService.findUserByEmail as jest.Mock).mockResolvedValue(null);

      await expect(
        authService.refreshToken(validRefreshPayload),
      ).rejects.toThrow(new UnauthorizedException('User not found'));
    });

    it('should throw ForbiddenException if user status is Blocked', async () => {
      blocklistService.isBlocked.mockResolvedValue(false);
      const blockedUser = { ...mockUser, status: UserStatusEnum.Blocked };
      (usersService.findUserByEmail as jest.Mock).mockResolvedValue(blockedUser);

      await expect(
        authService.refreshToken(validRefreshPayload),
      ).rejects.toThrow(
        new ForbiddenException('Your account has been blocked'),
      );
    });

    it('should invalidate old refresh token and return new tokens (rotation)', async () => {
      blocklistService.isBlocked.mockResolvedValue(false);
      (usersService.findUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      (jwtService.signAsync as jest.Mock)
        .mockResolvedValueOnce('user_fresh_access_token')
        .mockResolvedValueOnce('user_fresh_refresh_token');

      const result = await authService.refreshToken(validRefreshPayload);

      expect(blocklistService.addToBlocklist).toHaveBeenCalledWith(
        'test-jti-2',
        expect.any(Number),
      );
      expect(result).toEqual({
        accessToken: 'user_fresh_access_token',
        refreshToken: 'user_fresh_refresh_token',
      });
    });

    it('should fallback to default ttl when exp is missing on refresh payload', async () => {
      const payloadWithoutExp = { ...validRefreshPayload, exp: undefined };
      blocklistService.isBlocked.mockResolvedValue(false);
      (usersService.findUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      (jwtService.signAsync as jest.Mock)
        .mockResolvedValueOnce('user_fresh_access_token')
        .mockResolvedValueOnce('user_fresh_refresh_token');

      const result = await authService.refreshToken(payloadWithoutExp);

      expect(blocklistService.addToBlocklist).toHaveBeenCalledWith(
        'test-jti-2',
        7 * 24 * 60 * 60 * 1000,
      );
      expect(result).toEqual({
        accessToken: 'user_fresh_access_token',
        refreshToken: 'user_fresh_refresh_token',
      });
    });
  });
});
