import {
  IsNotEmpty,
  IsString,
  IsIn,
  IsInt,
  Min,
  Max,
  IsDateString,
  IsOptional,
  IsBoolean,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  ValidateIf,
} from "class-validator";

const FREQUENCY_VALUES = ["monthly", "yearly"];

function IsValidWeekdays(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: "isValidWeekdays",
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== "string") return false;
          const days = value.split(",").map((d) => d.trim());
          const validDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
          return days.every((d) => validDays.includes(d));
        },
        defaultMessage(args: ValidationArguments) {
          return "workingDays must be a c-separated list of weekdays (Mon,Tue,...,Sun)";
        },
      },
    });
  };
}

export class CreatePayScheduleDto {
  @IsNotEmpty()
  @IsString()
  @IsIn(FREQUENCY_VALUES, {
    message: 'Frequency must be either "monthly" or "yearly"',
  })
  frequency: string;

  @IsNotEmpty()
  @IsString()
  @IsValidWeekdays({
    message: "Working Days must be comma-separated weekdays like Mon,Tue,Wed",
  })
  workingDays: string;

  @IsNotEmpty({ message: "Date of Processing must be between 1 and 31" })
  @Min(1)
  @Max(31)
  dateOfProcessing: number;

  @IsNotEmpty()
  @IsDateString(
    {},
    { message: "First Pay Period must be a valid ISO date string" }
  )
  firstPayrollFrom: string;

  @IsNotEmpty()
  @IsDateString(
    {},
    { message: "Financial Year Start must be a valid ISO date string" }
  )
  financialYearStart: string;

  @IsNotEmpty()
  @IsDateString(
    {},
    { message: "Financial Year End must be a valid ISO date string" }
  )
  financialYearEnd: string;

  @IsInt({
    message: "Consider Poi From Month must be an integer between 1 and 12",
  })
  @Min(1)
  @Max(12)
  considerPoiFrom: number;

  @IsBoolean()
  isCalendarMonth?: boolean = false;

  @ValidateIf((obj) => obj.isCalendarMonth === true)
  @IsNotEmpty({
    message: "From Pay Cycle is required when calendar month is true",
  })
  @IsDateString(
    {},
    { message: "From Pay Cycle must be a valid ISO date string" }
  )
  fromPayCycle: string;

  @ValidateIf((obj) => obj.isCalendarMonth === true)
  @IsNotEmpty({
    message: "To Pay Cycle is required when calendar month is true",
  })
  @IsDateString({}, { message: "To Pay Cycle must be a valid ISO date string" })
  toPayCycle: string;
}

