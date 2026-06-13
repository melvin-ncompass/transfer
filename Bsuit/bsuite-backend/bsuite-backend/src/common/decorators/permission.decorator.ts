import { SetMetadata } from '@nestjs/common';

export type PermissionCheckMode = 'AND' | 'OR';

export const CheckPermissions  = (
  permissions: string | string[],
  mode: PermissionCheckMode = 'AND',
) => {
  // normalize to array
  const permsArray = Array.isArray(permissions) ? permissions : [permissions];
  return SetMetadata('permissions', { permissions: permsArray, mode });
};

// @CheckPermissions('view_invoice')
// @CheckPermissions(['view_invoice', 'view_bill'])         --> AND
// @CheckPermissions(['view_invoice', 'view_bill'], 'OR')   --> OR