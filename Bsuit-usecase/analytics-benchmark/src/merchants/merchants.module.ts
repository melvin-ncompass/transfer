import { Module } from '@nestjs/common';
import { MerchantsController } from './merchants.controller';
import { MerchantsService } from './merchants.service';

/**
 * Module for merchant-related functionality.
 * Registers the MerchantsController and MerchantsService.
 */
@Module({
  controllers: [MerchantsController],
  providers: [MerchantsService],
  exports: [MerchantsService],
})
export class MerchantsModule {}
