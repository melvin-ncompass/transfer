// import {
//   IsArray,
//   ArrayNotEmpty,
//   IsOptional,
//   IsString,
//   IsUUID,
//   IsDateString,
//   ArrayUnique,
// } from 'class-validator';

// export class UpdateLeavePlanDto {
//   @IsOptional()
//   @IsString()
//   name?: string;

//   @IsOptional()
//   @IsString()
//   leaveCalendar?: string;

//   @IsOptional()
//   @IsDateString()
//   calendarMonth?: string; // or Date if you transform it

//   @IsOptional()
//   @IsArray()
//   @ArrayNotEmpty({ message: 'At least one leave must be provided' })
//   @ArrayUnique({ message: 'Duplicate leave IDs are not allowed' })
//   @IsUUID('4', { each: true })
//   leaves?: string[];
// }
