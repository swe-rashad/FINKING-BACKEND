import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateMerchantDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  merchantName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
