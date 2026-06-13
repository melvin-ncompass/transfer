import { Type } from "class-transformer";
import {
  IsNotEmpty,
  IsArray,
  IsNumber,
} from "class-validator";

export class SyncRoleUsersDto {
  @IsNumber()
  @IsNotEmpty()
  roleId: number;

  @IsArray()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  userIds: number[];
}
