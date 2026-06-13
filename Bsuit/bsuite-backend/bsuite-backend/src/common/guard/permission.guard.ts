import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { User } from 'src/auth/entities/user.entity';
import { UserRole } from 'src/rba/entities/user-role.entity';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector, private dataSource: DataSource) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permissionsMeta = this.reflector.get<{ permissions: string[], mode: 'AND' | 'OR' }>(
      'permissions',
      context.getHandler(),
    );
    if (!permissionsMeta || !permissionsMeta.permissions?.length) return true;

    const { permissions: requiredPermissions, mode } = permissionsMeta;

    const request = context.switchToHttp().getRequest();
    const user: User = request.user;

    if (!user) return false;

    // Fetch user's roles with permissions
    const userRoles = await this.dataSource
      .getRepository(UserRole)
      .createQueryBuilder('userRole')
      .leftJoinAndSelect('userRole.role', 'role')
      .leftJoinAndSelect('role.permissions', 'permission')
      .where('userRole.user_id = :userId', { userId: user.id })
      .getMany();

    // Collect all permissions
    let userPermissions = new Set<string>();
    userRoles.forEach(userRole => {
      userRole.role.permissions?.forEach(permission => {
        userPermissions.add(permission.permissionNameAbrv);
      });
    });
    // Check based on mode
    let hasPermission = false;
    if (mode === 'AND') {
      hasPermission = requiredPermissions.every(p => userPermissions.has(p));
    } else if (mode === 'OR') {
      hasPermission = requiredPermissions.some(p => userPermissions.has(p));
    }

    if (!hasPermission) {
      throw new ForbiddenException('Permission denied.');
    }

    return true;
  }
}
