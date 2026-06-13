import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { IntrospectionService } from './introspection.service';
import { RepoService } from '../repo/repo.service';

@Controller('api/introspection')
export class IntrospectionController {
  private readonly routeGate = new Map<string, { data: unknown; ts: number }>();

  constructor(
    private readonly introspectionService: IntrospectionService,
    private readonly repoService: RepoService,
  ) {}

  @Get('overview')
  getOverview() {
    return this.introspectionService.getOverview();
  }

  @Get('repo')
  getRepo(@Query('depth') depth?: string) {
    const parsedDepth = Number(depth);
    return this.introspectionService.getRepo(parsedDepth || 2);
  }

  @Get('db')
  getDb() {
    return this.introspectionService.getDb();
  }

  // POST because this mutates repo index state
  @Post('reindex')
  async reindex() {
    const gateKey = 'reindex';
    const now = Date.now();
    const previous = this.routeGate.get(gateKey);
    if (previous && now - previous.ts < 60_000) {
      throw new HttpException(
        'Reindex can only be triggered once every 60 seconds.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    this.routeGate.set(gateKey, { data: true, ts: now });
    await this.repoService.reindex();
    return { success: true, message: 'Reindex triggered' };
  }
}
