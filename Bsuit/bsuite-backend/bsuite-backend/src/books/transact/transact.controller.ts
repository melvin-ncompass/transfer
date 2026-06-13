import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { GetCookie } from "src/common/decorators/get-cookies.decorator";
import { TransactService } from "./transact.service";
import { DataSource } from "typeorm";
import { CompanyDB } from "src/common/decorators/get-db.decorator";
import { TransactionDto } from "./dto/transaction.dto";
import { JwtAuthGuard } from "src/common/guard/jwt.auth.guard";
import { CompanyGuard } from "src/common/guard/company.guard";
import { ProducerService } from "src/rmq/producer.service";
import { CurrentUser } from "src/common/decorators/user.decorator";
import { GetAllTransactionsDto } from "./dto/get-all-transaction.dto";
import { IgnoreInterceptor } from "src/common/decorators/ignore-interceptor.decorator";

@Controller("transact")
@UseGuards(JwtAuthGuard, CompanyGuard)
export class TransactController {
  constructor(
    private readonly transactService: TransactService,
    private readonly producerService: ProducerService,
  ) {}

  @Get("attachments")
  async getAttachments(
    @Query() transactioDto: TransactionDto,
    @CompanyDB() dataSource: DataSource,
  ) {
    const data = await this.transactService.getAttachments(
      transactioDto,
      dataSource,
    );
    return {
      data: data,
      message: "Attachment fetched successfully",
    };
  }

  @Get("attachment_url")
  async getAttachmentFile(@Query("path") path: string) {
    const data = await this.transactService.getAttachmentFile(path);
    return {
      data: data,
      message: "File Fetched Successfully",
    };
  }

  @Post("attachments")
  @UseInterceptors(FilesInterceptor("attachments"))
  async uploadAttachments(
    @UploadedFiles() files: Express.Multer.File[],
    @Query("transactionTypeId") transactionTypeId: string,
    @Query("transactionTypeName") transactionTypeName: string,
    @GetCookie("companyId") companyId: string,
    @CompanyDB() dataSource: DataSource,
    @Query("paymentId") paymentId?: string,
  ) {
    console.log(paymentId, "paymentId");
    const data = await this.transactService.uploadAttachments(
      files,
      transactionTypeId,
      transactionTypeName,
      companyId,
      dataSource,
      paymentId,
    );
    return {
      data: data,
      message: "Attachment saved successfully",
    };
  }

  @Delete("attachments")
  async deleteAttachment(
    @Query("transactionTypeId") transactionTypeId: string,
    @Query("transactionTypeName") transactionTypeName: string,
    @Query("filename") filename: string,
    @GetCookie("companyId") companyId: string,
    @CompanyDB() dataSource: DataSource,
    @Query("paymentId") paymentId?: string,
  ) {
    const data = await this.transactService.deleteAttachment(
      transactionTypeId,
      transactionTypeName,
      filename,
      dataSource,
      paymentId,
    );

    return {
      data: data,
      message: "Attachment deleted successfully",
    };
  }

  @Post()
  async remove( 
    @Body() deleteTransactionDto: TransactionDto,
    @CompanyDB() dataSource: DataSource,
    @GetCookie("companyId") companyId: string,
  ) {
    const data = await this.transactService.removeTransact(
      dataSource,
      deleteTransactionDto,
      companyId,
    );

    return {
      data: data,
      message: "Transaction deleted successfully",
    };
  }

  @Get()  
  @IgnoreInterceptor()
  async allTransactions(
    @CompanyDB() dataSource: DataSource,
    @Query() query: GetAllTransactionsDto,
    @GetCookie("companyId") companyId: string,
  ) {
    const {
      fromDate,
      toDate,
      filter,
      limit,
      accountId,
      accountType,
      prevCursor,
      nextCursor,
      newTransactionId,
      newTransactionName,
      newPaymentId,
    } = query;

    const response = await this.transactService.allTransaction(
      dataSource,
      Number(limit) || 20,
      accountType,
      companyId,
      accountId,
      fromDate,
      toDate,
      filter,
      prevCursor,
      nextCursor,
      newTransactionId,
      newTransactionName,
      newPaymentId,
    );

    return {
      ...response,
      statusCode: 200,
      message: "Successfully fetched",
      timestamp: new Date().toISOString(),
    };
  }

  @Get("count")
  async transactCount(
    @CompanyDB() dataSource: DataSource,
    @Query("fromDate") fromDate: string,
    @Query("toDate") toDate: string,
    @Query("filter") filter: string | string[],
  ) {
    return {
      data: await this.transactService.transactionCount(
        dataSource,
        fromDate,
        toDate,
        filter,
      ),
    };
  }

  @Get("attachments/count")
  async getAttachmentsCount(
    @Query() transactioDto: TransactionDto,
    @CompanyDB() dataSource: DataSource,
  ) {
    const count = await this.transactService.getAttachmentsCount(
      transactioDto,
      dataSource,
    );
    return {
      data: { count },
      message: "Attachment count fetched successfully",
    };
  }

  @Get("names")
  async transactNames(@CompanyDB() dataSource: DataSource) {
    return {
      data: await this.transactService.transactionNames(dataSource),
    };
  }

  @Get("export")
  async export(
    @Query() query: GetAllTransactionsDto,
    @GetCookie("companyId") companyId: string,
    @CurrentUser("displayName") displayName: string,
    @CurrentUser("email") email: string,
  ) {
    const { fromDate, toDate, filter, accountId, accountType, exportType } =
      query;

    this.producerService.emailAttachemtnQueue({
      fromDate,
      toDate,
      filter,
      accountId,
      accountType,
      companyId,
      exportType,
      displayName,
      email,
      entityType: "TRANSACTION",
    });

    return {
      message: "Email Sent Successfully",
    };
  }
}
