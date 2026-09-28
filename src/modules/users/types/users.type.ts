export const UserStatusEnum = {
  Active: 'active',
  Blocked: 'blocked',
  ForceChangePassword: 'forceChangePassword',
} as const;

export const UsersRoles = {
  Admin: 'admin',
  Employee: 'employee',
  Customer: 'customer'
} as const;

export type UserStatusEnumType =
  (typeof UserStatusEnum)[keyof typeof UserStatusEnum];

export type UserRolesEnumType = (typeof UsersRoles)[keyof typeof UsersRoles];