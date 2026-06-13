import { PartialType } from '@nestjs/mapped-types';
import { ActivityFilterDto } from './activity-filter.dto';
import { IsIn, IsString } from 'class-validator';

export class ExportActivityFilterDto extends PartialType(ActivityFilterDto) {
    @IsString()
    @IsIn(['pdf', 'excel'])
    type: string;
}
