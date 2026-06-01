const pool = require('../config/db');

exports.getEmployees = async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM employees ORDER BY name');
  res.json(rows);
};

exports.createEmployee = async (req, res) => {
  const { name, role, salary, phone } = req.body;
  const [r] = await pool.query('INSERT INTO employees(name,role,salary,phone,active) VALUES(?,?,?,?,1)', [name, role, salary, phone]);
  res.json({ id: r.insertId, name, role, salary, phone, active: 1 });
};

exports.toggleActive = async (req, res) => {
  const { id } = req.params;
  const [[emp]] = await pool.query('SELECT active FROM employees WHERE id=?', [id]);
  if (!emp) return res.status(404).json({ error: 'Not found' });
  const newStatus = emp.active ? 0 : 1;
  await pool.query('UPDATE employees SET active=? WHERE id=?', [newStatus, id]);
  res.json({ id: parseInt(id), active: newStatus });
};

exports.getAttendance = async (req, res) => {
  const { date, month } = req.query;
  let sql = 'SELECT a.*, e.name as employee_name, e.role, e.salary FROM attendance a JOIN employees e ON a.employee_id=e.id';
  let params = [];
  if (date) { sql += ' WHERE a.date=?'; params = [date]; }
  else if (month) { sql += " WHERE DATE_FORMAT(a.date,'%Y-%m')=?"; params = [month]; }
  sql += ' ORDER BY a.date DESC, e.name';
  const [rows] = await pool.query(sql, params);
  res.json(rows);
};

exports.markAttendance = async (req, res) => {
  const { employee_id, date, status, reason } = req.body;
  await pool.query(
    'INSERT INTO attendance(employee_id,date,status,reason,marked_by) VALUES(?,?,?,?,?) ON DUPLICATE KEY UPDATE status=VALUES(status),reason=VALUES(reason),marked_by=VALUES(marked_by)',
    [employee_id, date, status, reason||null, req.user.id]
  );
  res.json({ success: true });
};

exports.getMonthlySalary = async (req, res) => {
  const { month } = req.params;
  const [y, m] = month.split('-');
  const daysInMonth = new Date(+y, +m, 0).getDate();
  const [employees] = await pool.query('SELECT * FROM employees WHERE active=1 ORDER BY name');
  const [attendance] = await pool.query("SELECT * FROM attendance WHERE DATE_FORMAT(date,'%Y-%m')=?", [month]);

  const result = employees.map(emp => {
    const empAtt = attendance.filter(a => a.employee_id === emp.id);
    const present = empAtt.filter(a => a.status === 'present').length;
    const absent = empAtt.filter(a => a.status === 'absent').length;
    const half = empAtt.filter(a => a.status === 'half').length;
    const perDay = Math.round(emp.salary / daysInMonth);
    const earned = Math.round((present + half * 0.5) * perDay);
    const deducted = Math.round((absent + half * 0.5) * perDay);
    const absences = empAtt.filter(a => a.status === 'absent').map(a => ({ date: a.date, reason: a.reason }));
    return { ...emp, present, absent, half, earned, deducted, perDay, daysInMonth, absences, marked: empAtt.length };
  });
  res.json(result);
};

exports.getDashboardAttendance = async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const [employees] = await pool.query('SELECT * FROM employees WHERE active=1');
  const [attendance] = await pool.query('SELECT * FROM attendance WHERE date=?', [today]);
  const present = attendance.filter(a => a.status === 'present').length;
  const absent = attendance.filter(a => a.status === 'absent').length;
  const half = attendance.filter(a => a.status === 'half').length;
  const marked = present + absent + half;
  const notMarked = employees.length - marked;
  res.json({ present, absent, half, notMarked, total: employees.length, marked, date: today });
};
