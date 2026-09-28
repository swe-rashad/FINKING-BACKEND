import { Reflector } from '@nestjs/core';
import { Public, IS_PUBLIC_KEY } from '@/common/decorators/public.decorator';

describe('Public decorator', () => {
  const reflector = new Reflector();

  it('should set isPublic metadata to true on method', () => {
    class TestController {
      @Public()
      publicMethod() { }

      protectedMethod() { }
    }

    const isPublic = reflector.get<boolean>(
      IS_PUBLIC_KEY,
      TestController.prototype.publicMethod,
    );
    const isProtected = reflector.get<boolean>(
      IS_PUBLIC_KEY,
      TestController.prototype.protectedMethod,
    );

    expect(isPublic).toBe(true);
    expect(isProtected).toBeUndefined();
  });

  it('should set isPublic metadata to true on class', () => {
    @Public()
    class TestController { }

    const isPublic = reflector.get<boolean>(IS_PUBLIC_KEY, TestController);

    expect(isPublic).toBe(true);
  });
});
