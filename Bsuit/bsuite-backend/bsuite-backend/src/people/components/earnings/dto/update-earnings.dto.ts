import { CreateEarningsDto } from './create-earnings.dto';
import { PartialType } from '@nestjs/mapped-types';
export class UpdateEarningsDto extends PartialType(CreateEarningsDto){}