import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import amqp, { ChannelWrapper } from "amqp-connection-manager";
import { ConfirmChannel, Channel } from "amqplib";
import { ActivityService } from "src/activity/activity.service";
import { MailerService } from "@nestjs-modules/mailer";
import * as ExcelJS from "exceljs";
import * as hbs from "handlebars";
import * as fs from "fs-extra";
import { Repository } from "typeorm";
import { Company } from "src/company/entities/company.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { ActivityFilterDto } from "src/activity/dto/activity-filter.dto";
import { TransactService } from "src/books/transact/transact.service";
import { ReportsService } from "src/books/reports/reports.service";
import { TenantService } from "src/database/tenants.service";
import { InvoiceService } from "src/books/invoice/invoice.service";
import { formatDateTime, generateExcelWithHeaderImage, getTemplatePath } from "src/shared/utils";
import { SettingService } from "src/setting/setting.service";
import { Subject } from "rxjs";
import puppeteer from "puppeteer";

@Injectable()
export class ConsumerService implements OnModuleInit {
  private channelWrapper: ChannelWrapper;
  private readonly logger = new Logger(ConsumerService.name);

  constructor(
    private activityService: ActivityService,
    private transactService: TransactService,
    private mailerService: MailerService,
    private readonly reportsService: ReportsService,
    private readonly invoiceService: InvoiceService,
    private readonly tenantService: TenantService,
    private readonly settingService: SettingService,
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>
  ) {
    const connection = amqp.connect([
      `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}${process.env.RABBITMQ_VHOST}`,
    ]);

    connection.on("connect", () => {
      console.log("RabbitMQ Consumer connected");
    });

    this.channelWrapper = connection.createChannel({
      setup: (channel: Channel) => {
        channel.assertQueue(process.env.ACTIVITY_QUEUE, { durable: true });
        channel.assertQueue(process.env.EMAIL_ATTACHMENT_QUEUE, {
          durable: true,
        });
      },
    });

    connection.on("connect", () => this.logger.log("RabbitMQ connected"));
    connection.on("disconnect", (err) =>
      this.logger.error("RabbitMQ disconnected", err)
    );
  }

  private getEmailConfig() {
    return {
      PROFIT_LOSS: {
        subject: (companyName: string) =>
          `Profit & Loss - ${companyName}`,
        templatePath: "report-email-template.html",
      },

      TRANSACTION: {
        subject: (companyName: string) =>
          `Transaction Report - ${companyName}`,
        templatePath: "transaction-email-template.html",
      },

      TDS: {
        subject: (companyName: string) =>
          `TDS Summary - ${companyName}`,
        templatePath: "report-email-template.html",
      },

      TAX: {
        subject: (companyName: string) =>
          `Tax Summary - ${companyName}`,
        templatePath: "report-email-template.html",
      },

      TRIAL_BALANCE: {
        subject: (companyName: string) =>
          `Trial Balance Summary - ${companyName}`,
        templatePath: "report-email-template.html",
      },

      BILL: {
        subject: (companyName: string) =>
          `Bills Report - ${companyName}`,
        templatePath: "transaction-email-template.html",
      },

      INVOICE: {
        subject: (companyName: string) =>
          `Invoice Report - ${companyName}`,
        templatePath: "transaction-email-template.html",
      },

      BALANCE_SHEET: {
        subject: (companyName: string) =>
          `Balance Sheet - ${companyName}`,
        templatePath: "balance-sheet-email-template.html"
      }
    } as const;
  }


  private async getCompanyName(companyId: string) {
    const company = await this.companyRepo.findOne({
      where: { companyId },
    });
    return company?.companyName;
  }

