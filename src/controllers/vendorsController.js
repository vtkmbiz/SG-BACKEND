const pool = require('../config/db');

exports.getAll = async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM vendors ORDER BY name');
  res.json(rows);
};

exports.create = async (req, res) => {
  const { name, contact, type, address } = req.body;
  const [r] = await pool.query('INSERT INTO vendors(name,contact,type,address,balance) VALUES(?,?,?,?,0)', [name, contact, type, address]);
  res.json({ id: r.insertId, name, contact, type, address, balance: 0 });
};

exports.getPurchases = async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM purchases ORDER BY created_at DESC');
  res.json(rows);
};

exports.createPurchase = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { vendor_id, item, qty, rate, entry_id, entry_label } = req.body;
    const amount = parseFloat(qty) * parseFloat(rate);
    const [[{ cnt }]] = await conn.query('SELECT COUNT(*) as cnt FROM purchases');
    const id = 'PUR' + String(cnt + 1).padStart(3, '0');
    const today = new Date().toISOString().slice(0, 10);
    const [[v]] = await conn.query('SELECT name FROM vendors WHERE id=?', [vendor_id]);
    await conn.query(
      'INSERT INTO purchases(id,vendor_id,vendor_name,item,qty,rate,amount,entry_id,entry_label,date) VALUES(?,?,?,?,?,?,?,?,?,?)',
      [id, vendor_id, v?.name, item, qty, rate, amount, entry_id||null, entry_label||null, today]
    );
    await conn.query('UPDATE vendors SET balance=balance+? WHERE id=?', [amount, vendor_id]);
    await conn.commit();
    res.json({ id, amount });
  } catch (e) { await conn.rollback(); res.status(500).json({ error: e.message }); }
  finally { conn.release(); }
};

exports.getPayments = async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM vendor_payments ORDER BY created_at DESC');
  res.json(rows);
};

exports.createPayment = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { vendor_id, amount, note } = req.body;
    const [[{ cnt }]] = await conn.query('SELECT COUNT(*) as cnt FROM vendor_payments');
    const id = 'VP' + String(cnt + 1).padStart(3, '0');
    const today = new Date().toISOString().slice(0, 10);
    const [[v]] = await conn.query('SELECT name FROM vendors WHERE id=?', [vendor_id]);
    await conn.query(
      'INSERT INTO vendor_payments(id,vendor_id,vendor_name,amount,note,date) VALUES(?,?,?,?,?,?)',
      [id, vendor_id, v?.name, amount, note||null, today]
    );
    await conn.query('UPDATE vendors SET balance=GREATEST(0,balance-?) WHERE id=?', [amount, vendor_id]);
    await conn.commit();
    res.json({ id });
  } catch (e) { await conn.rollback(); res.status(500).json({ error: e.message }); }
  finally { conn.release(); }
};

exports.getLedger = async (req, res) => {
  const { id } = req.params;
  const [[vendor]] = await pool.query('SELECT * FROM vendors WHERE id=?', [id]);
  if (!vendor) return res.status(404).json({ error: 'Not found' });
  const [purchases] = await pool.query('SELECT * FROM purchases WHERE vendor_id=? ORDER BY created_at DESC', [id]);
  const [payments] = await pool.query('SELECT * FROM vendor_payments WHERE vendor_id=? ORDER BY created_at DESC', [id]);
  res.json({ vendor, purchases, payments });
};
