import { IsIn, IsISO8601, IsNotEmpty } from 'class-validator';

export class ExportTrialBalanceDto {

    @IsISO8601()
    @IsNotEmpty()
    toDate: string;

    @IsIn(['pdf', 'excel'])
    exportType: 'pdf' | 'excel';
}
