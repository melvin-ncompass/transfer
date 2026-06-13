import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  InternalServerErrorException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { CompanyService } from 'src/company/company.service';
import { TenantService } from 'src/database/tenants.service';
import { DataSource } from 'typeorm';

declare global {
  namespace Express {
    interface Request {
      datasource?: DataSource;
    }
  }
}

@Injectable()
export class CompanyGuard implements CanActivate {
  constructor(
    private tenantService: TenantService,
    private companyService: CompanyService
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: any = context.switchToHttp().getRequest<Request>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    const companyId = request.cookies['companyId'] as string;

    if (!companyId) {
      throw new UnauthorizedException('Missing required cookie: companyId');
    }

    const companyExists = this.companyService.findOne(companyId)
    if (!companyExists) throw new NotFoundException("Company not found!")

    const relation = await this.companyService.findRelation((user.id), companyId)
    if (!relation) throw new ForbiddenException(`Cannot Select Company ${companyId}`)

    const userId = user.id;

    if (!userId) {
      throw new UnauthorizedException('Invalid user payload: missing user ID');
    }

    try {
      const dataSource = await this.tenantService.getTenantDataSource(companyId);
      request.datasource = dataSource;
      return true;
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to initialize tenant database connection for ID: ${companyId}`,
      );
    }
  }
}