import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Query,
  Res,
} from "@nestjs/common";
import { BillService } from "./bill.service";
import { CreateBillDto } from "./dto/create-bill.dto";
import { UpdateBillDto } from "./dto/update-bill.dto";
import { CompanyDB } from "src/common/decorators/get-db.decorator";
import { DataSource } from "typeorm";
import { JwtAuthGuard } from "src/common/guard/jwt.auth.guard";
import { CompanyGuard } from "src/common/guard/company.guard";
import { GetCookie } from "src/common/decorators/get-cookies.decorator";
import { BillPaymentDto } from "./dto/bill-payment.dto";
import express from "express";
import { ParseStringPipe } from "src/common/pipes/parse-string.pipe";
import { InvoiceService } from "../invoice/invoice.service";
import { IgnoreInterceptor } from "src/common/decorators/ignore-interceptor.decorator";

@Controller("bill")
@UseGuards(JwtAuthGuard, CompanyGuard)
export class BillController {
  constructor(private readonly billService: BillService) {}

  @Get("bill_num_exists")
  async billNumberExists(
    @CompanyDB() dataSource: DataSource,
    @Query("billNo") billNo: string,
    @Query("ignoreBillId") ignoreBillId?: string,
  ) {
    const ignoreIdNumber = ignoreBillId ? Number(ignoreBillId) : undefined;
    await this.billService.billNumberExists(dataSource, billNo, ignoreIdNumber);
    return {
      message: "No bills found with that bill number",
    };
  }

  @IgnoreInterceptor()
  @Get("all_bills")
  async getAllBillData(
    @CompanyDB() dataSource: DataSource,
    @Query("limit") limit: string,
    @Query("fromDate") fromDate?: string,
    @Query("toDate") toDate?: string,
    @Query("prevCursor") prevCursor?: string,
    @Query("nextCursor") nextCursor?: string,
    @Query("newBillNo") newBillNo?: string,
  ) {
    const allBills = await this.billService.getAllBillDataCursor(
      dataSource,
      Number(limit || 11),
      fromDate,
      toDate,
      prevCursor,
      nextCursor,
      newBillNo,
    );

    return {
      ...allBills,
      statusCode: 200,
      message: "Successfully fetched",
      timestamp: new Date().toISOString(),
    };
  }

  @Get("latest_bills")
  async getlatestBills(@CompanyDB() dataSource: DataSource) {
    const recentBills = await this.billService.getlatestBills(dataSource);
    return {
      data: recentBills,
      message: "Latest 10 bill numbers fetched successfully",
    };
  }

  @Get("get_all_payments")
  async getBillPayments(
    @Query("transactionTypeId") transactionTypeId: string,
    @CompanyDB() dataSource: DataSource,
  ) {
    const payments = await this.billService.getBillPayments(
      transactionTypeId,
      dataSource,
    );
    return { data: payments, message: "Fetched all Payments for the bill" };
  }

  @Get("get_payment_details/:paymentId")
  async getPaymentDetails(
    @Param("paymentId") paymentId: string,
    @Query("transactionTypeId") transactionTypeId: string,
    @CompanyDB() dataSource: DataSource,
  ) {
    const paymentDetails = await this.billService.getPaymentDetails(
      paymentId,
      transactionTypeId,
      dataSource,
    );
    return { data: paymentDetails, message: "Fetched bill payment details" };
  }

  @Get(":transactionTypeId")
  async getBillData(
    @CompanyDB() dataSource: DataSource,
    @Param("transactionTypeId") transactionTypeId: string,
  ) {
    const bill = await this.billService.getBillData(
      dataSource,
      transactionTypeId,
    );
    return {
      data: bill,
      message: "Bill fetched successfully",
    };
  }

  @Post()
  async createBill(
    @Body() createBillDto: CreateBillDto,
    @CompanyDB() dataSource: DataSource,
    @GetCookie("companyId") companyId: string,
  ) {
    const bill = await this.billService.createBill(
      createBillDto,
      dataSource,
      companyId,
    );
    return {
      data: bill,
      message: "Bill created successfully",
    };
  }

  @Post("make_payment")
  async makeBillPayment(
    @CompanyDB() dataSource: DataSource,
    @Body() paymentDetails: BillPaymentDto,
    @GetCookie("companyId") companyId: string,
  ) {
    const payment = await this.billService.makeBillPayment(
      dataSource,
      paymentDetails,
      companyId,
    );
    return {
      data: payment,
      message: "Bill payment recorded successfully",
    };
  }

  @Patch("edit_payment")
  async editBillPayment(
    @CompanyDB() dataSource: DataSource,
    @Body() paymentDetails: BillPaymentDto,
    @GetCookie("companyId") companyId: string,
  ) {
    const payment = await this.billService.editBillPayment(
      dataSource,
      paymentDetails,
      companyId,
    );
    return {
      data: payment,
      message: "Bill payment updated successfully",
    };
  }

  @Patch(":transactionTypeId")
  async updateBill(
    @CompanyDB() dataSource: DataSource,
    @Param("transactionTypeId") transactionTypeId: string,
    @Body() dto: UpdateBillDto,
    @GetCookie("companyId") companyId: string,
  ) {
    const bill = await this.billService.updateBill(
      dataSource,
      dto,
      companyId,
      transactionTypeId,
    );
    return {
      data: bill,
      message: "Bill updated successfully",
    };
  }

  @UseGuards(JwtAuthGuard, CompanyGuard)
  @Get(":id/preview/")
  async previewBill(
    @Param("id", ParseStringPipe) transactionTypeId: string,
    @CompanyDB() dataSource: DataSource,
  ) {
    return await this.billService.buildBillRawData(
      transactionTypeId,
      dataSource,
    );
  }
}
