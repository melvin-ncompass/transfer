import { Controller, Get } from '@nestjs/common';
import { MetricsService } from './metrics.service';

@Controller('api/observability')
export class ObservabilityController {
    constructor(private readonly metricsService: MetricsService) { }

    @Get('metrics')
    getMetrics() {
        return this.metricsService.getSystemHealthStatus();
    }
}
