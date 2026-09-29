import { ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtPayload, JwtTokenTypeEnum } from '@/modules/auth/types/auth.type';

function getParamDecoratorFactory(
  decorator: (...args: unknown[]) => ParameterDecorator,
) {
  class TestController {
    testMethod(@decorator() _user: unknown) {}
  }

  const metadata = Reflect.getMetadata(
    ROUTE_ARGS_METADATA,
    TestController,
    'testMethod',
  );
  const key = Object.keys(metadata)[0];
  return metadata[key].factory;
}

describe('CurrentUser decorator', () => {
  it('should extract user from the request', () => {
    const factory = getParamDecoratorFactory(CurrentUser);

    const mockPayload: JwtPayload = {
      jti: 'test-jti-1',
      sub: 1,
      email: 'user@example.com',
      role: 'admin',
      type: JwtTokenTypeEnum.Access,
    };

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: mockPayload,
        }),
      }),
    } as unknown as ExecutionContext;

    const result = factory(undefined, mockContext);

    expect(result).toEqual(mockPayload);
  });

  it('should return undefined if user is not attached to request', () => {
    const factory = getParamDecoratorFactory(CurrentUser);

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
    } as unknown as ExecutionContext;

    const result = factory(undefined, mockContext);

    expect(result).toBeUndefined();
  });
});
