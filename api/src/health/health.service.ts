import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class HealthService {
  constructor(private readonly db: DatabaseService) {}

  async checkDb(): Promise<boolean> {
    try {
      await this.db.getClient().raw('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
}
