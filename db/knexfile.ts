const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const {
  DB_HOST = 'db',
  DB_PORT = 5432,
  DB_USER = 'postgres',
  DB_PASSWORD = 'postgres',
  DB_NAME = 'meetplanner',
} = process.env;

/** @type {import('knex').Knex.Config} */
const baseConfig = {
  client: 'pg',
  connection: {
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
  },
  migrations: {
    directory: './migrations',
    tableName: 'knex_migrations',
  },
  pool: {
    min: 2,
    max: 10,
  },
  seeds: {
    directory: './seeds',
    extension: 'ts',
  }
};

module.exports = baseConfig;
