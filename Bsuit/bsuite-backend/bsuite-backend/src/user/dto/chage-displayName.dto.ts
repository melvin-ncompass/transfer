import { IsString } from "class-validator"

export class ChangeDisplayNameDto {
    @IsString()
    displayName: string
}