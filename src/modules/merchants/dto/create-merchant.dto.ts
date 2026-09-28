import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import type { MerchantStatusEnumType } from '../types/merchants.type';
import { MerchantStatusEnum } from '../types/merchants.type';

export class CreateMerchantDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  merchantName: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(MerchantStatusEnum)
  status?: MerchantStatusEnumType;
}
