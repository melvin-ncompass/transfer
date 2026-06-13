import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { EmailConfig } from 'scaffolding/common/email-service/dto/email-service.dto';
import { ConfigType } from 'scaffolding/common/enum/enum';

export class BrandingDto {
  @ApiProperty({
    type: String,
    example:"#ehf",
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  fgcolor: string;

  @ApiProperty({
    type: String,
    example:"#sefn",
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  bgcolor: string;

  @ApiProperty({
    type: String,
    example:"pulse",
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  logo: string;
}

export class PathConfig {
  @ApiProperty({
    type: String,
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  storagePath: string;
}
export class ConfigDto {
  @ApiProperty({
    type: String,
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    oneOf: [
      { $ref: getSchemaPath(EmailConfig) },
      { $ref: getSchemaPath(PathConfig) },
      { $ref: getSchemaPath(BrandingDto) },
    ],
    discriminator: {
      propertyName: 'name',
      mapping: {
        email: getSchemaPath(EmailConfig),
        path: getSchemaPath(PathConfig),
        branding: getSchemaPath(BrandingDto),
      },
    },
    description: 'The specific configuration details based on the "name" field.[ EmailConfig or PathConfig or BrandingDto or Object(default) ]'
  })
  @ValidateNested()
  @Type((obj) => {
    switch (obj?.object?.name) {
      case ConfigType.EMAIL:
        return EmailConfig;
      case ConfigType.PATH:
        return PathConfig;
      case ConfigType.BRANDING:
        return BrandingDto;
      default:
        return Object; // fallback type
    }
  })
  config: EmailConfig | PathConfig | BrandingDto;
}

export class GetConfigDto {
  @ApiProperty({
    enum: ['email','path', 'branding'],
    description: "Must be either email, path or branding",
  })
  @IsEnum(ConfigType, {
    message: 'Config name must be either "email" , "path" or "branding"',
  })
  name: ConfigType;
}

