import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { InvoiceService } from "./invoice.service";
import { CreateInvoiceDto } from "./dto/create-invoice.dto";
import { DataSource } from "typeorm";
import { CompanyDB } from "src/common/decorators/get-db.decorator";
import { GetCookie } from "src/common/decorators/get-cookies.decorator";
import { JwtAuthGuard } from "src/common/guard/jwt.auth.guard";
import { CompanyGuard } from "src/common/guard/company.guard";
import { UpdateInvoiceDto } from "./dto/update-invoice.dto";
import { InvoicePaymentDto } from "./dto/invoice-payment.dto";
import { AuthGuard } from "@nestjs/passport";
import { GetHeader } from "src/common/decorators/get-header.decorator";
import { ProducerService } from "src/rmq/producer.service";
import { CurrentUser } from "src/common/decorators/user.decorator";
import { ParseStringPipe } from "src/common/pipes/parse-string.pipe";
import express from "express";
import { ExportQueryDto } from "./dto/invoice-bill-export.dto";
import { IgnoreInterceptor } from "src/common/decorators/ignore-interceptor.decorator";
import { ignoreModuleClassInterceptor } from "src/common/decorators/ignore-interceptor.decorator";

@Controller("invoice")
export class InvoiceController {
  constructor(
    private readonly invoiceService: InvoiceService,
    private readonly producerService: ProducerService,
  ) {}

  @UseGuards(JwtAuthGuard, CompanyGuard)
  @Get("inv_num_exists")
  async invoiceNumberExists(
    @CompanyDB() dataSource: DataSource,
    @Query("contactId") contactId: number,
    @Query("invoiceNo") invoiceNo: string,
    @Query("ignoreInvoiceId") ignoreInvoiceId?: string,
  ) {
    const ignoreInvoiceIdNumber = ignoreInvoiceId
      ? Number(ignoreInvoiceId)
      : undefined;
    return this.invoiceService.invoiceNumberExists(
      dataSource,
      contactId,
      invoiceNo,
      ignoreInvoiceIdNumber,
    );
  }

  @UseGuards(JwtAuthGuard, CompanyGuard)
  @IgnoreInterceptor()
  @Get("all_invoices")
  async getAllInvoiceData(
    @CompanyDB() dataSource: DataSource,
    @Query("limit") limit: string,
    @Query("fromDate") fromDate?: string,
    @Query("toDate") toDate?: string,
    @Query("prevCursor") prevCursor?: string,
    @Query("nextCursor") nextCursor?: string,
    @Query("newInvoiceNo") newInvoiceNo?: string,
  ) {
    const allInvoices = await this.invoiceService.getAllInvoiceDataCursor(
      dataSource,
      Number(limit || 11),
      fromDate,
      toDate,
      prevCursor,
      nextCursor,
      newInvoiceNo,
    );
    return {
      ...allInvoices,
      statusCode: 200,
      message: "Successfully fetched",
      timestamp: new Date().toISOString(),
    };
  }

  @UseGuards(JwtAuthGuard, CompanyGuard)
  @Get("export")
  async export(
    @Query() query: ExportQueryDto,
    @GetCookie("companyId") companyId: string,
    @CurrentUser("displayName") displayName: string,
    @CurrentUser("email") email: string,
  ) {
    const { fromDate, toDate, entityType, exportType } = query;

    await this.producerService.emailAttachemtnQueue({
      fromDate,
      toDate,
      entityType,
      companyId,
      exportType,
      displayName,
      email,
    });

    return {
      message: "Email Sent Successfully",
    };
  }

  @UseGuards(JwtAuthGuard, CompanyGuard)
  @Get("latest_invoices")
  async getlatestInvoices(
    @CompanyDB() dataSource: DataSource,
    @Query("contactId") contactId: number,
  ) {
    const recentInvoices = await this.invoiceService.getlatestInvoices(
      dataSource,
      contactId,
    );
    return {
      data: recentInvoices,
      message: "Latest 10 invoice numbers fetched successfully",
    };
  }

  @UseGuards(JwtAuthGuard, CompanyGuard)
  @Get("get_all_payments")
  async getInvoicePayments(
    @CompanyDB() dataSource: DataSource,
    @Query("transactionTypeId") transactionTypeId: string,
  ) {
    const payments = await this.invoiceService.getInvoicePayments(
      dataSource,
      transactionTypeId,
    );
    return { data: payments, message: "Fetched all Payments for the Invoice" };
  }

  @UseGuards(JwtAuthGuard, CompanyGuard)
  @Get("get_payment_details/:paymentId")
  async getPaymentDetails(
    @Param("paymentId") paymentId: string,
    @Query("transactionTypeId") transactionTypeId: string,
    @CompanyDB() dataSource: DataSource,
  ) {
    const paymentDetails = await this.invoiceService.getPaymentDetails(
      paymentId,
      transactionTypeId,
      dataSource,
    );
    return { data: paymentDetails, message: "Fetched bill payment details" };
  }

