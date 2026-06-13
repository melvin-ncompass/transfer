import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { RbaService } from './rba.service';
import { JwtAuthGuard } from 'src/common/guard/jwt.auth.guard';
import { CompanyGuard } from 'src/common/guard/company.guard';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UserRoleDto } from './dto/user-role.dto';
import { SyncRoleUsersDto } from './dto/sync-user-role.sto';
import { GetCookie } from 'src/common/decorators/get-cookies.decorator';
import { CurrentUser } from 'src/common/decorators/user.decorator';

@UseGuards(JwtAuthGuard, CompanyGuard)
@Controller('rba')
export class RbaController {
    constructor(private readonly rbaService: RbaService) { }

    @Post('fillRba')
    async seedModulesAndPermissions() {
        try {
            const result = await this.rbaService.seedModulesAndPermissions();
            return { success: true, message: result };
        } catch (error) {
            return { message: 'Seeding failed', data: error.message };
        }
    }

    @Get('list_permissions')
    async listModulesAndPermissions() {
        const permissions_list = await this.rbaService.getModulesWithPermissions();
        return {
            data: permissions_list,
            message: "Modules and Permissions returned",
        };
    }

    @Post('role')
    async createRole(@Body() createRoleDto: CreateRoleDto, @GetCookie("companyId") companyId: string) {
        const role = await this.rbaService.createRole(createRoleDto, companyId);
        return {
            data: role,
            message: "Role created successfully",
        };
    }

    @Patch('role/:id')
    async updateRole(
        @Param('id') id: string,
        @Body() updateRoleDto: UpdateRoleDto,
    ) {
        const role = await this.rbaService.update(+id, updateRoleDto);
        return {
            data: role,
            message: "Role updated successfully",
        };
    }

    @Get('role')
    async getAllRoles(@GetCookie("companyId") companyId: string) {
        const roles = await this.rbaService.getAllRoles(companyId);
        return {
            data: roles,
            message: roles.length
                ? "Roles fetched successfully"
                : "No Roles found",
        };
    }


    @Get('role_list')
    async getRolesList(@GetCookie("companyId") companyId: string) {
        const roles = await this.rbaService.getRolesList(companyId);
        return {
            data: roles,
            message: roles.length
                ? "Roles fetched successfully"
                : "No Roles found",
        };
    }

    @Get('role/:id')
    async getRoleById(@Param('id') id: string) {
        const role = await this.rbaService.getRoleById(+id);
        return {
            data: role,
            message: "Role fetched successfully",
        };
    }

    @Delete('role/:id')
    async deleteRole(@Param('id') id: string) {
        await this.rbaService.deleteRole(+id);
        return {
            message: "Role deleted successfully",
        };
    }

    @Post('assign_role')
    async assignRole(@Body() dto: UserRoleDto, @GetCookie("companyId") companyId: string) {
        const role = await this.rbaService.assignRole(dto, companyId);
        return {
            data: role,
            message: "Role assigned successfully",
        };
    }

    @Post('revoke_role')
    async revokeRole(@Body() dto: UserRoleDto, @GetCookie("companyId") companyId: string) {
        await this.rbaService.revokeRole(dto, companyId);
        return {
            message: "Role revoked successfully",
        };
    }

    @Post('sync_user_role')
    async syncRoleUsers(@Body() dto: SyncRoleUsersDto, @GetCookie("companyId") companyId: string) {
        const role = await this.rbaService.syncRoleUsers(dto, companyId);
        return {
            data: role,
            message: "Users against role updated successfully",
        };
    }

    @Post('default_role')
    async createDefaultRoles(@GetCookie("companyId") companyId: number) {
        const role = await this.rbaService.createDefaultRoles(companyId);
        return {
            data: role,
            message: "Roles created",
        };
    }

    @Get('user_permissions')
    async getUserPermissions(
        @CurrentUser('id') userId: string,
        @GetCookie('companyId') companyId: string,
    ) {
        return this.rbaService.getUserPermissions(userId, companyId);
    }
}
