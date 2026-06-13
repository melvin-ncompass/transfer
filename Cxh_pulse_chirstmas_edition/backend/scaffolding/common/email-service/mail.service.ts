import {
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { SettingsService } from 'scaffolding/settings/settings.service';

@Injectable()
export class MailerService {
  constructor(
    @Inject(forwardRef(() => SettingsService))
    private readonly settingsService: SettingsService,
  ) {}

  async sendMail(to: string, subject: string, html: string) {
    const config = await this.settingsService.getConfig('email');

    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.secure,
      auth: {
        user: config.fromEmail,
        pass: config.password,
      },
    });

    const fromAddress = config.fromEmailAlias || config.fromEmail;

    try {
      const info = await transporter.sendMail({
        from: fromAddress,
        to,
        subject,
        html,
      });

      console.log('Message sent: %s', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to send email: ${error.message}`,
      );
    }
  }
}
