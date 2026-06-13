import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleService } from 'scaffolding/user/roles/roles.service';
import { PERMISSIONS_KEY } from 'scaffolding/common/decorators/permissions.decorator';
import { PermissionEnum } from '../enum/enum';
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly roleService: RoleService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<
      PermissionEnum[]
    >(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredPermissions || requiredPermissions.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.role) {
      throw new ForbiddenException('User role not found');
    }

    const permissions = await this.roleService.getPermissionsForRole(user.role);

    const hasAll = requiredPermissions.some((perm) =>
      permissions.includes(perm as any),
    );

    if (!hasAll) {
      throw new ForbiddenException('Insufficient permissions');
    }

    console.log(
      `User ${user.userId} has required permissions: ${requiredPermissions.join(', ')}`,
    );

    return true;
  }
}