  @UseGuards(JwtAuthGuard, CompanyGuard)
  @Get(":transactionTypeId")
  async getInvoiceData(
    @CompanyDB() dataSource: DataSource,
    @Param("transactionTypeId") transactionTypeId: string,
  ) {
    const invoice = await this.invoiceService.getInvoiceData(
      dataSource,
      transactionTypeId,
    );
    return {
      data: invoice,
      message: "Invoice fetched successfully",
    };
  }

  @UseGuards(JwtAuthGuard, CompanyGuard)
  @Post()
  async createInvoice(
    @CompanyDB() dataSource: DataSource,
    @Body() dto: CreateInvoiceDto,
    @GetCookie("companyId") companyId: string,
  ) {
    const invoice = await this.invoiceService.createInvoice(
      dataSource,
      dto,
      companyId,
    );
    return {
      data: invoice,
      message: "Invoice created successfully",
    };
  }

  @UseGuards(JwtAuthGuard, CompanyGuard)
  @Post("receive_payment")
  async receiveInvoicePayment(
    @CompanyDB() dataSource: DataSource,
    @Body() paymentDetails: InvoicePaymentDto,
    @GetCookie("companyId") companyId: string,
  ) {
    const payment = await this.invoiceService.receiveInvoicePayment(
      dataSource,
      paymentDetails,
      companyId,
    );
    return {
      data: payment,
      message: "Invoice payment recorded successfully",
    };
  }

  @UseGuards(JwtAuthGuard, CompanyGuard)
  @Patch("edit_payment")
  async editInvoicePayment(
    @CompanyDB() dataSource: DataSource,
    @Body() paymentDetails: InvoicePaymentDto,
    @GetCookie("companyId") companyId: string,
  ) {
    const payment = await this.invoiceService.editInvoicePayment(
      dataSource,
      paymentDetails,
      companyId,
    );
    return {
      data: payment,
      message: "Invoice payment updated successfully",
    };
  }

  @UseGuards(JwtAuthGuard, CompanyGuard)
  @Patch(":transactionTypeId")
  async updateInvoice(
    @CompanyDB() dataSource: DataSource,
    @Param("transactionTypeId") transactionTypeId: string,
    @Body() dto: UpdateInvoiceDto,
    @GetCookie("companyId") companyId: string,
  ) {
    const invoice = await this.invoiceService.updateInvoice(
      dataSource,
      dto,
      companyId,
      transactionTypeId,
    );
    return {
      data: invoice,
      message: "Invoice updated successfully",
    };
  }


  @ignoreModuleClassInterceptor()
  @Post("validate")
  @UseGuards(AuthGuard("google-auth"), CompanyGuard)
  async validateBulk(
    @Body() items: CreateInvoiceDto[],
    @GetHeader("x-company-id") companyId: string,
    @CompanyDB() dataSource: DataSource,
  ) {
    return await this.invoiceService.validateInvoiceBulk(
      dataSource,
      items,
      companyId,
    );
  }

  @Post("bulk_create")
  @UseGuards(AuthGuard("google-auth"), CompanyGuard)
  async bulkCreate(
    @Body() dtos: CreateInvoiceDto[],
    @GetHeader("x-company-id") companyId: string,
    @CompanyDB() dataSource: DataSource,
  ) {
    const result = await this.invoiceService.bulkCreateInvoices(
      dataSource,
      dtos,
      companyId,
    );
    return {
      ...result,
      message: "Bulk Invoice created successfully",
    };
  }

  @UseGuards(JwtAuthGuard, CompanyGuard)
  @Get(":id/pdf")
  async downloadInvoicePdf(
    @Param("id", ParseStringPipe) transactionTypeId: string,
    @GetCookie("companyId") companyId: string,
    @Res() res: express.Response,
    @CompanyDB() dataSource: DataSource,
  ) {
    const { buffer, fileName } = await this.invoiceService.generateInvoicePdf(
      transactionTypeId,
      companyId,
      dataSource,
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileName}.pdf"`,
    );
    res.setHeader(
      "Access-Control-Expose-Headers",
      "Content-Disposition, Content-Length"
    );
    res.setHeader("Content-Length", buffer.length);

    res.end(buffer);
  }

  @UseGuards(JwtAuthGuard, CompanyGuard)
  @Get(":id/preview")
  async previewInvoice(
    @Param("id", ParseStringPipe) transactionTypeId: string,
    @GetCookie("companyId") companyId: string,
    @CompanyDB() dataSource: DataSource,
  ) {
    return await this.invoiceService.buildInvoiceRawData(
      transactionTypeId,
      companyId,
      dataSource,
    );
  }
}
