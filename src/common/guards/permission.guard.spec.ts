import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permission.guard';
import { UsersRoles } from '@/modules/users/types/users.type';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: jest.Mocked<Partial<Reflector>>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    };
    guard = new PermissionsGuard(reflector as Reflector);
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

  it('should allow access if no permissions are required', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);
    const context = createMockContext({
      role: UsersRoles.Employee,
      permissions: [],
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access if user is missing in request', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['users:read']);
    const context = createMockContext(undefined);

    expect(guard.canActivate(context)).toBe(false);
  });

  it('should allow access if user is Admin regardless of permissions', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
      'users:delete',
    ]);
    const context = createMockContext({
      role: UsersRoles.Admin,
      permissions: [],
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access if user is Customer regardless of permissions', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
      'transactions:read',
    ]);
    const context = createMockContext({
      role: UsersRoles.Customer,
      permissions: [],
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access if employee has all required permissions', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
      'users:read',
      'transactions:read',
    ]);
    const context = createMockContext({
      role: UsersRoles.Employee,
      permissions: ['users:read', 'transactions:read', 'merchant:read'],
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access if employee is missing at least one required permission', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
      'users:read',
      'users:delete',
    ]);
    const context = createMockContext({
      role: UsersRoles.Employee,
      permissions: ['users:read'],
    });

    expect(guard.canActivate(context)).toBe(false);
  });

  it('should deny access if employee permissions are null or undefined', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['users:read']);
    const context = createMockContext({
      role: UsersRoles.Employee,
      permissions: null,
    });

    expect(guard.canActivate(context)).toBe(false);
  });
});
