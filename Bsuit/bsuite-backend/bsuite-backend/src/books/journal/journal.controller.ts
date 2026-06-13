import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  Query,
  UseGuards,
} from "@nestjs/common";
import { JournalService } from "./journal.service";
import { CreateJournalDto } from "./dto/create-journal.dto";
import { UpdateJournalDto } from "./dto/update-journal.dto";
import { CompanyDB } from "src/common/decorators/get-db.decorator";
import { DataSource } from "typeorm";
import { GetCookie } from "src/common/decorators/get-cookies.decorator";
import { JwtAuthGuard } from "src/common/guard/jwt.auth.guard";
import { CompanyGuard } from "src/common/guard/company.guard";

@Controller("journal")
@UseGuards(JwtAuthGuard, CompanyGuard)
export class JournalController {
  constructor(private readonly journalService: JournalService) {}

  @Post()
  async create(
    @Body() createJournalDto: CreateJournalDto,
    @CompanyDB() dataSource: DataSource,
    @GetCookie("companyId") companyId: string
  ) {
    return {
      data: await this.journalService.createJournal(
        createJournalDto,
        dataSource,
        companyId
      ),
      message: "Created Successfully",
    };
  }

  @Get("date_range")
  async getDateRange(@CompanyDB() dataSource: DataSource) {
    return {
      data: await this.journalService.getDateRange(dataSource),
    };
  }

  @Get("opening_balance")
  async getOpeningBalance(@CompanyDB() dataSource: DataSource) {
    return await this.journalService.getOpeningBalance(dataSource)    
  }

  @Get(":id")
  async find(@Param("id") id: string, @CompanyDB() dataSource: DataSource) {
    return { data: await this.journalService.findJournal(id, dataSource) };
  }

  @Patch(":id")
  async update(
    @Param("id") transactionTypeId: string,
    @Body() updateJournalDto: UpdateJournalDto,
    @CompanyDB() dataSource: DataSource,
    @GetCookie("companyId") companyId: string
  ) {
    return {
      data: await this.journalService.updateJournal(
        transactionTypeId,
        updateJournalDto,
        dataSource,
        companyId
      ),
      message: "Updated Successfully",
    };
  }
}
