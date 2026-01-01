import "server-only";
import mysql from "mysql2/promise";

type MysqlPool = mysql.Pool;

function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

function createPool(): MysqlPool {
    const host = requireEnv("MYSQL_HOST");
    const user = requireEnv("MYSQL_USER");
    const password = requireEnv("MYSQL_PASSWORD");
    const database = requireEnv("MYSQL_DATABASE");

    const portRaw = process.env.MYSQL_PORT;
    const port = portRaw ? Number(portRaw) : 3306;

    if (!Number.isFinite(port) || port <= 0) {
        throw new Error(`Invalid MYSQL_PORT: ${portRaw}`);
    }

    return mysql.createPool({
        host,
        port,
        user,
        password,
        database,
        waitForConnections: true,
        connectionLimit: 10,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
        namedPlaceholders: true,
    });
}

declare global {
    // eslint-disable-next-line no-var
    var __mysqlPool: MysqlPool | undefined;
}

export const mysqlPool: MysqlPool = globalThis.__mysqlPool ?? createPool();

if (process.env.NODE_ENV !== "production") {
    globalThis.__mysqlPool = mysqlPool;
}
