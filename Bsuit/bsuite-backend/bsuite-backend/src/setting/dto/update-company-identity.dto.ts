import { Type } from "class-transformer";
import { IsOptional, IsString, IsIn, Length, ValidateIf, IsNotEmpty, ValidateNested, IsArray } from "class-validator";
import countries from "i18n-iso-countries";

const countryCodes = Object.keys(countries.getAlpha2Codes());


export class CompanyIdentityDto {
  @IsOptional()
  @IsString()
  addressLine1?: string;

  @IsOptional()
  @IsString()
  addressLine2?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  @Length(0, 15)
  pincode?: string;

  @IsOptional()
  @IsString()
  @IsIn(countryCodes, { message: "Invalid country code" })
  country?: string;
}


export class CompanyMetaDataDto {
  @ValidateIf(o => (o.value !== undefined && o.value !== null && o.value !== "") || (o.label !== undefined && o.label !== null && o.label !== ""))
  @IsNotEmpty({ message: "Label cannot be empty if value is provided" })
  @IsString()
  label?: string;

  @ValidateIf(o => (o.label !== undefined && o.label !== null && o.label !== "") || (o.value !== undefined && o.value !== null && o.value !== ""))
  @IsNotEmpty({ message: "Value cannot be empty if label is provided" })
  @IsString()
  value?: string;
}

export class UpdateCompanyIdentityDto {
  @ValidateNested()
  @Type(() => CompanyIdentityDto)
  companyIdentity: CompanyIdentityDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CompanyMetaDataDto)
  companyMetaData: CompanyMetaDataDto[];
}
