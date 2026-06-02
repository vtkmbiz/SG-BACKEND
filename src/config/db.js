const mysql = require('mysql2/promise');
require('dotenv').config();

// In serverless environments reuse the pool across invocations.
if (!global.__mysqlPool) {
  global.__mysqlPool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'swastik_garage',
    waitForConnections: true,
    connectionLimit: 10,
    timezone: '+05:30',
    // Fail fast if DB is unreachable
    connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT_MS) || 10000,
    // How long to try to acquire a connection from pool
    acquireTimeout: parseInt(process.env.DB_ACQUIRE_TIMEOUT_MS) || 10000,
  });
}

module.exports = global.__mysqlPool;
