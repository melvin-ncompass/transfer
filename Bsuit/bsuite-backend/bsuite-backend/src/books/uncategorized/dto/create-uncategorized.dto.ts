import { IsDateString, IsString, IsNumber, MaxLength } from 'class-validator';

export class CreateUncategorizedDto {
    @IsDateString()
    transactionDate: string;

    @IsString()
    @MaxLength(255, { message: 'Description length cannot be more than 255' })
    description: string;

    @IsNumber()
    debit: number;

    @IsNumber()
    credit: number;
}