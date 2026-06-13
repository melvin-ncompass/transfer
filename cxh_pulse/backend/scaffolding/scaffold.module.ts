import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { BootstrapModule } from './common/bootstrap/bootstrap.module';

@Module({
  imports: [UserModule,BootstrapModule],
  exports: [UserModule,BootstrapModule],
})
export class ScaffoldModule {}