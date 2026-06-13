import { ApiProperty } from "@nestjs/swagger"
import { IsEmail, IsNumber, IsString } from "class-validator"

export class BrandingResponseDto{
    @ApiProperty({
        type: String,
        example: "Pulse"
    })
    @IsString()
    logo: string

    @ApiProperty({
        type: String,
        example: "#gtt"
    })
    @IsString()
    bgcolor: string

    @ApiProperty({
        type: String,
        example: "#jng"
    })
    @IsString()
    fgcolor: string
}

export class EmailConfigResponseDto {
  @ApiProperty({ 
    type:Boolean,
    example: false })
  secure: boolean;

  @ApiProperty({ 
    type:String,
    example: 'md-aHKBdV54lHlaWLQxhQTu3Q' })
    @IsString()
  password: string;

  @ApiProperty({ type:String,example: 'smtp.mandrillapp.com' })
  @IsString()
  smtpHost: string;

  @ApiProperty({ type:Number,example: 587 })
  @IsNumber()
  smtpPort: number;

  @ApiProperty({ type:String,example: 'pete@datakind.org' })
  @IsString()
  username: string;

  @ApiProperty({ type:String,example: 'donotreply@datakind.org' })
  @IsEmail()
  fromEmail: string;
}

export class PathConfigResponseDto {
  @ApiProperty({type:String, example: './uploads' })
  @IsString()
  storagePath: string;
}

export class PathConfigItemDto {
  @ApiProperty({ type:String,example: 'path' })
  @IsString()
  name: 'path';

  @ApiProperty({ type: ()=>PathConfigResponseDto })
  config: PathConfigResponseDto;
}
export class EmailConfigItemDto {
  @ApiProperty({ type:String,example: 'email' })
  @IsString()
  name: 'email';

  @ApiProperty({ type: ()=>EmailConfigResponseDto })
  config: EmailConfigResponseDto;
}

export class BrandingConfigItemDto {
  @ApiProperty({type:String, example: 'branding' })
  name: 'branding';

  @ApiProperty({ type:()=> BrandingResponseDto })
  config: BrandingResponseDto;
}
