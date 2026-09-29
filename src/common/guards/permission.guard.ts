import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { PermissionType } from '../types/permission.type';
import { PERMISSIONS_KEY } from '../decorators/permission.decorator';
import { UsersRoles } from '@/modules/users/types/users.type';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<
      PermissionType[]
    >(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredPermissions?.length) {
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

    if (user.role === UsersRoles.Customer) {
      return true;
    }

    const userPermissions: PermissionType[] = user.permissions ?? [];

    return requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );
  }
}
