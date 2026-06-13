import {
    IsArray,
    IsBoolean,
    IsEnum,
    IsInt,
    IsISO8601,
    IsOptional,
    IsString,
    MaxLength,
    Min,
    MinLength,
    ValidateIf,
} from 'class-validator';
import {
    ReminderFrequency,
    RepeatUnit,
    ReminderBeforeUnit,
} from '../entities/reminder.entity';

export class CreateReminderDto {
    @IsString()
    @MaxLength(100, { message: 'Subject length cannot be more than 100' })
    @MinLength(1, { message: 'Subject length must at least be 1' })
    subject: string;

    @IsOptional()
    @IsISO8601({}, { message: 'Start date must be a valid ISO date string' })
    startDate: string;

    @IsEnum(ReminderFrequency)
    frequency: ReminderFrequency;

    // Only required when frequency = CUSTOM
    @ValidateIf(dto => dto.frequency === ReminderFrequency.CUSTOM)
    @IsInt()
    @Min(1)
    repeatEvery?: number;

    @ValidateIf(dto => dto.frequency === ReminderFrequency.CUSTOM)
    @IsEnum(RepeatUnit)
    repeatUnit?: RepeatUnit;

    @IsOptional()
    @IsBoolean()
    remindOnSameDay?: boolean = false;


    @IsOptional()
    @IsInt()
    remindBeforeValue?: number;

    @IsOptional()
    @IsEnum(ReminderBeforeUnit)
    remindBeforeUnit?: ReminderBeforeUnit;

    @IsOptional()
    sendTo?: {
        emails?: string[];
        cc?: string[],
        bcc?: string[],
        slackChannels?: string[];
    };

    @IsArray()
    @IsOptional()
    @IsString({ each: true })
    notifyTo: string[];
}
