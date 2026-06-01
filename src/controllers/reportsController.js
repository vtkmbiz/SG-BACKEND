const pool = require('../config/db');

exports.getReport = async (req, res) => {
  const { period = 'all' } = req.query;
  let dateFilter = '';
  if (period === 'today') dateFilter = "AND DATE(i.date)=CURDATE()";
  else if (period === 'week') dateFilter = "AND i.date>=DATE_SUB(CURDATE(),INTERVAL 7 DAY)";
  else if (period === 'month') dateFilter = "AND YEAR(i.date)=YEAR(CURDATE()) AND MONTH(i.date)=MONTH(CURDATE())";

  const [[summary]] = await pool.query(`
    SELECT
      COUNT(*) as total_invoices,
      COALESCE(SUM(total),0) as total_revenue,
      COALESCE(SUM(CASE WHEN status='paid' THEN total ELSE 0 END),0) as collected,
      COALESCE(SUM(CASE WHEN status='due' THEN total ELSE 0 END),0) as due,
      COALESCE(SUM(CASE WHEN status='pending' THEN total ELSE 0 END),0) as pending,
      COUNT(DISTINCT customer_id) as unique_customers
    FROM invoices i WHERE 1=1 ${dateFilter}
  `);

  const [topServices] = await pool.query(`
    SELECT ii.description, COUNT(*) as count
    FROM invoice_items ii JOIN invoices i ON ii.invoice_id=i.id
    WHERE 1=1 ${dateFilter}
    GROUP BY ii.description ORDER BY count DESC LIMIT 5
  `);

  const [invoices] = await pool.query(`SELECT * FROM invoices i WHERE 1=1 ${dateFilter} ORDER BY i.created_at DESC`);
  res.json({ summary, topServices, invoices });
};

exports.getSettlements = async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM settlements ORDER BY date DESC');
  res.json(rows);
};

exports.createSettlement = async (req, res) => {
  const { earned, paid_vendors, expenses, note } = req.body;
  const taken_home = parseFloat(earned) - parseFloat(paid_vendors) - parseFloat(expenses);
  const [[{ cnt }]] = await pool.query('SELECT COUNT(*) as cnt FROM settlements');
  const id = 'SET' + String(cnt + 1).padStart(3, '0');
  const today = new Date().toISOString().slice(0, 10);
  await pool.query('INSERT INTO settlements(id,date,earned,paid_vendors,expenses,taken_home,note) VALUES(?,?,?,?,?,?,?)',
    [id, today, earned, paid_vendors, expenses, taken_home, note||null]);
  res.json({ id, taken_home });
};
