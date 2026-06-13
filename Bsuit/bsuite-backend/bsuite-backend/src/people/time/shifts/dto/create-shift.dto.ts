// import {
//   IsString,
//   IsBoolean,
//   IsOptional,
//   IsEnum,
//   IsArray,
//   ArrayMinSize,
//   IsInt,
//   IsDateString,
//   Matches,
//   ValidateIf,
//   Min,
//   IsNotEmpty,
// } from 'class-validator';
// import { Transform } from 'class-transformer';
// import { ShiftType } from '../../../../common/enum/people/shift-type.enum';

// export class CreateShiftDto {
//   @IsString()
//   @Transform(({ value }) =>
//     typeof value === 'string' ? value.trim() : value,
//   )
//   @IsNotEmpty({ message: 'shiftName cannot be empty' })
//   shiftName: string;

//   @IsOptional()
//   @IsBoolean()
//   isDefault?: boolean;

//   @IsEnum(ShiftType)
//   shiftType: ShiftType;

//   // at least one working day
//   @IsArray()
//   @ArrayMinSize(1, { message: 'At least one working day is required' })
//   @IsString({ each: true })
//   workingDays: string[];

//   // only for flexible
//   @ValidateIf(o => o.shiftType === ShiftType.FLEXIBLE)
//   @IsInt()
//   @Min(1)
//   @IsNotEmpty({ message: 'grossHours is required for flexible shifts' })
//   grossHours?: number;

//   // only for fixed
//   @ValidateIf(o => o.shiftType === ShiftType.FIXED)
//   @IsNotEmpty({ message: 'shiftFromTime is required for fixed shifts' })
//   @Matches(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, {
//     message: 'shiftFromTime must be in 24-hour format (HH:mm or HH:mm:ss)',
//   })
//   shiftFromTime?: string;

//   @ValidateIf(o => o.shiftType === ShiftType.FIXED)
//   @IsNotEmpty({ message: 'shiftToTime is required for fixed shifts' })
//   @Matches(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, {
//     message: 'shiftToTime must be in 24-hour format (HH:mm or HH:mm:ss)',
//   })
//   shiftToTime?: string;

//   // only for fixed
//   @ValidateIf(o => o.shiftType === ShiftType.FIXED)
//   @IsInt()
//   @Min(0)
//   breakDuration?: number;

//   // date only (YYYY-MM-DD)
//   @IsOptional()
//   @IsDateString()
//   effectiveFromDate?: Date;
// }
