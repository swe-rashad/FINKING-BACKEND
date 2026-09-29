import { HttpException } from '@nestjs/common';

export function ensure(
  condition: unknown,
  exception: HttpException | (() => HttpException),
): asserts condition {
  if (!condition) {
    throw typeof exception === 'function' ? exception() : exception;
  }
}
