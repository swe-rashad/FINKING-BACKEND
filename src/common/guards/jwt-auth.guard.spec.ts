import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { BlocklistService } from '../services/blocklist.service';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: jest.Mocked<Partial<Reflector>>;
  let blocklistService: { isBlocked: jest.Mock };

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    };
    blocklistService = {
      isBlocked: jest.fn().mockResolvedValue(false),
    };
    guard = new JwtAuthGuard(
      reflector as Reflector,
      blocklistService as unknown as BlocklistService,
    );
  });

  const createMockExecutionContext = (requestUser?: any): ExecutionContext => {
    const handler = () => {};
    const targetClass = class {};
    return {
      getHandler: () => handler,
      getClass: () => targetClass,
      switchToHttp: () => ({
        getRequest: () => ({
          user: requestUser,
        }),
      }),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn(),
    } as unknown as ExecutionContext;
  };

  it('should return true if route is marked as public', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(true);
    const context = createMockExecutionContext();

    const result = await guard.canActivate(context);

    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    expect(result).toBe(true);
  });

  it('should return false if super.canActivate returns false', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    const context = createMockExecutionContext();

    const superCanActivateSpy = jest
      .spyOn(Object.getPrototypeOf(JwtAuthGuard.prototype), 'canActivate')
      .mockResolvedValue(false);

    const result = await guard.canActivate(context);

    expect(result).toBe(false);
    superCanActivateSpy.mockRestore();
  });

  it('should return true if super.canActivate passes and token is not revoked', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    const context = createMockExecutionContext({ jti: 'valid-jti', sub: 1 });

    const superCanActivateSpy = jest
      .spyOn(Object.getPrototypeOf(JwtAuthGuard.prototype), 'canActivate')
      .mockResolvedValue(true);

    blocklistService.isBlocked.mockResolvedValue(false);

    const result = await guard.canActivate(context);

    expect(superCanActivateSpy).toHaveBeenCalledWith(context);
    expect(blocklistService.isBlocked).toHaveBeenCalledWith('valid-jti');
    expect(result).toBe(true);

    superCanActivateSpy.mockRestore();
  });

  it('should throw UnauthorizedException if token jti is in blocklist', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    const context = createMockExecutionContext({ jti: 'blocked-jti', sub: 1 });

    const superCanActivateSpy = jest
      .spyOn(Object.getPrototypeOf(JwtAuthGuard.prototype), 'canActivate')
      .mockResolvedValue(true);

    blocklistService.isBlocked.mockResolvedValue(true);

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Token has been revoked'),
    );

    expect(blocklistService.isBlocked).toHaveBeenCalledWith('blocked-jti');

    superCanActivateSpy.mockRestore();
  });
});
