import {
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { SettingsService } from 'scaffolding/settings/settings.service';
import { getBrandedWrapper } from './mail-template.util';
// import { BrandingEnum } from '../enum/enum';
@Injectable()
export class MailerService {
  constructor(
    @Inject(forwardRef(() => SettingsService))
    private readonly settingsService: SettingsService,
  ) { }
  async sendMail(to: string,
    subject: string,
    body: string | string[],
    button?: { text: string, url: string, linkText?: string },
    footer?: string | string[]
  ) {
    const [config, brandingSettings] = await Promise.all([
      this.settingsService.getConfig('email'),
      this.settingsService.getConfig('branding'),
    ]);
    // const branding = {
    //   fontColor: brandingSettings?.fgcolor || '#D33139',
    //   bgColor: brandingSettings?.bgcolor || '#F5F5F5',
    //   companyName: BrandingEnum.COMPANY_NAME,
    // };
    const finalHtml = getBrandedWrapper(body, button, footer);
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
        html: finalHtml,
        attachments: [
          {
            filename: 'logo.png',
            path: 'src/utils/swagger/assets/Frame.png',
            cid: 'heartbeaticon',
          },
        ],
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