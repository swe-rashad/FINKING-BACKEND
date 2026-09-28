import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { JwtTokenTypeEnum, type JwtPayload } from './types/auth.type';
import { MerchantStatusEnum } from '@/modules/merchants/types/merchants.type';
import { UsersRoles } from '@/modules/users/types/users.type';

describe('AuthController', () => {
  let controller: AuthController;
  let service: jest.Mocked<Partial<AuthService>>;

  const mockTokens = {
    accessToken: 'test_access_token',
    refreshToken: 'test_refresh_token',
  };

  beforeEach(async () => {
    service = {
      signIn: jest.fn(),
      signUp: jest.fn(),
      refreshToken: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signIn', () => {
    it('should delegate signIn payload to authService.signIn', async () => {
      const signInDto: SignInDto = {
        email: 'test@merchant.com',
        password: 'password123',
      };
      (service.signIn as jest.Mock).mockResolvedValue(mockTokens);

      const result = await controller.signIn(signInDto);

      expect(service.signIn).toHaveBeenCalledWith(signInDto);
      expect(result).toEqual(mockTokens);
    });
  });

  describe('signUp', () => {
    it('should delegate signUp payload to authService.signUp', async () => {
      const signUpDto: SignUpDto = {
        merchantName: 'New Merchant',
        name: 'Jane',
        lastname: 'Doe',
        email: 'new@merchant.com',
        password: 'password123',
      };
      (service.signUp as jest.Mock).mockResolvedValue(mockTokens);

      const result = await controller.signUp(signUpDto);

      expect(service.signUp).toHaveBeenCalledWith(signUpDto);
      expect(result).toEqual(mockTokens);
    });
  });

  describe('getRefreshToken', () => {
    it('should delegate refresh token user payload to authService.refreshToken', async () => {
      const userPayload: JwtPayload = {
        jti: 'test-jti-1', sub: 1,
        email: 'test@merchant.com',
        merchantId: 1,
        merchantName: 'Test Merchant',
        role: UsersRoles.Admin,
        status: MerchantStatusEnum.Active,
        type: JwtTokenTypeEnum.Refresh,
      };
      (service.refreshToken as jest.Mock).mockResolvedValue(mockTokens);

      const result = await controller.getRefreshToken(userPayload);

      expect(service.refreshToken).toHaveBeenCalledWith(userPayload);
      expect(result).toEqual(mockTokens);
    });
  });
});
