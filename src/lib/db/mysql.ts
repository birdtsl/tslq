import mysql from "mysql2/promise";

import { type DbConfig, hosxpConfig } from "./config";

const pools = new Map<string, mysql.Pool>();

function poolKey(config: DbConfig) {
  return `${config.host}:${config.port}:${config.database}:${config.user}`;
}

export function getMysqlPool(config: DbConfig) {
  if (config.type !== "mysql") {
    throw new Error(`Expected MySQL config, got ${config.type}`);
  }

  const key = poolKey(config);
  let pool = pools.get(key);

  if (!pool) {
    pool = mysql.createPool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
    pools.set(key, pool);
  }

  return pool;
}

export async function queryMysql<T = Record<string, unknown>>(
  sql: string,
  params: (string | number | boolean | null | Date)[] = [],
  config: DbConfig = hosxpConfig,
): Promise<T[]> {
  if (config.type !== "mysql") {
    throw new Error(`Database is configured as ${config.type}. Use queryPostgres() or queryDb() instead.`);
  }

  const [rows] = await getMysqlPool(config).execute(sql, params);
  return rows as T[];
}
