import { MailerService } from '@nestjs-modules/mailer';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';

@Injectable()
export class EmailService {
    constructor(
        private mailerService: MailerService,
    ) { }

    async sendEmail(options: {
        to: string | string[];
        cc?: string[];
        bcc?: string[];
        subject: string;
        html: string;
        attachments?: any;
    }) {
        try {
            console.log("entered try block")
            const message = {
                to: options.to,
                cc: options.cc?.length ? options.cc : undefined,
                bcc: options.bcc?.length ? options.bcc : undefined,
                subject: options.subject,
                html: options.html,
                attachments: options.attachments ?? null,
            };
            const emailSend = await this.mailerService.sendMail({
                ...message,
            });
    
            return emailSend;
        } catch (error) {
            console.log(error)
            throw new HttpException('Error', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}