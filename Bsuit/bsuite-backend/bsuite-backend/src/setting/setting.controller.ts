import { Controller, Get, Body, Patch, Param, UseGuards, UseInterceptors, Delete, Req, Query, BadRequestException, Post, NotFoundException, ForbiddenException, Res } from '@nestjs/common';
import { UpdateCompanyImageDto } from './dto/update-company-image.dto'
import { CompanyDB } from 'src/common/decorators/get-db.decorator';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from "src/common/guard/jwt.auth.guard";
import { CompanyGuard } from "src/common/guard/company.guard";
import { SettingService } from './setting.service';
import { UploadedFiles } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UpdateCompanyIdentityDto } from './dto/update-company-identity.dto';
import { UpdateReportStructureDto } from './dto/update-company-settings.dto';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { SendEmailDto } from './dto/send-email.dto';
import type { Request } from "express";
import { GetCookie } from 'src/common/decorators/get-cookies.decorator';
import { CreateInvoiceTemplateDto } from './dto/create-invoice-template.dto';
import { UpdateInvoiceTemplateDto } from './dto/update-invoice-template-dto';
import { ignoreModuleClassInterceptor } from 'src/common/decorators/ignore-interceptor.decorator';

@Controller('setting')
export class SettingController {
	constructor(private readonly settingService: SettingService) { }

	@UseGuards(JwtAuthGuard, CompanyGuard)
	@Patch('branding')
	@UseInterceptors(FileFieldsInterceptor([{ name: 'logo', maxCount: 1 }, { name: 'headerImage', maxCount: 1 },]))
	async updateCompanyImage(@Body() UpdateCompanyImageDto: UpdateCompanyImageDto, @UploadedFiles() files: any, @CompanyDB() dataSource: DataSource, @GetCookie("companyId") companyId: string) {
		const updated = await this.settingService.updateCompanyImage(
			UpdateCompanyImageDto,
			dataSource,
			companyId,
			{
				logo: files?.logo?.[0],
				headerImage: files?.headerImage?.[0],
			},
		);
		return {
			data: updated,
			message: "Branding Information updated successfully",
		};
	}

	@UseGuards(JwtAuthGuard, CompanyGuard)
	@Get('get_company_images')
	async getCompanyImages(@CompanyDB() dataSource: DataSource, @GetCookie("companyId") companyId: string,) {
		const data = await this.settingService.getCompanyImages(dataSource, companyId);
		return {
			data,
			message: 'Company Branding Details fetched successfully',
		};
	}

	@UseGuards(JwtAuthGuard, CompanyGuard)
	@Patch("identity")
	async updateCompanyIdentity(
		@Body() body: UpdateCompanyIdentityDto,
		@CompanyDB() dataSource: DataSource
	) {
		const updatedIdentity = await this.settingService.updateCompanyIdentity(
			body.companyIdentity,
			body.companyMetaData,
			dataSource
		);
		return {
			data: updatedIdentity,
			message: "Company identity updated successfully",
		};
	}

	@UseGuards(JwtAuthGuard, CompanyGuard)
	@Get('identity')
	async getCompanyIdentity(@CompanyDB() dataSource: DataSource) {
		const companyIdentity = await this.settingService.getCompanyIdentity(dataSource);
		return {
			data: companyIdentity,
			message: "Fetched Identity Info successfully",
		}
	}

	@UseGuards(JwtAuthGuard, CompanyGuard)
	@Post("users/invite_user")
	async inviteUser(
		@Body() dto: SendEmailDto,
		@GetCookie("companyId") companyId: string,
		@Req() req: Request,
		@CurrentUser('id') invitedByUserId: string
	) {
		const { email, roleId } = dto;
		if (!email) {
			throw new BadRequestException("Invalid email format");
		}
		if (!companyId) {
			throw new NotFoundException("Company id not found!")
		}
		const invitedUser = await this.settingService.inviteUser(email, +roleId, companyId, req, +invitedByUserId);
		return { message: `Email sent successfully to ${email}`, data: invitedUser };
	}

	@ignoreModuleClassInterceptor()
	@Post("users/verify_magic_link")
	async verifyMagicLink(@Query("token") token: string) {
		if (!token) {
			throw new BadRequestException("Token is required");
		}
		await this.settingService.verifyMagicLink(token);
		return { valid: true };
	}

	@ignoreModuleClassInterceptor()
	@Post("users/set_password")
	async setPassword(
		@Query("token") token: string,
		@Body() dto: { password: string; confirmPassword: string }
	) {
		await this.settingService.setPassword(token, dto);
		return { message: "Password set successfully" };
	}

	@UseGuards(JwtAuthGuard, CompanyGuard)
	@Get("users/list")
	async listUsers(
		@GetCookie("companyId") companyId: string,
	) {
		const fetchedData = await this.settingService.listUsersForCompany(companyId);
		return { message: "Users fetched successfully!", data: fetchedData }
	}

