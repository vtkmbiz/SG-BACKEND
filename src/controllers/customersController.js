const pool = require('../config/db');

exports.search = async (req, res) => {
  const { q } = req.query;
  let sql = 'SELECT * FROM customers';
  let params = [];
  if (q) { sql += ' WHERE name LIKE ? OR contact LIKE ? OR vehicle_no LIKE ?'; params = [`%${q}%`,`%${q}%`,`%${q}%`]; }
  sql += ' ORDER BY name';
  const [rows] = await pool.query(sql, params);
  res.json(rows);
};

exports.create = async (req, res) => {
  try {
    const { name, contact, email, vehicle, vehicle_no } = req.body;
    const [r] = await pool.query(
      'INSERT INTO customers(name,contact,email,vehicle,vehicle_no,visits,total_spent) VALUES(?,?,?,?,?,1,0)',
      [name, contact, email||null, vehicle, vehicle_no?.toUpperCase()]
    );
    res.json({ id: r.insertId, name, contact, vehicle, vehicle_no: vehicle_no?.toUpperCase() });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
