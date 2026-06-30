import { Pool } from "pg";

import { type DbConfig, hosxpConfig } from "./config";

const pools = new Map<string, Pool>();

function poolKey(config: DbConfig) {
  return `${config.host}:${config.port}:${config.database}:${config.user}`;
}

export function getPostgresPool(config: DbConfig) {
  if (config.type !== "postgres") {
    throw new Error(`Expected PostgreSQL config, got ${config.type}`);
  }

  const key = poolKey(config);
  let pool = pools.get(key);

  if (!pool) {
    pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      max: 10,
    });
    pools.set(key, pool);
  }

  return pool;
}

export async function queryPostgres<T = unknown>(
  sql: string,
  params?: unknown[],
  config: DbConfig = hosxpConfig,
): Promise<T[]> {
  if (config.type !== "postgres") {
    throw new Error(`Database is configured as ${config.type}. Use queryMysql() or queryDb() instead.`);
  }

  const result = await getPostgresPool(config).query(sql, params);
  return result.rows as T[];
}
