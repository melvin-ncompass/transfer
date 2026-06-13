import { Controller, Get, Patch, Param, Query, ParseBoolPipe, ParseIntPipe, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { GetCookie } from 'src/common/decorators/get-cookies.decorator';
import { JwtAuthGuard } from 'src/common/guard/jwt.auth.guard';
import { CompanyGuard } from 'src/common/guard/company.guard';
import { ignoreModuleClassInterceptor } from 'src/common/decorators/ignore-interceptor.decorator';

@Controller('notification')
@UseGuards(JwtAuthGuard, CompanyGuard)
export class NotificationController {
    constructor(private readonly notificationService: NotificationService) { }

    @Get()
    async getNotifications(
        @CurrentUser('username') username: string,
        @GetCookie('companyId') companyId: string,
        @Query('cursor') cursor?: string
    ) {
        let parsedCursor: any[] | undefined = undefined;

        if (cursor) {
            try {
                parsedCursor = JSON.parse(cursor);
            } catch {
                parsedCursor = undefined;
            }
        }
        return this.notificationService.getNotifications(username, companyId, parsedCursor);
    }

    @ignoreModuleClassInterceptor()
    @Patch('mark_read/:documentId')
    async markReadByReminderId(
        @Param('documentId') documentId: string,
        @Query('isRead', ParseBoolPipe) isRead: boolean
    ) {
        return this.notificationService.markReadByReminderId(documentId, isRead);
    }

    @Get('unread_count')
    async getUnreadCount(@CurrentUser('username') username: string, @GetCookie('companyId') companyId: string) {
        const count = await this.notificationService.getUnreadCount(username, companyId);
        return { username, unreadCount: count };
    }
}
