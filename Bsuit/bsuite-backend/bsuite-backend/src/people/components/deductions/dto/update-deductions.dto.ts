import { CreateDeductionsDto } from "./create-deductions.dto"
import { PartialType } from "@nestjs/mapped-types"

export class UpdateDeductionDto extends PartialType(CreateDeductionsDto) { }