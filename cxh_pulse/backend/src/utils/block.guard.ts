import { CanActivate, ForbiddenException } from '@nestjs/common';

export class BlockAllGuard implements CanActivate {
  canActivate(): boolean {
    console.warn('AuthGuard not available — blocking access.');
    throw new ForbiddenException('Authentication system unavailable.');
  }
}