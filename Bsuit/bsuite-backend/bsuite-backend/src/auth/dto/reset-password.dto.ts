import { ApiProperty } from "@nestjs/swagger";
import { IsEmail } from "class-validator";

export class ResetPasswordDto {
    @IsEmail()
    @ApiProperty({
        example: 'user@example.com'
    })
    email: string
}
