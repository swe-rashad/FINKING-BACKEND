import {
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { BlocklistService } from '../services/blocklist.service';
import type { JwtPayload } from '@/modules/auth/types/auth.type';
import { UsersService } from '@/modules/users/users.service';
import { UserStatusEnum } from '@/modules/users/types/users.type';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    private readonly blocklistService: BlocklistService,
    @Optional()
    @Inject(UsersService)
    private readonly usersService?: UsersService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const isValid = await super.canActivate(context);
    if (!isValid) return false;

    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload;

    if (user?.jti) {
      const blocked = await this.blocklistService.isBlocked(user.jti);
      if (blocked) {
        throw new UnauthorizedException('Token has been revoked');
      }
    }

    if (user?.status === UserStatusEnum.Blocked) {
      throw new ForbiddenException('Your account has been blocked');
    }

    if (user?.sub && this.usersService) {
      const dbUser = await this.usersService
        .getUserDetail(user.sub)
        .catch(() => null);
      if (dbUser && dbUser.status === UserStatusEnum.Blocked) {
        throw new ForbiddenException('Your account has been blocked');
      }
    }

    return true;
  }
}
