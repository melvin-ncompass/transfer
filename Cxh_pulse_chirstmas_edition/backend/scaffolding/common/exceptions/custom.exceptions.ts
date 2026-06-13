// import { HttpException, HttpStatus } from '@nestjs/common';

// export class UserNotFoundException extends HttpException {
//   constructor(userId?: number) {
//     super(
//       {
//         message: userId ? `User with ID ${userId} not found` : 'User not found',
//         error: 'USER_NOT_FOUND',
//         statusCode: HttpStatus.NOT_FOUND,
//       },
//       HttpStatus.NOT_FOUND,
//     );
//   }
// }

// export class UserAlreadyExistsException extends HttpException {
//   constructor(email: string) {
//     super(
//       {
//         message: `User with email ${email} already exists`,
//         error: 'USER_ALREADY_EXISTS',
//         statusCode: HttpStatus.CONFLICT,
//       },
//       HttpStatus.CONFLICT,
//     );
//   }
// }

// export class RoleNotFoundException extends HttpException {
//   constructor(roleId?: number) {
//     super(
//       {
//         message: roleId ? `Role with ID ${roleId} not found` : 'Role not found',
//         error: 'ROLE_NOT_FOUND',
//         statusCode: HttpStatus.NOT_FOUND,
//       },
//       HttpStatus.NOT_FOUND,
//     );
//   }
// }

// export class RoleAlreadyExistsException extends HttpException {
//   constructor(roleName: string) {
//     super(
//       {
//         message: `Role with name '${roleName}' already exists`,
//         error: 'ROLE_ALREADY_EXISTS',
//         statusCode: HttpStatus.CONFLICT,
//       },
//       HttpStatus.CONFLICT,
//     );
//   }
// }

// export class PermissionNotFoundException extends HttpException {
//   constructor(permissionId?: number) {
//     super(
//       {
//         message: permissionId
//           ? `Permission with ID ${permissionId} not found`
//           : 'Permission not found',
//         error: 'PERMISSION_NOT_FOUND',
//         statusCode: HttpStatus.NOT_FOUND,
//       },
//       HttpStatus.NOT_FOUND,
//     );
//   }
// }

// export class PermissionAlreadyExistsException extends HttpException {
//   constructor(permissionName: string) {
//     super(
//       {
//         message: `Permission with name '${permissionName}' already exists`,
//         error: 'PERMISSION_ALREADY_EXISTS',
//         statusCode: HttpStatus.CONFLICT,
//       },
//       HttpStatus.CONFLICT,
//     );
//   }
// }

// export class DatabaseConnectionException extends HttpException {
//   constructor(message: string) {
//     super(
//       {
//         message: `Database connection error: ${message}`,
//         error: 'DATABASE_CONNECTION_ERROR',
//         statusCode: HttpStatus.SERVICE_UNAVAILABLE,
//       },
//       HttpStatus.SERVICE_UNAVAILABLE,
//     );
//   }
// }

// export class InvalidCredentialsException extends HttpException {
//   constructor() {
//     super(
//       {
//         message: 'Invalid email or password',
//         error: 'INVALID_CREDENTIALS',
//         statusCode: HttpStatus.UNAUTHORIZED,
//       },
//       HttpStatus.UNAUTHORIZED,
//     );
//   }
// }

// export class RefreshTokenExpiredException extends HttpException {
//   constructor() {
//     super(
//       {
//         message: 'Refresh token has expired',
//         error: 'REFRESH_TOKEN_EXPIRED',
//         statusCode: HttpStatus.UNAUTHORIZED,
//       },
//       HttpStatus.UNAUTHORIZED,
//     );
//   }
// }

// export class InvalidRefreshTokenException extends HttpException {
//   constructor() {
//     super(
//       {
//         message: 'Invalid refresh token',
//         error: 'INVALID_REFRESH_TOKEN',
//         statusCode: HttpStatus.UNAUTHORIZED,
//       },
//       HttpStatus.UNAUTHORIZED,
//     );
//   }
// }

// export class ValidationException extends HttpException {
//   constructor(message: string, field?: string) {
//     super(
//       {
//         message,
//         error: 'VALIDATION_ERROR',
//         field,
//         statusCode: HttpStatus.BAD_REQUEST,
//       },
//       HttpStatus.BAD_REQUEST,
//     );
//   }
// }
