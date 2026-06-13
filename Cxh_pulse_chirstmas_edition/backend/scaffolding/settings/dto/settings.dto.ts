import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { EmailConfig } from 'scaffolding/common/email-service/dto/email-service.dto';
import { ConfigType } from 'scaffolding/common/enum/enum';

export class BrandingDto {
  @IsString()
  @IsNotEmpty()
  fgcolor: string;

  @IsString()
  @IsNotEmpty()
  bgcolor: string;

  @IsString()
  @IsNotEmpty()
  logo: string;
}

export class ConfigDto {
  @IsString()
  @IsNotEmpty()
  name: string;

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
  @IsEnum(ConfigType, {
    message: 'Config name must be either "email" , "path" or "branding"',
  })
  name: ConfigType;
}

export class PathConfig {
  @IsString()
  @IsNotEmpty()
  storagePath: string;
}
