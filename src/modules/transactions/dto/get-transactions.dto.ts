import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import {
  currencyEnum,
  transactionStatusEnum,
  transactionTypeEnum,
  type CurrencyEnumType,
  type TransactionStatusEnumType,
  type TransactionTypeEnumType,
} from '@/modules/transactions/types';
import { Type } from 'class-transformer';
import { PaginationDto } from '@/common/dto/pagination.dto';

export class GetTransactionsDto extends PaginationDto {
  @IsOptional()
  @IsString()
  sender?: string;

  @IsOptional()
  @IsString()
  receiver?: string;

  @IsOptional()
  @IsEnum(currencyEnum)
  currency?: CurrencyEnumType;

  @IsOptional()
  @IsEnum(transactionTypeEnum)
  type?: TransactionTypeEnumType;

  @IsOptional()
  @IsEnum(transactionStatusEnum)
  status?: TransactionStatusEnumType;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsString()
  merchantName?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  rrn?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  operationId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  mcc?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  merchantId?: number;

  @IsOptional()
  @IsString()
  terminalId?: string;
}
