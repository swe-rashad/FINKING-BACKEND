import type { UserRolesEnumType } from '@/modules/users/types/users.type';
import type { PermissionType } from '@/common/types/permission.type';

export const JwtTokenTypeEnum = {
  Access: 'access',
  Refresh: 'refresh',
} as const;

export type JwtTokenTypeEnumType =
  (typeof JwtTokenTypeEnum)[keyof typeof JwtTokenTypeEnum];

export type SignInPayload = {
  email: string;
  password: string;
};

export type SuccessAuthResponse = {
  accessToken: string;
  refreshToken: string;
};

export type JwtPayload = {
  jti: string;
  sub: number;
  email: string;
  role: UserRolesEnumType;
  status?: string;
  merchantId?: number | null;
  merchantName?: string;
  permissions?: PermissionType[] | null;
  type: JwtTokenTypeEnumType;
  exp?: number;
  iat?: number;
};
