import { BadRequestException } from '@nestjs/common';
import { ensure } from './assertion.util';

describe('ensure', () => {
  it('should not throw when condition is truthy', () => {
    expect(() => ensure(true, new BadRequestException('Error'))).not.toThrow();
    expect(() => ensure('some value', new BadRequestException('Error'))).not.toThrow();
    expect(() => ensure(1, new BadRequestException('Error'))).not.toThrow();
  });

  it('should throw the provided exception when condition is falsy', () => {
    expect(() => ensure(false, new BadRequestException('Custom error'))).toThrow(
      BadRequestException,
    );
    expect(() => ensure(null, new BadRequestException('Custom error'))).toThrow(
      'Custom error',
    );
    expect(() => ensure(undefined, new BadRequestException('Custom error'))).toThrow(
      BadRequestException,
    );
  });

  it('should call factory function and throw exception if factory is provided', () => {
    const factory = jest.fn(() => new BadRequestException('From factory'));
    expect(() => ensure(false, factory)).toThrow('From factory');
    expect(factory).toHaveBeenCalled();
  });
});
