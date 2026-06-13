import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { AccountType } from 'src/common/enum/account-type.enum';

export class CreateGroupDataDto {
  @IsNotEmpty()
  @IsString()
  groupName: string;

  @IsNotEmpty()
  @IsEnum(AccountType)
  groupType: AccountType;
}
