import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { MerchantStatusEnum } from './types/merchants.type';
import { Merchant } from './entities/merchant.entity';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { UpdateMerchantDto } from './dto/update-merchant.dto';
import { MerchantNotFoundException } from './exceptions/merchantNotFound.exception';
import type { JwtPayload } from '@/modules/auth/types/auth.type';

@Injectable()
export class MerchantsService {
  constructor(
    @InjectRepository(Merchant)
    private readonly merchantsRepository: Repository<Merchant>,
  ) {}

  async findMerchantByName(merchantName: string): Promise<Merchant | null> {
    return await this.merchantsRepository.findOne({
      where: { merchantName },
      relations: {
        users: true,
      },
    });
  }

  async findMerchantById(id: number): Promise<Merchant | null> {
    return await this.merchantsRepository.findOne({
      where: { id },
      relations: {
        users: true,
      },
    });
  }

  async getMerchantById(id: number): Promise<Merchant> {
    const merchant = await this.findMerchantById(id);
    if (!merchant) {
      throw new MerchantNotFoundException();
    }
    return merchant;
  }

  async createMerchant(payload: CreateMerchantDto): Promise<Merchant> {
    const existing = await this.findMerchantByName(payload.merchantName);
    if (existing) {
      throw new ConflictException('Merchant with this name already exists');
    }

    const merchant = this.merchantsRepository.create({
      merchantName: payload.merchantName,
      email: payload.email,
      status: payload.status ?? MerchantStatusEnum.OtpActivation,
      verificated: false,
    });

    return await this.merchantsRepository.save(merchant);
  }

  async getCurrentMerchant(payload: JwtPayload): Promise<Merchant> {
    const merchantId = payload.merchantId;
    if (!merchantId) {
      throw new MerchantNotFoundException();
    }
    const merchant = await this.merchantsRepository.findOne({
      where: { id: merchantId },
      relations: {
        users: true,
      },
    });
    if (!merchant) {
      throw new MerchantNotFoundException();
    }
    return merchant;
  }

  async updateCurrentMerchant(
    payload: JwtPayload,
    dto: UpdateMerchantDto,
  ): Promise<Merchant> {
    const merchant = await this.getCurrentMerchant(payload);
    Object.assign(merchant, dto);
    return await this.merchantsRepository.save(merchant);
  }

  async deleteMerchant(id: number): Promise<DeleteResult> {
    return await this.merchantsRepository.delete({ id });
  }
}
