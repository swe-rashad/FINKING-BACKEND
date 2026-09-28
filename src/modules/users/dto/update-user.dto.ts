import { IsNotEmpty, IsOptional, MinLength } from 'class-validator';
import type {
  UserRolesEnumType,
  UserStatusEnumType,
} from '../types/users.type';

export class UpdateUserDto {
  @IsNotEmpty()
  @MinLength(3)
  name?: string;
  @IsNotEmpty()
  @MinLength(3)
  lastname?: string;
  @IsOptional()
  status?: UserStatusEnumType;
  @IsOptional()
  role?: UserRolesEnumType;
}
