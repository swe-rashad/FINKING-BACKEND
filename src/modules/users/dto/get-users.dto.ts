import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '@/common/dto/pagination.dto';
import {
  UsersRoles,
  UserStatusEnum,
  type UserRolesEnumType,
  type UserStatusEnumType,
} from '../types/users.type';

export class GetUsersDto extends PaginationDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsEnum(UsersRoles)
  role?: UserRolesEnumType;

  @IsOptional()
  @IsEnum(UserStatusEnum)
  status?: UserStatusEnumType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  merchantId?: number;
}
