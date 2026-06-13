import { ApiProperty } from "@nestjs/swagger"
import { IsEmail, IsStrongPassword } from "class-validator"

export class LoginUserDto {

    @IsStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
    })
    @ApiProperty({
        example: 'Password123!'
    })
    password: string

    @IsEmail()
    @ApiProperty({
        example: 'user@example.com'
    })
    email: string
}
