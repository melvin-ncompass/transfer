import { IsNotEmpty, IsString, IsNumber, IsOptional} from 'class-validator';

export class UpsertConfigDto {
    // @IsString({ message: 'Parameter name must be a string' })
    // @IsNotEmpty({ message: 'Parameter name is required' })
    // parameterName: string 
    @IsString()
    name:string

    @IsOptional()
    @IsNumber({},{message:'Threshold value must be a number'})
    @IsNotEmpty({message:"Threshold value cannot be empty"})
    temperatureThreshold:number

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