import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  IsEmail,
  Matches,
  IsIn,
  IsNumber,
  Min,
  Max,
  IsBoolean,
  ValidateIf,
  IsEnum,
} from "class-validator";
import countries from "i18n-iso-countries";
import { EconomicTerritory } from "src/common/enum/economic-territory";

const countryCodes = Object.keys(countries.getAlpha2Codes());

export class CreateContactDto {
  @IsString()
  @ApiProperty({example: "Rahul"})
  name: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({example: "Kumar"})
  middleName?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({example: "Sharma"})
  lastName?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({example: "0659"})
  dialCode?: string;

  @IsOptional()
  @IsEmail({}, { message: "Invalid email format" })
  @ApiPropertyOptional({example: "ncompass@gmail.com"})
  email?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({example: "1234567890"})
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({example: "Plot No 12, MG Road"})
  addressLine1?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({example: "Near Metro Station"})
  addressLine2?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({example: "Bengaluru"})
  city?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({example: "Karnataka"})
  state?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({example: "123456"})
  pincode?: string;

  @IsOptional()
  @IsIn(countryCodes, { message: "Invalid country code" })
  @ApiPropertyOptional({example: "IN"})
  country?: string;

  @IsOptional()
  @Matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, {
    message: "Invalid PAN format (example: ASDFG1234S)",
  })
  @ApiPropertyOptional({example: "ABCDE1234F"})
  pan?: string;

  @IsOptional()
  @Matches(/^[0-9A-Z]{15}$/, {
    message: "GSTIN must be 15 characters alphanumeric (uppercase only)",
  })
  @ApiPropertyOptional({example: "27ABCDE1234F1Z5"})
  gstin?: string;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({example: "true"})
  isOrganization?: boolean;
  
  @IsOptional()
  @IsEnum(EconomicTerritory)
  @ApiPropertyOptional({example: "SEZ"})
  economicTerritory?: EconomicTerritory;

  @IsOptional()
  @IsNumber()
  @ValidateIf((o) => o.tdsPrefillValue !== 0 && o.tdsPrefillValue !== 100)
  @Min(0.0001, { message: "TDS must be greater than 0" })
  @Max(99.9999, { message: "TDS must be less than 100" })
  @ApiPropertyOptional({example: "25"})
  tdsPrefillValue?: number;
}
