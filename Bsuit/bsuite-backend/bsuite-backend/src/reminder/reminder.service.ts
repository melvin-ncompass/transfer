import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Queue } from 'bullmq';
import {
    addDays,
    addWeeks,
    addMonths,
    addYears,
} from 'date-fns';

import { Reminders, ReminderStatus } from './entities/reminder.entity';
import {
    ReminderFrequency,
    RepeatUnit,
    ReminderBeforeUnit,
} from './entities/reminder.entity';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';
import { InjectQueue } from '@nestjs/bullmq';

@Injectable()
export class ReminderService {
    constructor(
        @InjectQueue(process.env.REMINDER_QUEUE!)
        private readonly reminderQueue: Queue,
    ) { }

    async findAll(dataSource: DataSource) {
        const repository = dataSource.getRepository(Reminders)
        return await repository.find({
            order: {
                id: 'ASC',
            },
        });
    }

    async create(dto: CreateReminderDto, username: string, dataSource: DataSource, companyId: string) {
        const repository = dataSource.getRepository(Reminders);
        const startDate = new Date(dto.startDate);
        if (startDate.getTime() <= Date.now()) {
            throw new BadRequestException('Start date cannot be in past.');
        }

        const notifyUsers = new Set<string>(dto.notifyTo || []);
        notifyUsers.add(username);

        const reminder = repository.create({
            ...dto,
            username,
            startDate,
            status: ReminderStatus.ACTIVE,
            notifyTo: Array.from(notifyUsers),
        });

        const saved = await repository.save(reminder);
        await this.scheduleInitialJobs(saved, companyId);

        return {
            data: saved,
            change_of_data: {
                id: saved.id,
                module: 'Settings',
                feature: 'Reminder',
                status: 'Create'
            },
        };
    }


    async update(
        reminderId: number,
        dto: UpdateReminderDto,
        dataSource: DataSource,
        companyId: string
    ) {
        const repository = dataSource.getRepository(Reminders);
        const reminder = await this.findOne(reminderId, dataSource);

        if (dto.startDate) {
            const newStartDate = new Date(dto.startDate);
            if (newStartDate.getTime() <= Date.now()) {
                throw new BadRequestException('Start date cannot be in past.');
            }
            reminder.startDate = newStartDate;
        }


        const { startDate, ...otherFields } = dto;
        Object.assign(reminder, otherFields);

        const updated = await repository.save(reminder);

        await this.cancelJobs(reminderId);
        await this.scheduleInitialJobs(updated, companyId);

        return {
            data: updated,
            change_of_data: {
                id: updated.id,
                module: 'Settings',
                feature: 'Reminder',
                status: 'Update'
            },
        };
    }


    async duplicate(
        reminderId: number,
        dto: UpdateReminderDto,
        username: string,
        dataSource: DataSource,
        companyId: string,
    ) {
        const repository = dataSource.getRepository(Reminders);
        const original = await this.findOne(reminderId, dataSource);
        const duplicated = repository.create({
            ...original,
            ...dto,
            id: undefined,
            createdAt: undefined,
            updatedAt: undefined,
            status: ReminderStatus.ACTIVE,
            startDate: dto.startDate
                ? new Date(dto.startDate)
                : original.startDate,

            notifyTo: Array.from(
                new Set([...(original.notifyTo || []), username])
            ),
        });


        const saved = await repository.save(duplicated);


        await this.scheduleInitialJobs(saved, companyId);

        return {
            data: saved,
            change_of_data: {
                id: saved.id,
                module: 'Settings',
                feature: 'Reminder',
                status: 'Duplicate',
            },
        };
    }



    async pause(reminderId: number, dataSource: DataSource) {
        const repository = dataSource.getRepository(Reminders);
        const reminder = await this.findOne(reminderId, dataSource);

        if (reminder.status === ReminderStatus.COMPLETED) {
            throw new BadRequestException("Cannot pause completed reminder.")
        }
        if (reminder.status === ReminderStatus.PAUSED) {
            return reminder; // already paused so no db op
        }
        reminder.status = ReminderStatus.PAUSED;
        const updated = await repository.save(reminder);

        await this.cancelJobs(reminderId);
        return {
            data: updated,
            change_of_data: {
                id: updated.id,
                module: 'Settings',
                feature: 'Reminder',
                status: 'Update'
            },
        };
    }

    async resume(
        reminderId: number,
        dataSource: DataSource,
        companyId: string,
    ) {
        const repository = dataSource.getRepository(Reminders);
        const reminder = await this.findOne(reminderId, dataSource);

        reminder.status = ReminderStatus.ACTIVE;
        const updated = await repository.save(reminder);

        await this.scheduleInitialJobs(reminder, companyId);
        return {
            data: updated,
            change_of_data: {
                id: updated.id,
                module: 'Settings',
                feature: 'Reminder',
                status: 'Update'
            },
        };
    }



