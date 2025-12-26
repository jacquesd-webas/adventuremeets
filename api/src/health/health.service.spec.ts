import { HealthService } from './health.service';
import { DatabaseService } from '../database/database.service';

describe('HealthService', () => {
  let healthService: HealthService;
  let db: DatabaseService;
  const rawMock = jest.fn();

  beforeEach(() => {
    db = {
      // Only the getClient/raw contract is required for this test.
      getClient: () => ({ raw: rawMock }),
    } as unknown as DatabaseService;
    healthService = new HealthService(db);
    rawMock.mockReset();
  });

  it('returns true when the DB check succeeds', async () => {
    rawMock.mockResolvedValueOnce({ rows: [{ '?column?': 1 }] });

    await expect(healthService.checkDb()).resolves.toBe(true);
    expect(rawMock).toHaveBeenCalledWith('SELECT 1');
  });

  it('returns false when the DB check fails', async () => {
    rawMock.mockRejectedValueOnce(new Error('db down'));

    await expect(healthService.checkDb()).resolves.toBe(false);
  });
});
