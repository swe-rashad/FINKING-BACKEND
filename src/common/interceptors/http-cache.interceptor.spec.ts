import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CACHE_TTL_METADATA } from '@nestjs/cache-manager';
import { HttpCacheInterceptor } from './http-cache.interceptor';
import { JwtTokenTypeEnum } from '@/modules/auth/types/auth.type';
import type { JwtPayload } from '@/modules/auth/types/auth.type';

describe('HttpCacheInterceptor', () => {
  const url =
    '/statistics/total-revenue?startDate=2025-01-01&endDate=2025-01-31';

  const merchantA: JwtPayload = {
    jti: 'merchant-a',
    sub: 1,
    email: 'a@merchant.com',
    role: 'admin',
    merchantId: 10,
    type: JwtTokenTypeEnum.Access,
  };

  let interceptor: HttpCacheInterceptor;
  let reflector: { get: jest.Mock };

  const createContext = (
    user?: JwtPayload,
    method = 'GET',
    requestUrl = url,
  ): ExecutionContext =>
    ({
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
      getArgByIndex: () => ({
        user,
        method,
        originalUrl: requestUrl,
        url: requestUrl,
      }),
      switchToHttp: () => ({
        getRequest: () => ({
          user,
          method,
          originalUrl: requestUrl,
          url: requestUrl,
        }),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = {
      get: jest.fn((metadataKey: string) =>
        metadataKey === CACHE_TTL_METADATA ? 3_600_000 : undefined,
      ),
    };

    interceptor = new HttpCacheInterceptor({ get: jest.fn(), set: jest.fn() }, {
      get: reflector.get,
    } as unknown as Reflector);

    (
      interceptor as unknown as {
        httpAdapterHost: {
          httpAdapter: {
            getRequestUrl: (request: { originalUrl?: string }) => string;
            getRequestMethod: () => string;
          };
        };
      }
    ).httpAdapterHost = {
      httpAdapter: {
        getRequestUrl: (request) => request.originalUrl ?? '',
        getRequestMethod: () => 'GET',
      },
    };
  });

  it('should prefix the default url key with the authenticated merchant', async () => {
    const key = await interceptor['trackBy'](createContext(merchantA));

    expect(key).toBe(`merchant:10:${url}`);
  });

  it('should isolate cache keys by merchant', async () => {
    const merchantB = { ...merchantA, merchantId: 20 };
    const keyA = await interceptor['trackBy'](createContext(merchantA));
    const keyB = await interceptor['trackBy'](createContext(merchantB));

    expect(keyA).not.toEqual(keyB);
  });

  it('should keep nest url semantics for different filters', async () => {
    const otherUrl =
      '/statistics/total-revenue?startDate=2025-02-01&endDate=2025-02-28';
    const keyA = await interceptor['trackBy'](
      createContext(merchantA, 'GET', url),
    );
    const keyB = await interceptor['trackBy'](
      createContext(merchantA, 'GET', otherUrl),
    );

    expect(keyA).not.toEqual(keyB);
  });

  it('should not cache when the route has no ttl', async () => {
    reflector.get.mockReturnValue(undefined);

    const key = await interceptor['trackBy'](createContext(merchantA));

    expect(key).toBeUndefined();
  });

  it('should not cache when merchant scope is missing', async () => {
    const key = await interceptor['trackBy'](
      createContext({ ...merchantA, merchantId: null }),
    );

    expect(key).toBeUndefined();
  });
});
