import { Module } from '@nestjs/common';
import { TenantService } from './tenants.service';

@Module({
  providers: [TenantService],
  exports:[TenantService]
})
export class DatabaseModule { }
