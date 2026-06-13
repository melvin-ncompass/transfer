import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Header,
  StreamableFile,
  InternalServerErrorException,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Query,
  Res,
} from "@nestjs/common";
import { ContactService } from "./contact.service";
import { CreateContactDto } from "./dto/create-contact.dto";
import { UpdateContactDto } from "./dto/update-contact.dto";
import { CompanyDB } from "src/common/decorators/get-db.decorator";
import { DataSource } from "typeorm";
import { JwtAuthGuard } from "src/common/guard/jwt.auth.guard";
import {
  IgnoreInterceptor,
  ignoreModuleClassInterceptor,
} from "src/common/decorators/ignore-interceptor.decorator";
import { FileInterceptor } from "@nestjs/platform-express";
import { ContactCsvMappingDto } from "./dto/contact-csv-mapping.dto";
import { CompanyGuard } from "src/common/guard/company.guard";
import express from "express";
import { GetCookie } from "src/common/decorators/get-cookies.decorator";
import { SwaggerEndpoint } from "src/swagger/custom-decorator";
import { contactSwagger } from "./contact.swagger";
import { CurrentUser } from "src/common/decorators/user.decorator";

@Controller("contact")
@UseGuards(JwtAuthGuard, CompanyGuard)
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @SwaggerEndpoint(contactSwagger, "CREATE")
  async create(
    @Body() createContactDto: CreateContactDto,
    @CompanyDB() dataSource: DataSource,
  ) {
    const contact = await this.contactService.create(
      createContactDto,
      dataSource,
    );
    return {
      message: "Contact created successfully",
      data: contact,
    };
  }

  @Patch(":id")
  @SwaggerEndpoint(contactSwagger, "UPDATE")
  async update(
    @Param("id") id: string,
    @Body() updateContactDto: UpdateContactDto,
    @CompanyDB() dataSource: DataSource,
  ) {
    const updated = await this.contactService.update(
      +id,
      updateContactDto,
      dataSource,
    );
    return {
      message: "Contact updated successfully",
      data: updated,
    };
  }

  @Delete(":id")
  @SwaggerEndpoint(contactSwagger, "DELETE")
  async remove(@Param("id") id: string, @CompanyDB() dataSource: DataSource) {
    const deletdData = await this.contactService.remove(+id, dataSource);
    return { message: "Contact deleted successfully", data: deletdData };
  }

  @Get()
  @SwaggerEndpoint(contactSwagger, "CREATE")
  async findAllContacts(
    @CompanyDB() dataSource: DataSource,
    @Query("unArchivedOnly") unArchivedOnly?: string,
  ) {
    const contacts = await this.contactService.findAllContacts(
      dataSource,
      unArchivedOnly,
    );
    return {
      data: contacts,
      message: contacts.length
        ? "Contacts fetched successfully"
        : "No contacts found",
    };
  }

  @Get("demo_csv")
  @SwaggerEndpoint(contactSwagger, "DEMO_CSV")
  @Header("Content-Type", "text/csv")
  @Header("Content-Disposition", "attachment; filename=contact_demo.csv")
  @IgnoreInterceptor()
  async exportCsv() {
    try {
      const fileStream: StreamableFile = this.contactService.getCsvStream();

      return fileStream;
    } catch (error) {
      console.error("CSV export error:", error);
      throw new InternalServerErrorException("File not sent!");
    }
  }

  @Post("validate_csv")
  @SwaggerEndpoint(contactSwagger, "VALIDATE_CSV")
  @UseInterceptors(FileInterceptor("file"))
  async validateCsv(
    @UploadedFile() file: Express.Multer.File,
    @Body() mapping: ContactCsvMappingDto,
  ) {
    if (!file) {
      throw new BadRequestException("CSV file is required.");
    }

    return this.contactService.processContactCsvFile(file.buffer, mapping);
  }

  @Post("bulk_create")
  @SwaggerEndpoint(contactSwagger, "BULK_CREATE")
  @IgnoreInterceptor()
  async bulkCreate(
    @CompanyDB() ds: DataSource,
    @Body() rows: ContactCsvMappingDto[],
  ) {
    const result = await this.contactService.createContacts(rows, ds);
    return result;
  }

  @Post("update_duplicates")
  @SwaggerEndpoint(contactSwagger, "UPDATE_DUPLICATES")
  async updateDuplicates(
    @Body() rows: ContactCsvMappingDto[],
    @CompanyDB() ds: DataSource,
  ) {
    const result = await this.contactService.updateDuplicateContacts(rows, ds);
    return result;
  }

  @Get(":id")
  @SwaggerEndpoint(contactSwagger, "GET_ONE")
  async findContactById(
    @Param("id") id: string,
    @CompanyDB() dataSource: DataSource,
  ) {
    const contact = await this.contactService.findContactById(+id, dataSource);
    return { data: contact, message: "Contact fetched successfully" };
  }

  @Patch(":id/archive")
  @SwaggerEndpoint(contactSwagger, "ARCHIVE")
  async archiveContact(
    @CompanyDB() dataSource: DataSource,
    @Param("id") id: string,
  ) {
    return {
      data: await this.contactService.archive(dataSource, +id),
    };
  }

  @Patch(":id/toggle_report")
  @ignoreModuleClassInterceptor()
  @SwaggerEndpoint(contactSwagger, "TOGGLE_REPORT")
  async toggleReport(
    @CompanyDB() dataSource: DataSource,
    @Param("id") id: string,
  ) {
    return {
      data: await this.contactService.toggleReports(dataSource, +id),
    };
  }

  @Post("export")
  @SwaggerEndpoint(contactSwagger, "EXPORT")
  async exportContactExcel(
    @CompanyDB() dataSource: DataSource,
    @GetCookie("companyId") companyId: string,
    @Res() res: express.Response,
    @CurrentUser("id") userId: number,
  ) {
    const { buffer, change_of_data, fileName } =
      await this.contactService.generateContact(dataSource, companyId, userId);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileName}.xlsx"`,
    );
    res.setHeader(
      "Access-Control-Expose-Headers",
      "Content-Disposition, Content-Length",
    );
    res.setHeader("Content-Length", buffer.length);
    res.end(buffer);
    return {
      message: "Contacts exported successfully",
      data: {
        change_of_data,
      },
    };
  }
}
