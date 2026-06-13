import { SwaggerEndpoint } from 'src/utils/swagger/custom-swagger.decorator';
import {
  Controller,
  Get
} from '@nestjs/common';
import { CheckHealthSwagger } from './swagger/check-health.swagger';

@Controller('check-health')
export class CheckHealthController {
  @Get()
  @SwaggerEndpoint(CheckHealthSwagger, 'GET_CHECK_HEALTH')
  findAll() {
    return 'The app is running!';
  }
}
