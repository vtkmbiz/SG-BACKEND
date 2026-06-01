// Run once after importing schema: node src/seed.js
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./config/db');

async function seed() {
  console.log('🌱 Seeding passwords...');
  const users = [
    { username: 'owner',   password: 'owner123' },
    { username: 'kaushik', password: 'kaushik123' },
    { username: 'om',      password: 'om123' },
  ];
  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 10);
    const [r] = await pool.query('UPDATE users SET password=? WHERE username=?', [hash, u.username]);
    if (r.affectedRows > 0) console.log(`  ✅ ${u.username} → ${u.password}`);
    else console.log(`  ⚠️  ${u.username} not found — run schema.sql first`);
  }
  console.log('\n✅ Done! Login credentials:');
  console.log('   owner   / owner123');
  console.log('   kaushik / kaushik123');
  console.log('   om      / om123\n');
  process.exit(0);
}

seed().catch(e => { console.error('❌', e.message); process.exit(1); });
