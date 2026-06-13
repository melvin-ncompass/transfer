import { IsString, IsNotEmpty } from 'class-validator';

export class CsvMappingDto {
    @IsString()
    @IsNotEmpty()
    dateKey: string;

    @IsString()
    @IsNotEmpty()
    descriptionKey: string;

    @IsString()
    @IsNotEmpty()
    debitKey: string;

    @IsString()
    @IsNotEmpty()
    creditKey: string;
}
