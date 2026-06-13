import { BadRequestException, Injectable } from "@nestjs/common";
import { CreatePayScheduleDto } from "./dto/create-pay-schedule.dto";
import { UpdatePayScheduleDto } from "./dto/update-pay-schedule.dto";
import { DataSource } from "typeorm";
import { PaySchedule } from "./entities/tenant.pay-schedule.entity";

@Injectable()
export class PayrollConfigService {
  private yearMonthToDate(yyyyMM: string): Date {
    const [year, month] = yyyyMM.split("-").map(Number);
    return new Date(year, month - 1, 1);
  }

  private validateFinancialYear(createPayScheduleDto: CreatePayScheduleDto) {
    const startDate = this.yearMonthToDate(
      createPayScheduleDto.financialYearStart
    );
    const endDate = this.yearMonthToDate(createPayScheduleDto.financialYearEnd);
    console.log(startDate, endDate, "sdfghj");
    if (startDate >= endDate) {
      throw new BadRequestException(
        "Financial year start must be before financial year end"
      );
    }

    const diffMonths =
      (endDate.getFullYear() - startDate.getFullYear()) * 12 +
      (endDate.getMonth() - startDate.getMonth()) +
      1;

    if (diffMonths !== 12) {
      throw new BadRequestException("Financial year must be exactly 12 months");
    }
  }

  private setMonthStartEndDates(createPayScheduleDto: CreatePayScheduleDto) {
    const [yearStr, monthStr] =
      createPayScheduleDto.firstPayrollFrom.split("-");

    const year = Number(yearStr);
    const month = Number(monthStr);

    if (!year || !month || month < 1 || month > 12) {
      throw new Error("Invalid firstPayrollFrom format. Expected YYYY-MM");
    }
    const lastDay = new Date(year, month, 0).getDate();

    createPayScheduleDto.fromPayCycle = `${year}-${String(month).padStart(2, "0")}-01`;
    createPayScheduleDto.toPayCycle = `${year}-${String(month).padStart(2, "0")}-${lastDay}`;
  }

  async createPaySchedule(
    createPayScheduleDto: CreatePayScheduleDto,
    dataSource: DataSource
  ) {
    const payScheduleRepo = dataSource.getRepository(PaySchedule);
    if (createPayScheduleDto.isCalendarMonth) {
      this.setMonthStartEndDates(createPayScheduleDto);
    }
    createPayScheduleDto.firstPayrollFrom = this.yearMonthToDate(
      createPayScheduleDto.firstPayrollFrom
    )
      .toISOString()
      .slice(0, 10);

    this.validateFinancialYear(createPayScheduleDto);
    console.log(createPayScheduleDto, "createPayScheduleDto");

    // const paySchedule = payScheduleRepo.create(createPayScheduleDto);
    // return await payScheduleRepo.save(paySchedule);
    return null;
  }

  async updatePaySchedule(
    updatePayScheduleDto: UpdatePayScheduleDto,
    dataSource: DataSource
  ) {
    const payScheduleRepo = dataSource.getRepository(PaySchedule);
    // const schedule = await payScheduleRepo.findOne({ where: { id } });
    // if (!schedule) {
    //   throw new Error('PaySchedule not found'); // you can use NotFoundException
    // }
    // Object.assign(schedule, dto);
    // return await this.payScheduleRepo.save(schedule);
  }

  findAll() {
    return `This action returns all payrollConfig`;
  }

  findOne(id: number) {
    return `This action returns a #${id} payrollConfig`;
  }

  update(id: number, updatePayrollConfigDto: UpdatePayScheduleDto) {
    return `This action updates a #${id} payrollConfig`;
  }

  remove(id: number) {
    return `This action removes a #${id} payrollConfig`;
  }
}
