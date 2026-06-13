import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from "@nestjs/common";
import { PayrollConfigService } from "./payroll-config.service";
import { CreatePayScheduleDto } from "./dto/create-pay-schedule.dto";
import { UpdatePayScheduleDto } from "./dto/update-pay-schedule.dto";
import { CompanyGuard } from "src/common/guard/company.guard";
import { JwtAuthGuard } from "src/common/guard/jwt.auth.guard";
import { CompanyDB } from "src/common/decorators/get-db.decorator";
import { DataSource } from "typeorm";

@Controller("payroll_config")
@UseGuards(JwtAuthGuard, CompanyGuard)
export class PayrollConfigController {

  constructor(private readonly payrollConfigService: PayrollConfigService) {}

  // @Get("payschedule")
  // async getPaySchedule(@CompanyDB() dataSource: DataSource){
  //   const repo = await this.payrollConfigService(dataSource);
  //   return await repo.find({
  //     order: { firstPayrollFrom: 'ASC' },
  //   });
  // }

  @Post("payschedule")
  async createPaySchedule(
    @Body() createPayScheduleDto: CreatePayScheduleDto,@CompanyDB() dataSource: DataSource
  ) {
    const data = await this.payrollConfigService.createPaySchedule(createPayScheduleDto,dataSource);
    return { data, message: 'Pay Schedule created successfully' };
  }

  @Patch('payschedule')
  async updatePaySchedule(
    @Body() updatePayScheduleDto: UpdatePayScheduleDto,@CompanyDB() dataSource: DataSource
  ){
    const data = await this.payrollConfigService.updatePaySchedule(updatePayScheduleDto,dataSource);
    return { data, message: 'Pay Schedule updated successfully' };
  }

  @Get()
  findAll() {
    return this.payrollConfigService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.payrollConfigService.findOne(+id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() updatePayrollConfigDto: UpdatePayScheduleDto
  ) {
    return this.payrollConfigService.update(+id, updatePayrollConfigDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.payrollConfigService.remove(+id);
  }
}
