import {
  IsArray,
  IsEmail,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  MinLength,
  ValidateIf,
} from 'class-validator';
import type {
  UserRolesEnumType,
  UserStatusEnumType,
} from '../types/users.type';
import { UsersRoles } from '../types/users.type';
import { Permissions } from '@/common/types/permission.type';
import type { PermissionType } from '@/common/types/permission.type';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;

  @IsNotEmpty()
  @MinLength(3)
  name: string;

  @IsNotEmpty()
  @MinLength(3)
  lastname: string;

  @IsOptional()
  @IsNumber()
  merchantId?: number;

  @IsOptional()
  verificated?: boolean;

  @IsOptional()
  status?: UserStatusEnumType;

  @ValidateIf((o: CreateUserDto) => o.role !== UsersRoles.Admin)
  @IsNotEmpty()
  @IsEnum(UsersRoles)
  role?: UserRolesEnumType;

  @ValidateIf((o: CreateUserDto) => o.role !== UsersRoles.Admin)
  @IsArray()
  @IsNotEmpty()
  @IsIn(Object.values(Permissions), { each: true })
  permissions?: PermissionType[];
}
