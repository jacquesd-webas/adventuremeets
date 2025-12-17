import { Controller, Get, HttpException, HttpStatus, Redirect } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Public()
  @Get()
  @Redirect('/health', 302)
  root() {
    return;
  }

  @Public()
  @Get('health')
  async health() {
    const ok = await this.healthService.checkDb();
    if (!ok) {
      throw new HttpException({ status: 'not ok' }, HttpStatus.BAD_REQUEST);
    }
    return { status: 'ok' };
  }
}
