import { IsIn, IsISO8601, IsNotEmpty } from 'class-validator';

export class ExportTdsDto {

    @IsISO8601()
    @IsNotEmpty()
    fromDate: string;

    @IsISO8601()
    @IsNotEmpty()
    toDate: string;

    @IsIn(['pdf', 'excel'])
    exportType: 'pdf' | 'excel';
}
