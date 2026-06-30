export type DbType = "mysql" | "postgres";

export type DbConfig = {
  type: DbType;
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
};

function parseDbType(value: string | undefined, fallback: DbType): DbType {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "mysql" || normalized === "my") {
    return "mysql";
  }
  if (normalized === "postgres" || normalized === "postgresql" || normalized === "pg") {
    return "postgres";
  }
  return fallback;
}

function env(key: string): string | undefined {
  return process.env[key];
}

function readHosxpConfig(): DbConfig {
  const type = parseDbType(
    env("HOSXP_DB_TYPE") ?? env("DB1_TYPE"),
    "mysql",
  );
  const defaultPort = type === "mysql" ? 3306 : 5432;

  return {
    type,
    host: env("HOSXP_HOST") ?? env("DB1_HOST") ?? "localhost",
    port: Number(env("HOSXP_PORT") ?? env("DB1_PORT") ?? defaultPort),
    database: env("HOSXP_NAME") ?? env("DB1_NAME") ?? "",
    user: env("HOSXP_USER") ?? env("DB1_USER") ?? "",
    password: env("HOSXP_PASS") ?? env("DB1_PASS") ?? "",
  };
}

export const hosxpConfig = readHosxpConfig();

/** @deprecated use hosxpConfig */
export const db1Config = hosxpConfig;

export function isDbConfigured(config: DbConfig = hosxpConfig): boolean {
  return Boolean(config.database && config.user);
}

export function dbTypeLabel(type: DbType): string {
  return type === "mysql" ? "MySQL" : "PostgreSQL";
}

export function dbTypeShortLabel(type: DbType): string {
  return type === "mysql" ? "my" : "pg";
}
