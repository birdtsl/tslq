import { type DbType, hosxpConfig, isDbConfigured } from "./config";
import { queryDb } from "./query";

export type DbHealthStatus = {
  type: DbType;
  online: boolean;
};

export async function checkDbHealth(): Promise<DbHealthStatus | null> {
  if (!isDbConfigured(hosxpConfig)) {
    return null;
  }

  try {
    await queryDb(hosxpConfig, "SELECT 1 AS ok");
    return { type: hosxpConfig.type, online: true };
  } catch {
    return { type: hosxpConfig.type, online: false };
  }
}

export async function checkMysqlHealth(): Promise<boolean> {
  if (hosxpConfig.type !== "mysql" || !isDbConfigured(hosxpConfig)) {
    return false;
  }

  try {
    await queryDb(hosxpConfig, "SELECT 1 AS ok");
    return true;
  } catch {
    return false;
  }
}

export async function checkPostgresHealth(): Promise<boolean> {
  if (hosxpConfig.type !== "postgres" || !isDbConfigured(hosxpConfig)) {
    return false;
  }

  try {
    await queryDb(hosxpConfig, "SELECT 1 AS ok");
    return true;
  } catch {
    return false;
  }
}