  private async buildReportTitle(
    companyId: string,
    options?: {
      username?: string;
      features?: string;
      modules?: string;
    }
  ) {
    const companyName = await this.getCompanyName(companyId);
    const reportTitle = "Activity Report";
    const username = options?.username
      ? `Users - ${options.username}`
      : "All Users";

    let featureTitle: string, moduleTitle: string, headerText: string;
    if (options?.modules && !options?.features) {
      moduleTitle = `Module - ${options.modules}`;
      featureTitle = "All features";
      headerText = `${companyName}\n${reportTitle}\n${username}\n${moduleTitle}\n${featureTitle}`;
    } else if (options?.features && !options?.modules) {
      featureTitle = `Features - ${options?.features}`;
      moduleTitle = "All modules";
      headerText = `${companyName}\n${reportTitle}\n${username}\n${moduleTitle}\n${featureTitle}`;
    } else if (!options?.features && !options?.modules) {
      moduleTitle = "All modules and features";
      featureTitle = "";
      headerText = `${companyName}\n${reportTitle}\n${username}\n${moduleTitle}`;
    } else {
      featureTitle = `Feature - ${options?.features}`;
      moduleTitle = `Modules - ${options.modules}`;
      headerText = `${companyName}\n${reportTitle}\n${username}\n${moduleTitle}\n${featureTitle}`;
    }
    return {
      companyName,
      reportTitle,
      username,
      moduleTitle,
      featureTitle,
      headerText,
    };
  }

