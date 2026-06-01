const pool = require('../config/db');

const fmtINR = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

exports.getAll = async (req, res) => {
  const [invoices] = await pool.query('SELECT * FROM invoices ORDER BY created_at DESC');
  const [items] = await pool.query('SELECT * FROM invoice_items');
  res.json(invoices.map(inv => ({ ...inv, items: items.filter(it => it.invoice_id === inv.id) })));
};

exports.getOne = async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM invoices WHERE id=?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  const [items] = await pool.query('SELECT * FROM invoice_items WHERE invoice_id=?', [req.params.id]);
  res.json({ ...rows[0], items });
};

exports.create = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { entry_id, customer_id, customer_name, contact, email, vehicle, vehicle_no, services, delivery_date, delivery_time } = req.body;
    const total = services.reduce((s, it) => s + parseFloat(it.charge), 0);
    const [[{ cnt }]] = await conn.query('SELECT COUNT(*) as cnt FROM invoices');
    const id = 'SAR' + String(cnt + 1).padStart(3, '0');
    const today = new Date().toISOString().slice(0, 10);
    await conn.query(
      'INSERT INTO invoices(id,entry_id,customer_id,customer_name,contact,email,vehicle,vehicle_no,total,status,delivery_date,delivery_time,date) VALUES(?,?,?,?,?,?,?,?,?,"pending",?,?,?)',
      [id, entry_id||null, customer_id, customer_name, contact, email||null, vehicle, vehicle_no, total, delivery_date||null, delivery_time||null, today]
    );
    for (const svc of services) {
      await conn.query('INSERT INTO invoice_items(invoice_id,description,charge) VALUES(?,?,?)', [id, svc.description||svc.desc, parseFloat(svc.charge)]);
    }
    if (entry_id) await conn.query('UPDATE service_entries SET invoiced=1 WHERE id=?', [entry_id]);
    if (customer_id) await conn.query('UPDATE customers SET visits=visits+1, total_spent=total_spent+? WHERE id=?', [total, customer_id]);
    await conn.commit();
    const [inv] = await pool.query('SELECT * FROM invoices WHERE id=?', [id]);
    const [items] = await pool.query('SELECT * FROM invoice_items WHERE invoice_id=?', [id]);
    res.json({ ...inv[0], items });
  } catch (e) { await conn.rollback(); res.status(500).json({ error: e.message }); }
  finally { conn.release(); }
};

exports.updateStatus = async (req, res) => {
  const { status } = req.body;
  await pool.query('UPDATE invoices SET status=? WHERE id=?', [status, req.params.id]);
  res.json({ success: true, status });
};

exports.getWhatsAppMessage = async (req, res) => {
  try {
    const { type } = req.query; // 'invoice' or 'reminder'
    const [rows] = await pool.query('SELECT * FROM invoices WHERE id=?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    const inv = rows[0];
    const [items] = await pool.query('SELECT * FROM invoice_items WHERE invoice_id=?', [req.params.id]);
    const upiId = process.env.UPI_ID || '9898165220@okbizaxis';
    const phone = inv.contact?.replace(/\D/g, '');

    let message;
    if (type === 'reminder') {
      message = `🔔 *Payment Reminder — Swastik Auto Repairers*\n━━━━━━━━━━━━━━━━━━━━\nDear *${inv.customer_name}*,\n\nYour invoice *${inv.id}* has a pending payment.\n\n🚗 Vehicle: *${inv.vehicle} (${inv.vehicle_no})*\n💰 Amount Due: *${fmtINR(inv.total)}*\n📅 Invoice Date: ${inv.date}\n━━━━━━━━━━━━━━━━━━━━\n💳 *Pay instantly via UPI:*\n📱 *${upiId}*\n\nWorks on: G Pay · PhonePe · Paytm · BHIM UPI\n\nKindly clear the payment at your earliest convenience.\nThank you! 🙏\n\n_— Swastik Auto Repairers, Jamnagar_\n_📞 9898165220 · 9998013335_`;
    } else {
      const itemLines = items.map((it, i) => `${i+1}. ${it.description} — ${fmtINR(it.charge)}`).join('\n');
      message = `🔧 *Swastik Auto Repairers*\n59 Digvijay Plot, Jamnagar | 📞 9898165220\n\n✅ *INVOICE — ${inv.id}*\n━━━━━━━━━━━━━━━━━━━━\n👤 Customer: *${inv.customer_name}*\n🚗 Vehicle: *${inv.vehicle}*\n🔢 Reg. No.: *${inv.vehicle_no}*\n📅 Date: ${inv.date}${inv.delivery_date ? '\n🚚 Delivery: ' + inv.delivery_date : ''}\n━━━━━━━━━━━━━━━━━━━━\n${itemLines}\n━━━━━━━━━━━━━━━━━━━━\n💰 *TOTAL: ${fmtINR(inv.total)}*\n\n💳 *Pay via UPI:*\n📱 *${upiId}*\n✅ G Pay · PhonePe · Paytm · BHIM\n\n🙏 Thank you for trusting Swastik Auto!\n_Please save the invoice PDF for your records_`;
    }

    const waLink = `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`;
    res.json({ message, waLink, phone });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
