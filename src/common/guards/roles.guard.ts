import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRolesEnumType } from '@/modules/users/types/users.type';
import { UsersRoles } from '@/modules/users/types/users.type';
import { ROLES_KEY } from '../decorators/roles.decorator';

export const ROLES_KEY_GUARD = ROLES_KEY;

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRolesEnumType[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    if (user.role === UsersRoles.Admin) {
      return true;
    }

    return requiredRoles.includes(user.role);
  }
}
