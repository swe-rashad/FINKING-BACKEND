import { UserRolesEnumType } from '@/modules/users/types/users.type';
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: UserRolesEnumType[]) =>
  SetMetadata(ROLES_KEY, roles);
