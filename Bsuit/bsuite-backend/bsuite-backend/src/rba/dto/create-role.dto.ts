import { IsArray, IsNotEmpty, IsString, ArrayNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateRoleDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    roleName: string;

    @IsOptional()
    @MaxLength(400)
    description: string;

    @IsArray()
    @ArrayNotEmpty()
    @IsString({ each: true })
    permissionAbrvs: string[];
}