	@UseGuards(JwtAuthGuard, CompanyGuard)
	@Delete("users/:userId")
	async removeUserFromCompany(
		@GetCookie("companyId") companyId: string,
		@Param("userId") userId: string,
		@CurrentUser('id') currentUserId: number,
	) {
		const deletedUser = await this.settingService.removeUserFromCompany(currentUserId, +userId, companyId);
		return { message: "User deleted successfully!", data: deletedUser }
	}

	@UseGuards(JwtAuthGuard, CompanyGuard)
	@Get("report_structure")
	async getReportStructure(
		@CompanyDB() ds: DataSource,
		@GetCookie("companyId") companyId: string,
	) {
		return this.settingService.getReportStructure(ds, companyId);
	}

	@UseGuards(JwtAuthGuard, CompanyGuard)
	@Patch("report_structure/update")
	async updateReportStructure(
		@CompanyDB() ds: DataSource,
		@GetCookie("companyId") companyId: string,
		@Body() updateReportStructureDto: UpdateReportStructureDto
	) {
		const updatedData = await this.settingService.updateReportStructure(ds, companyId, updateReportStructureDto);
		return { message: "Report updated successfully", data: updatedData }
	}

	@UseGuards(JwtAuthGuard, CompanyGuard)
	@Get('company_details')
	async getCompanyDetails(@CompanyDB() dataSource: DataSource, @GetCookie("companyId") companyId: string,) {
		const companyDetails = await this.settingService.getCompanyDetails(dataSource, companyId);
		return {
			data: companyDetails,
			message: "Fetched Company Details successfully",
		}
	}

	// custom domain
	@UseGuards(JwtAuthGuard, CompanyGuard)
	@Get('custom_domain_exists')
	async customDomainExists(@Body('customDomain') customName: string, @GetCookie("companyId") companyId: string,) {
		return await this.settingService.customDomainExists(companyId, customName);
	}

	@UseGuards(JwtAuthGuard, CompanyGuard)
	@Post("save_custom_domain")
	async saveCustomDomain(@GetCookie("companyId") companyId: string, @Body("customDomain") customDomain: string,) {
		const cName = await this.settingService.saveCustomDomain(companyId, customDomain);
		return {
			message: 'Add CNAME record to continue',
			data: cName
		}
	}

	// invoice templates
	@UseGuards(JwtAuthGuard, CompanyGuard)
	@Get("get_invoice_templates")
	async getInvoiceTemplates(@CompanyDB() dataSource: DataSource) {
		const data = await this.settingService.getInvoiceTemplates(dataSource);
		return { message: 'Fetched Invoice Templates Successfully!', data: data };
	}

	@UseGuards(JwtAuthGuard, CompanyGuard)
	@Get("get_invoice_template/:id")
	async getInvoiceTemplateById(@Param('id') id: string, @CompanyDB() dataSource: DataSource) {
		const data = await this.settingService.getInvoiceTemplateById(+id, dataSource);
		return { message: 'Fetched Invoice Template Successfully!', data: data };
	}

	@UseGuards(JwtAuthGuard, CompanyGuard)
	@Post("set_default_template/:id")
	async setDefaultInvoiceTemplate(@Param('id') templateId: string, @CompanyDB() dataSource: DataSource) {
		const template = await this.settingService.setDefaultTemplate(+templateId, dataSource);
		return {
			message: `Default Invoice Template updated successfully`,
			data: template
		};
	}

	@UseGuards(JwtAuthGuard, CompanyGuard)
	@Post("add_invoice_template")
	async addInvoiceTemplate(@Body() invoiceTemplateDto: CreateInvoiceTemplateDto, @CompanyDB() dataSource: DataSource) {
		const template = await this.settingService.addInvoiceTemplate(dataSource, invoiceTemplateDto);
		return { message: 'Invoice Template added Successfully!', data: template };
	}

	@UseGuards(JwtAuthGuard, CompanyGuard)
	@Patch("update_invoice_template/:id")
	async updateInvoiceTemplate(@Param('id') id: string, @Body() invoiceTemplateDto: UpdateInvoiceTemplateDto, @CompanyDB() dataSource: DataSource) {
		const template = await this.settingService.updateInvoiceTemplate(+id, dataSource, invoiceTemplateDto);
		return { message: 'Invoice Template updated Successfully!', data: template };
	}

	@UseGuards(JwtAuthGuard, CompanyGuard)
	@Delete('delete_invoice_template/:id')
	async removeInvoiceTemplate(@Param('id') id: string, @CompanyDB() dataSource: DataSource) {
		const deletedTemplate = await this.settingService.removeInvoiceTemplate(+id, dataSource);
		return {
			data: deletedTemplate,
			message: "Invoice Template deleted successfully",
		};
	}
}
