import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reminders } from './entities/reminder.entity';
import { ReminderService } from './reminder.service';
import { ReminderProcessor } from './reminder.processor';
import { User } from 'src/auth/entities/user.entity';
import { EmailService } from 'src/auth/mail.service';
import { ReminderController } from './reminder.controller';
import { DatabaseModule } from 'src/database/database.module';
import { CompanyModule } from 'src/company/company.module';
import { ActivityModule } from 'src/activity/activity.module';
import { NotificationModule } from 'src/notification/notification.module';
import { NotificationService } from 'src/notification/notification.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: process.env.REMINDER_QUEUE,
    }),
    TypeOrmModule.forFeature([User]),
    DatabaseModule,
    CompanyModule,
    ActivityModule,
    NotificationModule
  ],
  controllers: [ReminderController],
  providers: [ReminderService, ReminderProcessor, EmailService,NotificationService],
})
export class ReminderModule { }
