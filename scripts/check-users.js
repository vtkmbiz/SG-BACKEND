require('dotenv').config();
const pool = require('../src/config/db');

(async () => {
    try {
        const [rows] = await pool.query("SELECT COUNT(*) AS cnt FROM users");
        console.log('users table row count:', rows[0].cnt);
        process.exit(0);
    } catch (err) {
        console.error('Error querying users table:', err.message || err);
        process.exit(1);
    }
})();
