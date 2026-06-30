import { queryMysql } from "./mysql";

export async function queryReadOnly(
  sql: string,
  values: (string | number | boolean | null | Date)[] = [],
): Promise<{ rows: Record<string, unknown>[]; error?: string }> {
  try {
    const rows = await queryMysql<Record<string, unknown>>(sql, values);
    return { rows };
  } catch (e) {
    return {
      rows: [],
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
