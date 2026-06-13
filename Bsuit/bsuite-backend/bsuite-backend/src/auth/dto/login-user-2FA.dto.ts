import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNumber, IsOptional, IsString } from "class-validator";

export class Login2FADto {

  @IsEnum(['google', 'questions'])
  @ApiProperty({
    example: 'google'
  })
  method: 'google' | 'questions'

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    example: 123456
  })
  code?: string

  @IsString()
  @IsOptional()
  @ApiProperty({
    example: 'JohnDoe'
  })
  nickName?: string

  @IsString()
  @IsOptional()
  @ApiProperty({
    example: 'blue'
  })
  color?: string

  @IsString()
  @IsOptional()
  @ApiProperty({
    example: 'Greenwood High'
  })
  schoolName?: string

}
