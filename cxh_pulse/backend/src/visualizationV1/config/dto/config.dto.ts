import { IsNotEmpty, IsString, IsNumber, IsOptional} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpsertConfigDto {
    // @IsString({ message: 'Parameter name must be a string' })
    // @IsNotEmpty({ message: 'Parameter name is required' })
    // parameterName: string 
    @ApiProperty({
        type:String
    })
    @IsString()
    name:string

    @ApiPropertyOptional({
        type:Number
    })
    @IsOptional()
    @IsNumber({},{message:'Threshold value must be a number'})
    @IsNotEmpty({message:"Threshold value cannot be empty"})
    temperatureThreshold:number

    @ApiPropertyOptional({
        type:Number
    })
    @IsOptional()
    @IsNumber({},{message:'Threshold value must be a number'})
    @IsNotEmpty({message:"Threshold value cannot be empty"})
    precipitationThreshold:number

    // @IsOptional()
    // @IsString()
    // description:string
}

// export class UpdateConfigDto {
//     @IsOptional()
//     @IsString({ message: 'Parameter name must be a string' })
//     @IsNotEmpty({ message: 'Parameter name is required' })
//     parameterName: string

//     @IsOptional()
//     @IsNumber({},{message:'Threshold value must be a number'})
//     @IsNotEmpty({message:"Threshold value cannot be empty"})
//     thresholdValue:number

//     @IsOptional()
//     @IsString({message:"Description must be a string"})
//     description:string
// }