    async delete(reminderId: number, dataSource: DataSource) {
        const repository = dataSource.getRepository(Reminders);
        await this.findOne(reminderId, dataSource);

        await this.cancelJobs(reminderId);
        await repository.delete(reminderId);
        return {
            change_of_data: {
                id: reminderId,
                module: 'Setttings',
                feature: 'Reminder',
                status: 'Delete'
            },

        }

    }

    private async scheduleInitialJobs(reminder: Reminders, companyId: string) {
        if (reminder.status !== ReminderStatus.ACTIVE) return;

        const baseDate = reminder.startDate;

        if (reminder.remindOnSameDay) {
            await this.enqueueJob(reminder, baseDate, companyId);
        }

        if (reminder.remindBeforeValue && reminder.remindBeforeUnit) {
            const beforeDate = this.calculateRemindBeforeDate(
                baseDate,
                reminder.remindBeforeValue,
                reminder.remindBeforeUnit,
            );

            await this.enqueueJob(reminder, beforeDate, companyId);
        }

    }

    //  QUEUE HELPERS


    private async enqueueJob(reminder: Reminders, triggerDate: Date, companyId: string) {
        if (reminder.status !== ReminderStatus.ACTIVE) return;
        if (triggerDate.getTime() <= Date.now()) return;
        await this.reminderQueue.add(
            'send_reminder',
            {
                companyId,
                reminderId: reminder.id,
                subject: reminder.subject,
                startDate: reminder.startDate,
                frequency: reminder.frequency,
                repeatEvery: reminder.repeatEvery,
                repeatUnit: reminder.repeatUnit,
                sendTo: reminder.sendTo,
                notifyTo: reminder.notifyTo,
                triggerDate
            },
            {
                delay: triggerDate.getTime() - Date.now(),
                removeOnComplete: true,
            },
        );
    }

    private async cancelJobs(reminderId: number) {
        const jobs = await this.reminderQueue.getJobs([
            'delayed',
            'waiting',
            'active',
        ]);

        for (const job of jobs) {
            if (job.data?.reminderId === reminderId) {
                await job.remove();
            }
        }
    }


    //  NEXT OCCURRENCE (USED BY PROCESSOR)


    calculateNextOccurrence(
        last: Date,
        reminder: Reminders,
    ): Date | null {
        switch (reminder.frequency) {
            case ReminderFrequency.ONE_TIME:
                return null;

            case ReminderFrequency.DAILY:
                return addDays(last, 1);

            case ReminderFrequency.WEEKLY:
                return addWeeks(last, 1);

            case ReminderFrequency.EVERY_WEEKDAY:
                return this.nextWeekday(last);

            case ReminderFrequency.MONTHLY:
                return addMonths(last, 1);

            case ReminderFrequency.QUARTERLY:
                return addMonths(last, 3);

            case ReminderFrequency.YEARLY:
                return addYears(last, 1);

            case ReminderFrequency.CUSTOM:
                return this.customNext(
                    last,
                    reminder.repeatEvery,
                    reminder.repeatUnit,
                );

            default:
                return null;
        }
    }

    private customNext(
        base: Date,
        every?: number,
        unit?: RepeatUnit,
    ): Date | null {
        if (!every || !unit) return null;

        switch (unit) {
            case RepeatUnit.DAYS:
                return addDays(base, every);
            case RepeatUnit.WEEKS:
                return addWeeks(base, every);
            case RepeatUnit.MONTHS:
                return addMonths(base, every);
            case RepeatUnit.YEARS:
                return addYears(base, every);
            default:
                return null;
        }
    }


    //  REMIND BEFORE

    private calculateRemindBeforeDate(
        date: Date,
        value: number,
        unit: ReminderBeforeUnit,
    ): Date {
        switch (unit) {
            case ReminderBeforeUnit.DAYS:
                return addDays(date, -value);
            case ReminderBeforeUnit.WEEKS:
                return addWeeks(date, -value);
            default:
                return date;
        }
    }


    //  WEEKDAY HANDLER

    private nextWeekday(date: Date): Date {
        let next = addDays(date, 1);
        while (next.getDay() === 0 || next.getDay() === 6) {
            next = addDays(next, 1);
        }
        return next;
    }


    async findOne(reminderId: number, dataSource: DataSource) {
        const repository = dataSource.getRepository(Reminders);
        const reminder = await repository.findOne({ where: { id: reminderId } })
        if (!reminder) throw new NotFoundException('Reminder not found.');
        return reminder;
    }
}