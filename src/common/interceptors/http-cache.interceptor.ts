import { ExecutionContext, Injectable } from '@nestjs/common';
import { CACHE_TTL_METADATA, CacheInterceptor } from '@nestjs/cache-manager';
import type { JwtPayload } from '@/modules/auth/types/auth.type';

@Injectable()
export class HttpCacheInterceptor extends CacheInterceptor {
  protected async trackBy(
    context: ExecutionContext,
  ): Promise<string | undefined> {
    const ttl: unknown =
      this.reflector.get(CACHE_TTL_METADATA, context.getHandler()) ??
      this.reflector.get(CACHE_TTL_METADATA, context.getClass());

    if (ttl == null) {
      return undefined;
    }

    const key = await super.trackBy(context);
    if (!key) {
      return undefined;
    }

    const request = context.switchToHttp().getRequest<{ user?: JwtPayload }>();
    const merchantId = request.user?.merchantId;
    if (merchantId == null) {
      return undefined;
    }

    return `merchant:${merchantId}:${key}`;
  }
}
