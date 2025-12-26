import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('HealthController', () => {
  let controller: HealthController;
  const checkDb = jest.fn();
  const healthService: Partial<HealthService> = { checkDb };

  beforeEach(() => {
    checkDb.mockReset();
    controller = new HealthController(healthService as HealthService);
  });

  it('returns ok when health service reports healthy', async () => {
    checkDb.mockResolvedValueOnce(true);

    await expect(controller.health()).resolves.toEqual({ status: 'ok' });
  });

  it('throws HttpException when health service reports unhealthy', async () => {
    checkDb.mockResolvedValueOnce(false);

    await expect(controller.health()).rejects.toMatchObject(
      new HttpException({ status: 'not ok' }, HttpStatus.BAD_REQUEST)
    );
  });
});
