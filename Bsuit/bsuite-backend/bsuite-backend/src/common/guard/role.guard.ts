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
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector, private dataSource: DataSource) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user: User = request.user;

    if (!user) return false;

    // Fetch user roles directly from UserRole table
    const userRoles = await this.dataSource
      .getRepository(UserRole)
      .createQueryBuilder('userRole')
      .leftJoinAndSelect('userRole.role', 'role')
      .where('userRole.user_id = :userId', { userId: user.id })
      .getMany();

    // Extract role names
    const roleNames = userRoles.map(ur => ur.role.roleName);

    // Check if user has any of the required roles
    const hasRole = requiredRoles.some(role => roleNames.includes(role));

    if (!hasRole) {
      throw new ForbiddenException('Permission denied.');
    }

    return true;
  }
}
