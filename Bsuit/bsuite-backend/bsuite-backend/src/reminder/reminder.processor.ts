import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import * as fs from 'fs';
import * as Handlebars from 'handlebars';
import { ReminderFrequency, Reminders, ReminderStatus } from './entities/reminder.entity';
import { ReminderService } from './reminder.service';
import { EmailService } from "src/auth/mail.service";
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { TenantService } from 'src/database/tenants.service';
import { BadRequestException } from '@nestjs/common';
import { NotificationService } from 'src/notification/notification.service';
import { getTemplatePath } from 'src/shared/utils';


@Processor('send_reminder')
export class ReminderProcessor extends WorkerHost {
    constructor(
        private readonly tenantService: TenantService,
        private readonly reminderService: ReminderService,
        private readonly mailerService: EmailService,
        private readonly notificationService: NotificationService,
        @InjectQueue(process.env.REMINDER_QUEUE!)
        private readonly reminderQueue: Queue,
    ) {
        super();
    }

    private async loadReminderEmailTemplate(
        subject: string,
    ) {
        const filePath = getTemplatePath("reminder-notification.html");
        const templateSource = fs.readFileSync(filePath, 'utf8');

        const template = Handlebars.compile(templateSource);

        return template({
            subject,
        });
    }

    async process(job: Job) {
        const {
            companyId,
            reminderId,
            sendTo,
            notifyTo,
            triggerDate,
        } = job.data;
        const dataSource = await this.tenantService.getTenantDataSource(companyId);
       
        
        const repository = dataSource.getRepository(Reminders)
        
        const reminder = await repository.findOne({
            where: { id: reminderId }
        });  

        if (!reminder || reminder.status !== ReminderStatus.ACTIVE) {
            return;
        }

        const hasToEmails = sendTo?.emails?.length > 0;
        const hasCc = sendTo?.cc?.length > 0;
        const hasBcc = sendTo?.bcc?.length > 0;

        if (!hasToEmails && (hasCc || hasBcc)) {
            throw new BadRequestException("CC and BCC cannot exist without email.")
        }

        if (hasToEmails) {
            const reminderEmailTemplate =
                await this.loadReminderEmailTemplate(
                    reminder.subject,
                );
            
            await this.mailerService.sendEmail({
                to: sendTo.emails,
                cc: sendTo.cc ?? [],
                bcc: sendTo.bcc ?? [],
                subject: `Reminder: ${reminder.subject}`,
                html: reminderEmailTemplate,
                attachments: null,
            });

        }


        if (sendTo?.slackChannels?.length) {
            // Send Slack
            // await this.slackService.sendReminder(...)
        }

        try {
            await this.notificationService.createNotifications(
                notifyTo.map(x => ({
                    timestamp: new Date().toISOString(),
                    companyId,
                    username: x,
                    reminderId,
                    subject: reminder.subject,
                    is_read: false,
                }))
            );
        } catch (e) {
            console.error('ERROR inside createNotifications', e);
        }

        if (reminder.frequency === ReminderFrequency.ONE_TIME) {
            reminder.status = ReminderStatus.COMPLETED;
            await repository.save(reminder);
            return;
        }

        const lastTrigger = triggerDate
            ? new Date(triggerDate)
            : new Date();

        const nextOccurrence =
            this.reminderService.calculateNextOccurrence(
                lastTrigger,
                reminder,
            );

       
        //   ONE-TIME REMINDER → STOP
  

        if (!nextOccurrence) {
            reminder.status = ReminderStatus.COMPLETED;
            await repository.save(reminder);
            return;
        }

      
        //   RE-QUEUE NEXT JOB
   

        const delay = nextOccurrence.getTime() - Date.now();

        if (delay <= 0) {
            // Safety guard (clock drift / server restart)
            return;
        }

        await this.reminderQueue.add(
            process.env.REMINDER_QUEUE!,
            {
                reminderId: reminder.id,
                subject: reminder.subject,
                sendTo: reminder.sendTo,
                notifyTo: reminder.notifyTo,
                triggerDate: nextOccurrence,
            },
            {
                delay,
                removeOnComplete: true,
            },
        );
    }
}