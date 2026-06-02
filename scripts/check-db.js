require('dotenv').config();
const pool = require('../src/config/db');

(async () => {
    try {
        const [rows] = await pool.query('SELECT 1 + 1 AS result');
        console.log('DB connected — test query result:', rows[0]);
        process.exit(0);
    } catch (err) {
        console.error('DB connection failed:', err.message || err);
        process.exit(1);
    }
})();
