const mysql = require("mysql2/promise");

function requireEnv(name) {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

function createPool() {
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
        timezone: "Z",
    });
}

// Keep a single pool in dev/hot reload scenarios
// eslint-disable-next-line no-underscore-dangle
global.__mysqlPool = global.__mysqlPool || createPool();

const pool = global.__mysqlPool;

async function query(sql, params) {
    const [rows] = await pool.execute(sql, params);
    return rows;
}

module.exports = {
    pool,
    query,
};
