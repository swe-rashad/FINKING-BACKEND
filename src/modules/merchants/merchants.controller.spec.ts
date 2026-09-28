import { Test, TestingModule } from '@nestjs/testing';
import { MerchantsController } from './merchants.controller';
import { MerchantsService } from './merchants.service';
import { Merchant } from './entities/merchant.entity';
import { MerchantStatusEnum } from './types/merchants.type';
import { UsersRoles } from '@/modules/users/types/users.type';
import { UpdateMerchantDto } from './dto/update-merchant.dto';
import type { JwtPayload } from '@/modules/auth/types/auth.type';

describe('MerchantsController', () => {
  let controller: MerchantsController;
  let service: jest.Mocked<Partial<MerchantsService>>;

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

  const mockJwtPayload: JwtPayload = {
    jti: 'test-jti-1', sub: 1,
    email: 'test@merchant.com',
    merchantId: 1,
    merchantName: 'Test Merchant',
    role: UsersRoles.Admin,
    status: MerchantStatusEnum.Active,
    type: 'access',
  };

  beforeEach(async () => {
    service = {
      getCurrentMerchant: jest.fn(),
      updateCurrentMerchant: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MerchantsController],
      providers: [
        {
          provide: MerchantsService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<MerchantsController>(MerchantsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentMerchant', () => {
    it('should return current merchant', async () => {
      (service.getCurrentMerchant as jest.Mock).mockResolvedValue(mockMerchant);

      const result = await controller.getCurrentMerchant(mockJwtPayload);

      expect(service.getCurrentMerchant).toHaveBeenCalledWith(mockJwtPayload);
      expect(result).toEqual(mockMerchant);
    });
  });

  describe('updateCurrentMerchant', () => {
    it('should update and return current merchant', async () => {
      const updateDto: UpdateMerchantDto = {
        merchantName: 'Updated Merchant Name',
      };
      const updatedMerchant = { ...mockMerchant, ...updateDto };
      (service.updateCurrentMerchant as jest.Mock).mockResolvedValue(
        updatedMerchant,
      );

      const result = await controller.updateCurrentMerchant(
        mockJwtPayload,
        updateDto,
      );

      expect(service.updateCurrentMerchant).toHaveBeenCalledWith(
        mockJwtPayload,
        updateDto,
      );
      expect(result).toEqual(updatedMerchant);
    });
  });
});
