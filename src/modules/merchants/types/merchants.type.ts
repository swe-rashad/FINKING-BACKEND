export const MerchantStatusEnum = {
  Active: 'active',
  Blocked: 'blocked',
  Pending: 'pending',
  OtpActivation: 'otpActivation',
} as const;

export type MerchantStatusEnumType =
  (typeof MerchantStatusEnum)[keyof typeof MerchantStatusEnum];
