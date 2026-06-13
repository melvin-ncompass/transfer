// import {
//   IsString,
//   IsNotEmpty,
//   IsOptional,
//   IsDate,
//   IsArray,
//   ArrayNotEmpty,
//   IsUUID,
//   ArrayUnique,
// } from 'class-validator';
// import { Type } from 'class-transformer';

// export class CreateLeavePlanDto {
//   @IsString()
//   @IsNotEmpty()
//   name: string;

//   @IsString()
//   @IsNotEmpty()
//   leaveCalendar: string;

//   @IsOptional()
//   @IsDate()
//   @Type(() => Date)
//   calendarMonth?: Date;

//   @IsArray()
//   @ArrayNotEmpty({ message: 'At least one leave must be provided' })
//   @ArrayUnique({ message: 'Leave IDs must be unique' })
//   @IsUUID('4', { each: true })
//   leaves: string[];
// }
