import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service.js';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private appService: AppService) {}

  @Get('health')
  health() {
    return this.appService.health();
  }
}
