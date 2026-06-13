import { PartialType } from '@nestjs/mapped-types';
import { CreateAccountDataDto } from './create-account.dto';

export class UpdateAccountDataDto extends PartialType(CreateAccountDataDto){}