  public async onModuleInit() {
    await this.channelWrapper.addSetup(async (channel: ConfirmChannel) => {
      await channel.consume(process.env.ACTIVITY_QUEUE!, async (message) => {
        if (!message) return;
        try {
          const content = JSON.parse(message.content.toString());
          this.logger.log("File generation message received:", content);
          const { companyId, filters, email } = content;
          const filteredData =
            await this.activityService.getAllActivitiesForReport(
              filters,
              companyId
            );
          const companyName = await this.getCompanyName(companyId);
          let attachments: any[] = [];

          if (filters.type === "pdf") {
            const pdfBuffer = await this.generateActivityReport(
              "pdf",
              companyId,
              filters,
              filteredData
            );
            attachments.push({
              filename: `Activity_${companyName}.pdf`,
              content: pdfBuffer,
              contentType: "application/pdf",
            });

          } else if (filters.type === "excel") {
            const excelBuffer = await this.generateActivityReport(
              "excel",
              companyId,
              filters,
              filteredData
            );
            attachments.push({
              filename: `Activity_${companyName}.xlsx`,
              content: excelBuffer,
              contentType:
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });
          }
          content.text = "Please find your attached report";
          const serializedAttachments = attachments.map((att) => ({
            ...att,
            content:
              att.content instanceof Buffer
                ? att.content
                : Buffer.from(att.content),
          }));

          await this.mailerService.sendMail({
            from: process.env.FROM_EMAIL,
            to: email,
            subject: `Activity Report - ${companyName}`,
            text: "Please find your activity report attached.",
            attachments: serializedAttachments,
          });

          channel.ack(message);
        } catch (err) {
          this.logger.error("Error generating file:", err);
          channel.ack(message);
        }
      });

      await channel.consume(
        process.env.EMAIL_ATTACHMENT_QUEUE,
        async (message) => {
          if (!message) return;

          const content = JSON.parse(message.content.toString());
          const {
            fromDate,
            toDate,
            filter,
            accountId,
            accountType,
            companyId,
            exportType,
            displayName,
            email,
            entityType,
            isCustomize,
            noOfMonthsOrYear,
            compareWith,
            userId,
            splitContact
          } = content;

          try {
            const dataSource =
              await this.tenantService.getTenantDataSource(companyId);

            const companyHeader = await this.settingService.getCompanyImages(
              dataSource,
              companyId
            );

            const companyName = await this.getCompanyName(companyId);

            const contentType =
              exportType === "excel"
                ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                : "application/pdf";

            let fileData;

            if (entityType === "PROFIT_LOSS") {
              fileData =
                exportType === "excel"
                  ? await this.reportsService.exportProfitLossToExcel(
                    userId,
                    dataSource,
                    fromDate,
                    toDate,
                    isCustomize,
                    companyId,
                    companyHeader.headerUrl!,
                    noOfMonthsOrYear,
                    compareWith
                  )
                  : await this.reportsService.exportProfitLossToPdf(
                    userId,
                    dataSource,
                    fromDate,
                    toDate,
                    isCustomize,
                    companyId,
                    companyHeader.headerUrl!,
                    displayName,
                    noOfMonthsOrYear,
                    compareWith
                  );
            } else if (entityType === "BALANCE_SHEET") {
              fileData =
                exportType === "excel"
                  ? await this.reportsService.exportBalanceSheetToExcel(
                    userId,
                    dataSource,
                    toDate,
                    companyId,
                    companyHeader.headerUrl!,
                    displayName,
                    splitContact
                  )
                  : await this.reportsService.exportBalanceSheetToPdf(
                    userId,
                    dataSource,
                    toDate,
                    companyId,
                    companyHeader.headerUrl!,
                    displayName,
                    splitContact
                  );
            } else if (entityType === "TRANSACTION") {
              fileData =
                exportType === "excel"
                  ? await this.transactService.exportTransactionsToExcel(
                    dataSource,
                    fromDate,
                    toDate,
                    filter,
                    accountId,
                    accountType,
                    companyId,
                    companyHeader.headerUrl!
                  )
                  : await this.transactService.exportTransactionsToPdf(
                    dataSource,
                    fromDate,
                    toDate,
                    filter,
                    accountId,
                    accountType,
                    companyId,
                    companyHeader.headerUrl!,
                    displayName
                  );
            } else if (entityType === "TDS") {
              fileData =
                exportType === "excel"
                  ? await this.reportsService.generateTdsExcel(
                    dataSource,
                    fromDate,
                    toDate,
                    userId,
                    companyId,
                    companyName!,
                    companyHeader.headerUrl!,
                  )
                  : await this.reportsService.generateTdsPdf(
                    dataSource,
                    fromDate,
                    toDate,
                    userId,
                    companyId,
                    companyName!,
                    companyHeader.headerUrl!,
                  );
            } else if (entityType === "TAX") {
              fileData =
                exportType === "excel"
                  ? await this.reportsService.generateTaxExcel(
                    dataSource,
                    fromDate,
                    toDate,
                    userId,
                    companyId,
                    companyName!,
                    companyHeader.headerUrl!,
                  )
                  : await this.reportsService.generateTaxPdf(
                    dataSource,
                    fromDate,
                    toDate,
                    userId,
                    companyId,
                    companyName!,
                    companyHeader.headerUrl!,
                  );
            } else if (entityType === "TRIAL_BALANCE") {
              fileData =
                exportType === "excel"
                  ? await this.reportsService.generateTrialBalanceExcel(
                    dataSource,
                    toDate,
                    userId,
                    companyId,
                    companyName!,
                    companyHeader.headerUrl!,
                  )
                  : await this.reportsService.generateTrialBalancePdf(
                    dataSource,
                    toDate,
                    userId,
                    companyId,
                    companyName!,
                    companyHeader.headerUrl!,
                  );
            }
            else {
              fileData =
                exportType === "excel"
                  ? await this.invoiceService.exportInvoiceOrBillToExcel(
                    dataSource,
                    fromDate,
                    toDate,
                    entityType,
                    companyId,
                    companyHeader.headerUrl!
                  )
                  : await this.invoiceService.exportInvoiceOrBillToPdf(
                    dataSource,
                    fromDate,
                    toDate,
                    entityType,
                    companyId,
                    displayName,
                    companyHeader.headerUrl!
                  );
            }

            const { fileBuffer, filename } = fileData;

            const emailConfigMap = this.getEmailConfig();
            const emailConfig = emailConfigMap[entityType];

            const subject =
              emailConfig?.subject(companyName!) ??
              `Report - ${companyName}`;

            const templatePath =
              emailConfig?.templatePath ??
              "transaction-email-template.html";

            const attachments = [
              {
                filename,
                content: fileBuffer,
                contentType,
              },
            ];

            const serializedAttachments = attachments.map((att) => ({
              ...att,
              content:
                att.content instanceof Buffer
                  ? att.content
                  : Buffer.from(att.content),
            }));

            await this.mailerService.sendMail({
              from: process.env.FROM_EMAIL,
              to: email,
              subject,
              template: getTemplatePath(templatePath),
              context: {
                displayName: displayName || "Valued Client",
                period: `${fromDate} to ${toDate}`,
                companyName,
                year: new Date().getFullYear(),
              },
              attachments: serializedAttachments,
            });

            channel.ack(message);
            this.logger.log(
              `Successfully sent ${entityType} report to ${email}`
            );
          } catch (err) {
            this.logger.error("Failed to process email attachment queue:", err);
            channel.ack(message);
          }
        }
      );
    });
  }

