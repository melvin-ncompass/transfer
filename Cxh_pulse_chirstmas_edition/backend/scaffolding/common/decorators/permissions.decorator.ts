import { SetMetadata } from '@nestjs/common';
import { PermissionEnum } from '../enum/enum';

export const PERMISSIONS_KEY = 'requiredPermissions';

export const Permissions = (...permissions: PermissionEnum[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);