import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsArray,
  ArrayNotEmpty,
  ArrayUnique,
  IsOptional,
  IsEnum,
  MinLength,
} from 'class-validator';
import { RequestStatus } from 'scaffolding/common/enum/enum';

export class CheckInviteDto {
  @IsString()
  inviteToken: string;
}

export class CheckRequestDto {
  @IsString()
  requestToken: string;
}

export class CreateUserFromRequestDto {
  @IsString()
  userInfoId: string;
}

export class CreateUserRequestDto {
  @IsString({ message: 'Name must be a valid string' })
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @IsEmail({}, { message: 'Email must be a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @IsOptional()
  @IsArray({ message: 'Role Names must be an array of strings' })
  @ArrayNotEmpty({ message: 'Role Names cannot be an empty array' })
  @ArrayUnique({ message: 'Role Names must not contain duplicates' })
  // @IsIn(['super admin', 'user'], {
  //   each: true,
  //   message: 'Role name must be either "super admin" or "user"',
  // })
  roleNames?: string[];

  @IsOptional()
  @IsString({ message: 'Phone must be a valid string' })
  phone?: string;
}

export class ProcessRequestDto {
  @IsString()
  requestId: string;

  @IsEnum(RequestStatus, {
    message: 'Status must be either approved or denied',
  })
  status: RequestStatus;
}
