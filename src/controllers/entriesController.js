const pool = require('../config/db');

exports.getAll = async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM service_entries ORDER BY created_at DESC');
  res.json(rows);
};

exports.create = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { is_new_customer, customer_id, customer_name, contact, email, vehicle, vehicle_no, problems } = req.body;
    let custId = customer_id;
    if (is_new_customer) {
      const [r] = await conn.query(
        'INSERT INTO customers(name,contact,email,vehicle,vehicle_no,visits,total_spent) VALUES(?,?,?,?,?,1,0)',
        [customer_name, contact, email||null, vehicle, vehicle_no?.toUpperCase()]
      );
      custId = r.insertId;
    }
    const [[{ cnt }]] = await conn.query('SELECT COUNT(*) as cnt FROM service_entries');
    const id = 'SE' + String(cnt + 1).padStart(3, '0');
    const today = new Date().toISOString().slice(0, 10);
    await conn.query(
      'INSERT INTO service_entries(id,customer_id,customer_name,contact,email,vehicle,vehicle_no,problems,invoiced,date) VALUES(?,?,?,?,?,?,?,?,0,?)',
      [id, custId, customer_name, contact, email||null, vehicle, vehicle_no?.toUpperCase(), problems, today]
    );
    await conn.commit();
    res.json({ id, customer_id: custId });
  } catch (e) { await conn.rollback(); res.status(500).json({ error: e.message }); }
  finally { conn.release(); }
};
