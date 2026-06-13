import { Module } from '@nestjs/common';
import { NotificationService } from 'src/notification/notification.service';
import { NotificationController } from './notification.controller';
import { DatabaseModule } from 'src/database/database.module';
import { CompanyModule } from 'src/company/company.module';
import { ActivityModule } from 'src/activity/activity.module';

@Module({
    imports: [
        DatabaseModule,
        CompanyModule,
        ActivityModule,
    ],
    controllers: [NotificationController],
    providers: [NotificationService],
    exports: [NotificationService],
})
export class NotificationModule { }