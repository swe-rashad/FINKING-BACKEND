import { IsEmail, IsOptional } from 'class-validator';
import { GetTransactionsDto } from './get-transactions.dto';

export class ExportTransactionsDto extends GetTransactionsDto {
  @IsOptional()
  @IsEmail()
  email?: string;
}
