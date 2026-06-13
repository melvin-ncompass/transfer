import { Exclude } from "class-transformer";
import { IsString } from "class-validator";
import { User } from "src/auth/entities/user.entity";
import { Entity, PrimaryGeneratedColumn, Column, Unique, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from "typeorm";


export enum ReminderFrequency {
    ONE_TIME = 'ONE_TIME',
    DAILY = 'DAILY',
    WEEKLY = 'WEEKLY',
    EVERY_WEEKDAY = 'EVERY_WEEKDAY',
    MONTHLY = 'MONTHLY',
    QUARTERLY = 'QUARTERLY',
    YEARLY = 'YEARLY',
    CUSTOM = 'CUSTOM',
}

export enum ReminderBeforeUnit {
    DAYS = 'DAYS',
    WEEKS = 'WEEKS',
}

export enum RepeatUnit {
    DAYS = 'DAYS',
    WEEKS = 'WEEKS',
    MONTHS = 'MONTHS',
    YEARS = 'YEARS',
}

export enum ReminderStatus {
    ACTIVE = 'ACTIVE',
    PAUSED = 'PAUSED',
    COMPLETED = 'COMPLETED',
}


@Entity('biz_reminders')
export class Reminders {
    @PrimaryGeneratedColumn()
    id: number;


    @Column()
    username: string;

    @Column({ name: 'subject', length: 100 })
    subject: string;

    @Column({ name: 'start_date', type: 'timestamp' })
    startDate: Date;

    @Column({
        type: 'enum',
        enum: ReminderFrequency,
    })
    frequency: ReminderFrequency;


    @Column({ type: 'int', nullable: true })
    repeatEvery?: number;

    @Column({
        type: 'enum',
        enum: RepeatUnit,
        nullable: true,
    })
    repeatUnit?: RepeatUnit;

    @Column({ default: false })
    remindOnSameDay: boolean;

    @Column({ name: 'remind_before', type: 'int', nullable: true })
    remindBeforeValue?: number;

    @Column({
        type: 'enum',
        enum: ReminderBeforeUnit,
        nullable: true,
    })
    remindBeforeUnit?: ReminderBeforeUnit;

    @Column({ type: 'jsonb', nullable: true })
    sendTo?: {
        emails?: string[];
        cc?: string[],
        bcc?: string[],
        slackChannels?: string[];
    };

    @Column({ type: 'jsonb', nullable: true })
    notifyTo?: string[];

    @Column({
        type: 'enum',
        enum: ReminderStatus,
        default: ReminderStatus.ACTIVE,
    })
    status: ReminderStatus;

    @Exclude()
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @Exclude()
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
