import { Module, Global } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { ObservabilityController } from './observability.controller';

@Global()
@Module({
    controllers: [ObservabilityController],
    providers: [MetricsService],
    exports: [MetricsService]
})
export class ObservabilityModule { }
