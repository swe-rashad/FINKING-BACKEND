export const Permissions = {
    UsersCreate: 'users:create',
    UsersRead: 'users:read',
    UsersUpdate: 'users:update',
    UsersDelete: 'users:delete',
    TransactionsCreate: 'transactions:create',
    TransactionsRead: 'transactions:read',
    TransactionsUpdate: 'transactions:update',
    TransactionsDelete: 'transactions:delete',
    MerchantRead: 'merchant:read',
    MerchantUpdate: 'merchant:update',
} as const;

export type PermissionType =
    (typeof Permissions)[keyof typeof Permissions];