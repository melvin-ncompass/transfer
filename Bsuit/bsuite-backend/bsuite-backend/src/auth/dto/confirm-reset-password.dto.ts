import { ApiProperty } from "@nestjs/swagger";
import { IsStrongPassword } from "class-validator";

export class ConfirmResetPasswordDto {
    @IsStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
    })
    @ApiProperty({
        example: "NewPassword123!"
    })
    password: string
}
