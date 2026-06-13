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
//   Min,
//   IsNotEmpty,
//   ValidateIf,
// } from 'class-validator';
// import { Transform } from 'class-transformer';
// import { ShiftType } from '../../../../common/enum/people/shift-type.enum';

// export class UpdateShiftDto {
//   // ===== Shift (master) fields =====

//   @IsOptional()
//   @IsString()
//   @Transform(({ value }) =>
//     typeof value === 'string' ? value.trim() : value,
//   )
//   @IsNotEmpty()
//   shiftName?: string;

//   @IsOptional()
//   @IsBoolean()
//   isDefault?: boolean;

//   // ===== ShiftVersion fields =====

//   @IsOptional()
//   @IsEnum(ShiftType)
//   shiftType?: ShiftType;

//   // at least 1 working day if provided
//   @IsOptional()
//   @IsArray()
//   @ArrayMinSize(1)
//   @IsString({ each: true })
//   workingDays?: string[];

//   // only for flexible
//   @ValidateIf(o => o.shiftType === ShiftType.FLEXIBLE)
//   @IsInt()
//   @Min(1)
//   grossHours?: number;

//   // only for fixed (HH:mm or HH:mm:ss)
//   @ValidateIf(o => o.shiftType === ShiftType.FIXED)
//   @Matches(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, {
//     message: 'shiftFromTime must be in 24-hour format (HH:mm or HH:mm:ss)',
//   })
//   shiftFromTime?: string;

//   @ValidateIf(o => o.shiftType === ShiftType.FIXED)
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
//   effectiveFromDate?: string;
// }
