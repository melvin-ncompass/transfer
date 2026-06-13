import { PartialType } from '@nestjs/mapped-types';
import { CreateGroupDataDto } from './create-group.dto';

export class UpdateGroupDataDto extends PartialType(CreateGroupDataDto) {}