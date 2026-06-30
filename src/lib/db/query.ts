import { type DbConfig, hosxpConfig } from "./config";
import { queryMysql } from "./mysql";
import { queryPostgres } from "./postgres";

type QueryParams = (string | number | boolean | null | Date)[] | unknown[];

export async function queryDb<T = Record<string, unknown>>(
  config: DbConfig,
  sql: string,
  params: QueryParams = [],
): Promise<T[]> {
  if (config.type === "mysql") {
    return queryMysql<T>(
      sql,
      params as (string | number | boolean | null | Date)[],
      config,
    );
  }

  return queryPostgres<T>(sql, params, config);
}

export async function queryHosxp<T = Record<string, unknown>>(
  sql: string,
  params: QueryParams = [],
): Promise<T[]> {
  return queryDb(hosxpConfig, sql, params);
}

/** @deprecated use queryHosxp */
export const queryDb1 = queryHosxp;
