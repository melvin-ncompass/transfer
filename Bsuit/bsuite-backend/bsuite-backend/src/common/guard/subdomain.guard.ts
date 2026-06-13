import { Injectable, CanActivate, ExecutionContext, ForbiddenException, BadRequestException } from '@nestjs/common';
import { CompanyService } from '../../company/company.service';

@Injectable()
export class SubDomainGuard implements CanActivate {
    constructor(private readonly companyService: CompanyService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest();

        const host = req.hostname;
        const hostParts = host.split('.');
        console.log(host, '...', hostParts)
        const MAIN_HOST = process.env.MAIN_HOST_NAME;
        const SUBDOMAIN = process.env.SUBDOMAIN;

        if (host === MAIN_HOST) {
            return true;
        }

        if (host.endsWith(SUBDOMAIN)) {
            const productDomain = hostParts[0];
            console.log(productDomain,'prod domain')
            try {
                const company = await this.companyService.findByProductDomain(productDomain);
                req['company'] = company;
                console.log(company,'company')
                if (!req.user) {
                    throw new ForbiddenException('User not authenticated');
                }

                const userId = req.user.id;
                console.log(userId,'user id')
                const hasAccess = await this.companyService.checkUserAccess(userId, company.companyId);
                console.log(hasAccess,'has access',!hasAccess)
                if (!hasAccess) {
                    throw new ForbiddenException('Your credentials have no access for this company');
                }
                
                return true;
            } catch (err) {
                if (err instanceof ForbiddenException) {
                    throw err;
                }
                throw new BadRequestException('Invalid company subdomain');
            }
        }

        return true;
    }
}
