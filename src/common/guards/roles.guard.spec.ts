import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UsersRoles } from '@/modules/users/types/users.type';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Partial<Reflector>>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    };
    guard = new RolesGuard(reflector as Reflector);
  });

  const createMockContext = (user?: any): ExecutionContext => {
    return {
      getHandler: () => () => {},
      getClass: () => class {},
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  };

  it('should allow access if no roles are required', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);
    const context = createMockContext({ role: UsersRoles.Employee });

    expect(guard.canActivate(context)).toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
      expect.any(Function),
      expect.any(Function),
    ]);
  });

  it('should deny access if user is not present in request', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
      UsersRoles.Employee,
    ]);
    const context = createMockContext(undefined);

    expect(guard.canActivate(context)).toBe(false);
  });

  it('should always allow access if user is Admin', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
      UsersRoles.Employee,
    ]);
    const context = createMockContext({ role: UsersRoles.Admin });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access if user role matches one of required roles', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
      UsersRoles.Employee,
      UsersRoles.Customer,
    ]);
    const context = createMockContext({ role: UsersRoles.Employee });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access if user role is not in required roles', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
      UsersRoles.Customer,
    ]);
    const context = createMockContext({ role: UsersRoles.Employee });

    expect(guard.canActivate(context)).toBe(false);
  });
});
