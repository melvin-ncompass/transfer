import { Controller, Get, Param, Res, Header } from '@nestjs/common';
import { AppService } from './app.service';
import type { Response } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  //  Serve vector tiles
  @Get('tiles/:z/:x/:y.mvt')
  @Header('Content-Type', 'application/x-protobuf')
  async getTiles(@Param() params, @Res() res: Response): Promise<void> {
    const buffer = await this.appService.getTiles(params);
    res.send(buffer);
  }

  //  Serve bounding box for auto zoom
  @Get('bounds')
  async getBounds(@Res() res: Response): Promise<void> {
    const bbox = await this.appService.getBounds();
    res.json({ bbox });
  }
}
