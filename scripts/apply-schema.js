require('dotenv').config();
const fs = require('fs');
const mysql = require('mysql2/promise');

(async () => {
    try {
        let sql = fs.readFileSync('schema.sql', 'utf8');
        const targetDb = process.env.DB_NAME || 'swastik_garage';

        // Replace hardcoded database name in schema.sql with the configured DB_NAME
        sql = sql.replace(/CREATE DATABASE IF NOT EXISTS \w+/i, `CREATE DATABASE IF NOT EXISTS ${targetDb}`);
        sql = sql.replace(/USE \w+;/i, `USE ${targetDb};`);

        const conn = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT) || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            multipleStatements: true,
        });

        console.log('Applying schema...');
        await conn.query(sql);
        console.log('Schema applied successfully.');
        await conn.end();
        process.exit(0);
    } catch (err) {
        console.error('Failed to apply schema:', err.message || err);
        process.exit(1);
    }
})();
