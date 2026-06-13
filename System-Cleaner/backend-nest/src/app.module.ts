import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CleanupModule } from './cleanup/cleanup.module';

@Module({
  imports: [CleanupModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