  async generateExcel(
    data: any[],
    companyId: string,
    options?: {
      username?: string;
      modules?: string;
      features?: string;
    }
  ) {
    const dataSource = await this.tenantService.getTenantDataSource(companyId);
    const companyHeader = await this.settingService.getCompanyImages(
      dataSource,
      companyId
    );

    const workbook = new ExcelJS.Workbook();

    const { headerText } = await this.buildReportTitle(companyId, options);

    const title = ["time", "user", "username", "module", "feature", "status"];
    const header = title.map(
      (key) => key.charAt(0).toUpperCase() + key.slice(1) // This will capitalize the first character of title
    );
    await generateExcelWithHeaderImage(workbook, data, headerText, "Acitivity Report", title, header, companyHeader.headerUrl!)

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async generatePdf(
    data: any[],
    companyId: string,
    options?: {
      username?: string;
      features?: string;
      modules?: string;
    }
  ) {
    try {
      const dataSource = await this.tenantService.getTenantDataSource(companyId);

      const companyHeader = await this.settingService.getCompanyImages(
        dataSource,
        companyId
      );

      const htmlPath = getTemplatePath("activity-report.html");
      const html = await fs.readFile(htmlPath, "utf8");

      const { companyName, reportTitle, username, moduleTitle, featureTitle } =
        await this.buildReportTitle(companyId, options);

      const template = hbs.compile(html);
      const compiledHtml = template({
        companyHeaderUrl: companyHeader.headerUrl,
        companyName,
        reportTitle,
        username,
        moduleTitle,
        featureTitle,
        rows: data,
      });

      const browser = await puppeteer.launch();

      const page = await browser.newPage();

      await page.setContent(compiledHtml, {
        waitUntil: "networkidle0",
      });
      const timestamp = formatDateTime(new Date().toISOString());
      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: {
          top: "15mm",
          bottom: "25mm",
          left: "10mm",
          right: "10mm",
        },
        displayHeaderFooter: true,
        headerTemplate: '<div></div>',
        footerTemplate: `<div style="width:100%; border-top:1px solid #333; font-size:10px; padding-top:4px; font-family:Arial, sans-serif; display:flex; justify-content:flex-end; margin:0; box-sizing:border-box;">
    <!-- Right timestamp -->
    <div style="margin-left:auto; text-align:right; flex:none; margin-right:10mm">
        ${timestamp}
    </div>

    <!-- Center page numbers -->
    <div style="position:absolute; left:0; right:0; text-align:center; font-size:10px;">
        Page <span class="pageNumber"></span> of <span class="totalPages"></span>
    </div>
</div>`
      });

      await browser.close();

      return pdfBuffer;
    } catch (error) {
      console.error("Error generating PDF:", error);
      throw error;
    }
  }

  async generateActivityReport(
    type: "pdf" | "excel",
    companyId: string,
    filters: ActivityFilterDto,
    filteredData: any
  ) {
    const { users, features, modules } = filters;
    const options = {
      users: users?.length ? users.join(", ") : undefined,
      modules: modules?.length ? modules.join(", ") : undefined,
      features: features?.length ? features.join(", ") : undefined,
    };
    if (type === "pdf") {
      return await this.generatePdf(filteredData, companyId, options);
    }

    if (type === "excel") {
      return await this.generateExcel(filteredData, companyId, options);
    }

    throw new Error("Invalid type. Use 'pdf' or 'excel'.");
  }
}
