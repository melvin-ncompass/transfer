import {
    Controller,
    Post,
    Get,
    Patch,
    Delete,
    Body,
    Param,
    Req,
    UseGuards,
    ParseIntPipe,
} from '@nestjs/common';

import { ReminderService } from './reminder.service';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';
import { CompanyGuard } from 'src/common/guard/company.guard';
import { JwtAuthGuard } from 'src/common/guard/jwt.auth.guard';
import { CompanyDB } from 'src/common/decorators/get-db.decorator';
import { DataSource } from 'typeorm';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { GetCookie } from 'src/common/decorators/get-cookies.decorator';

@Controller('reminders')
@UseGuards(JwtAuthGuard, CompanyGuard)
export class ReminderController {
    constructor(
        private readonly reminderService: ReminderService,
    ) { }

    @Post()
    async create(
        @CurrentUser('username') username: string,
        @Body() dto: CreateReminderDto,
        @CompanyDB() dataSource: DataSource,
        @GetCookie('companyId') companyId: string
    ) {

        const createdData = await this.reminderService.create(dto, username, dataSource, companyId);
        return { message: "Reminder created successsfully", data: createdData }
    }

    @Get()
    async findAllReminders(@CompanyDB() dataSource: DataSource,) {
        const fetchedData = await this.reminderService.findAll(dataSource);
        return { message: "Reminders fetched successfully", data: fetchedData }
    }

    @Get(':reminderId')
    async findReminder(
        @Param('reminderId', ParseIntPipe) reminderId: number,
        @CompanyDB() dataSource: DataSource,) {
        const fetchedData = await this.reminderService.findOne(reminderId, dataSource);
        return { message: "Reminder fetched successfully", data: fetchedData }
    }

    @Patch(':reminderId')
    async update(
        @Param('reminderId', ParseIntPipe) reminderId: number,
        @Body() dto: UpdateReminderDto,
        @CompanyDB() dataSource: DataSource,
        @GetCookie('companyId') companyId: string
    ) {
        const updatedData = await this.reminderService.update(reminderId, dto, dataSource, companyId);
        return { message: "Reminder updated successfully", data: updatedData }
    }

    @Post('duplicate/:reminderId')
    async duplicate(
        @CurrentUser('username') username: string,
        @Param('reminderId', ParseIntPipe) reminderId: number,
        @Body() dto: UpdateReminderDto,
        @CompanyDB() dataSource: DataSource,
        @GetCookie('companyId') companyId: string
    ) {
        const duplicateData = await this.reminderService.duplicate(
            reminderId,
            dto,
            username,
            dataSource,
            companyId,
        );
        return { message: "Reminder duplicated successfully", data: duplicateData }
    }


    @Patch(':reminderId/pause')
    async pause(
        @Param('reminderId', ParseIntPipe) reminderId: number,
        @CompanyDB() dataSource: DataSource
    ) {
        const pausedData = await this.reminderService.pause(reminderId, dataSource);
        return { message: "Reminder paused successfully", data: pausedData }
    }


    @Patch(':reminderId/resume')
    async resume(
        @Param('reminderId', ParseIntPipe) reminderId: number,
        @CompanyDB() dataSource: DataSource,
        @GetCookie('companyId') companyId: string
    ) {
        const resumedData = await this.reminderService.resume(reminderId, dataSource, companyId);
        return { message: "Reminder resumed successfully", data: resumedData }
    }

    @Delete(':reminderId')
    async delete(
        @Param('reminderId', ParseIntPipe) reminderId: number,
        @CompanyDB() dataSource: DataSource
    ) {
        const deletedData = await this.reminderService.delete(reminderId, dataSource);
        return { message: "Reminder deleted successfully", data: deletedData }
    }
}
