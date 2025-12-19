import { Injectable, OnModuleDestroy } from '@nestjs/common';
import knex, { Knex } from 'knex';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly client: Knex;

  constructor() {
    this.client = knex({
      client: 'pg',
      connection: {
        host: process.env.DB_HOST || 'db',
        port: Number(process.env.DB_PORT) || 5432,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'adventuremeets',
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
      },
      pool: {
        min: 1,
        max: 5,
      },
    });
  }

  getClient(): Knex {
    return this.client;
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.destroy();
  }
}
