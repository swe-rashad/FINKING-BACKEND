import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { MerchantsService } from './merchants.service';
import { Merchant } from './entities/merchant.entity';
import { MerchantStatusEnum } from './types/merchants.type';
import { UsersRoles } from '@/modules/users/types/users.type';
import { MerchantNotFoundException } from './exceptions/merchantNotFound.exception';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { UpdateMerchantDto } from './dto/update-merchant.dto';
import type { JwtPayload } from '@/modules/auth/types/auth.type';

describe('MerchantsService', () => {
  let service: MerchantsService;
  let repository: jest.Mocked<Partial<Repository<Merchant>>>;

  const mockMerchant: Merchant = {
    id: 1,
    merchantName: 'Test Merchant',
    email: 'test@merchant.com',
    status: MerchantStatusEnum.OtpActivation,
    verificated: false,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    users: [],
  };

  beforeEach(async () => {
    repository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MerchantsService,
        {
          provide: getRepositoryToken(Merchant),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<MerchantsService>(MerchantsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findMerchantByName', () => {
    it('should return a merchant if found by name', async () => {
      (repository.findOne as jest.Mock).mockResolvedValue(mockMerchant);

      const result = await service.findMerchantByName('Test Merchant');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { merchantName: 'Test Merchant' },
        relations: { users: true },
      });
      expect(result).toEqual(mockMerchant);
    });

    it('should return null if merchant is not found by name', async () => {
      (repository.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.findMerchantByName('Nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findMerchantById', () => {
    it('should return a merchant if found by id', async () => {
      (repository.findOne as jest.Mock).mockResolvedValue(mockMerchant);

      const result = await service.findMerchantById(1);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: { users: true },
      });
      expect(result).toEqual(mockMerchant);
    });

    it('should return null if merchant not found by id', async () => {
      (repository.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.findMerchantById(999);

      expect(result).toBeNull();
    });
  });

  describe('getMerchantById', () => {
    it('should return a merchant when found by id', async () => {
      (repository.findOne as jest.Mock).mockResolvedValue(mockMerchant);

      const result = await service.getMerchantById(1);

      expect(result).toEqual(mockMerchant);
    });

    it('should throw MerchantNotFoundException when merchant is not found', async () => {
      (repository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.getMerchantById(999)).rejects.toThrow(
        MerchantNotFoundException,
      );
    });
  });

  describe('createMerchant', () => {
    const createDto: CreateMerchantDto = {
      merchantName: 'New Merchant',
      email: 'new@merchant.com',
    };

    it('should throw ConflictException if merchant name already exists', async () => {
      (repository.findOne as jest.Mock).mockResolvedValue(mockMerchant);

      await expect(service.createMerchant(createDto)).rejects.toThrow(
        ConflictException,
      );
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('should create new merchant successfully', async () => {
      (repository.findOne as jest.Mock).mockResolvedValue(null);
      (repository.create as jest.Mock).mockReturnValue({
        ...createDto,
        status: MerchantStatusEnum.OtpActivation,
        verificated: false,
      });
      (repository.save as jest.Mock).mockImplementation((entity) =>
        Promise.resolve({
          id: 2,
          ...entity,
        }),
      );

      const result = await service.createMerchant(createDto);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { merchantName: createDto.merchantName },
        relations: { users: true },
      });
      expect(repository.create).toHaveBeenCalledWith({
        merchantName: createDto.merchantName,
        email: createDto.email,
        status: MerchantStatusEnum.OtpActivation,
        verificated: false,
      });
      expect(repository.save).toHaveBeenCalled();
      expect(result.id).toBe(2);
    });
  });

  describe('getCurrentMerchant', () => {
    const jwtPayload: JwtPayload = {
      jti: 'test-jti-1',
      sub: 1,
      email: 'test@merchant.com',
      merchantId: 1,
      merchantName: 'Test Merchant',
      role: UsersRoles.Admin,
      status: MerchantStatusEnum.Active,
      type: 'access',
    };

    it('should return current merchant using payload.merchantId', async () => {
      (repository.findOne as jest.Mock).mockResolvedValue(mockMerchant);

      const result = await service.getCurrentMerchant(jwtPayload);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: jwtPayload.merchantId },
        relations: { users: true },
      });
      expect(result).toEqual(mockMerchant);
    });

    it('should throw MerchantNotFoundException if merchant does not exist', async () => {
      (repository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.getCurrentMerchant(jwtPayload)).rejects.toThrow(
        MerchantNotFoundException,
      );
    });
  });

  describe('updateCurrentMerchant', () => {
    const jwtPayload: JwtPayload = {
      jti: 'test-jti-1',
      sub: 1,
      email: 'test@merchant.com',
      merchantId: 1,
      merchantName: 'Test Merchant',
      role: UsersRoles.Admin,
      status: MerchantStatusEnum.Active,
      type: 'access',
    };

    const updateDto: UpdateMerchantDto = {
      merchantName: 'Updated Name',
      email: 'updated@merchant.com',
    };

    it('should update current merchant successfully', async () => {
      const existing = { ...mockMerchant };
      (repository.findOne as jest.Mock).mockResolvedValue(existing);
      (repository.save as jest.Mock).mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      const result = await service.updateCurrentMerchant(jwtPayload, updateDto);

      expect(result.merchantName).toBe('Updated Name');
      expect(result.email).toBe('updated@merchant.com');
      expect(repository.save).toHaveBeenCalled();
    });
  });

  describe('deleteMerchant', () => {
    it('should delete a merchant by id', async () => {
      const deleteResult = { raw: [], affected: 1 };
      (repository.delete as jest.Mock).mockResolvedValue(deleteResult);

      const result = await service.deleteMerchant(1);

      expect(repository.delete).toHaveBeenCalledWith({ id: 1 });
      expect(result).toEqual(deleteResult);
    });
  });
});
