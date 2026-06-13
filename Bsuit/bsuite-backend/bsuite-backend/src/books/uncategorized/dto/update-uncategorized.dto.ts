import { PartialType } from '@nestjs/mapped-types';
import { CreateUncategorizedDto } from './create-uncategorized.dto';

export class UpdateUncategorizedDto extends PartialType(CreateUncategorizedDto) {}
