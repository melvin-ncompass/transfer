import { forwardRef, Module } from '@nestjs/common';
import { MailerService } from './mail.service';
import { SettingsModule } from 'scaffolding/settings/settings.module';

@Module({
  imports: [forwardRef(() => SettingsModule)],
  providers: [MailerService],
  exports: [MailerService],
})
export class MailerModule {}
