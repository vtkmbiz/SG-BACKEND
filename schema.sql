-- ================================================================
-- SWASTIK AUTO REPAIRERS — Complete Database Schema v2.0
-- Run: mysql -u root -p < schema.sql
-- ================================================================

CREATE DATABASE IF NOT EXISTS swastik_garage CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE swastik_garage;

-- USERS
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('owner','co-owner','worker') NOT NULL DEFAULT 'worker',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CUSTOMERS
CREATE TABLE IF NOT EXISTS customers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  contact VARCHAR(15) NOT NULL,
  email VARCHAR(150),
  vehicle VARCHAR(100),
  vehicle_no VARCHAR(20),
  visits INT DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SERVICE ENTRIES
CREATE TABLE IF NOT EXISTS service_entries (
  id VARCHAR(10) PRIMARY KEY,
  customer_id INT,
  customer_name VARCHAR(100) NOT NULL,
  contact VARCHAR(15),
  email VARCHAR(150),
  vehicle VARCHAR(100),
  vehicle_no VARCHAR(20),
  problems TEXT,
  invoiced TINYINT(1) DEFAULT 0,
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

-- INVOICES
CREATE TABLE IF NOT EXISTS invoices (
  id VARCHAR(10) PRIMARY KEY,
  entry_id VARCHAR(10),
  customer_id INT,
  customer_name VARCHAR(100) NOT NULL,
  contact VARCHAR(15),
  email VARCHAR(150),
  vehicle VARCHAR(100),
  vehicle_no VARCHAR(20),
  total DECIMAL(10,2) DEFAULT 0.00,
  status ENUM('pending','paid','due') DEFAULT 'pending',
  delivery_date DATE,
  delivery_time TIME,
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

-- INVOICE ITEMS
CREATE TABLE IF NOT EXISTS invoice_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  invoice_id VARCHAR(10) NOT NULL,
  description VARCHAR(255) NOT NULL,
  charge DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

-- VENDORS
CREATE TABLE IF NOT EXISTS vendors (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  contact VARCHAR(15),
  type VARCHAR(100),
  address VARCHAR(255),
  balance DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PURCHASES
CREATE TABLE IF NOT EXISTS purchases (
  id VARCHAR(10) PRIMARY KEY,
  vendor_id INT,
  vendor_name VARCHAR(100),
  item VARCHAR(255) NOT NULL,
  qty INT DEFAULT 1,
  rate DECIMAL(10,2) DEFAULT 0.00,
  amount DECIMAL(10,2) DEFAULT 0.00,
  entry_id VARCHAR(10),
  entry_label VARCHAR(200),
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE SET NULL
);

-- VENDOR PAYMENTS
CREATE TABLE IF NOT EXISTS vendor_payments (
  id VARCHAR(10) PRIMARY KEY,
  vendor_id INT,
  vendor_name VARCHAR(100),
  amount DECIMAL(10,2) NOT NULL,
  note VARCHAR(255),
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE SET NULL
);

-- SETTLEMENTS
CREATE TABLE IF NOT EXISTS settlements (
  id VARCHAR(10) PRIMARY KEY,
  date DATE NOT NULL,
  earned DECIMAL(10,2) DEFAULT 0.00,
  paid_vendors DECIMAL(10,2) DEFAULT 0.00,
  expenses DECIMAL(10,2) DEFAULT 0.00,
  taken_home DECIMAL(10,2) DEFAULT 0.00,
  note VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- EMPLOYEES
CREATE TABLE IF NOT EXISTS employees (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(100),
  salary DECIMAL(10,2) DEFAULT 0.00,
  phone VARCHAR(15),
  active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ATTENDANCE
CREATE TABLE IF NOT EXISTS attendance (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id INT NOT NULL,
  date DATE NOT NULL,
  status ENUM('present','absent','half') NOT NULL,
  reason VARCHAR(255),
  marked_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_emp_date (employee_id, date),
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (marked_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ================================================================
-- SEED DATA (run seed.js to set correct password hashes)
-- Default passwords: owner123 / kaushik123 / om123
-- ================================================================

INSERT INTO users (name, username, password, role) VALUES
('Manubhai G Joshi', 'owner',   '$2a$10$PLACEHOLDER_RUN_SEED_JS', 'owner'),
('Kaushik Joshi',    'kaushik', '$2a$10$PLACEHOLDER_RUN_SEED_JS', 'co-owner'),
('Om Joshi',         'om',      '$2a$10$PLACEHOLDER_RUN_SEED_JS', 'worker')
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO vendors (name, contact, type, address, balance) VALUES
('Raju Parts Store',    '9812345678', 'Two-wheeler Parts',  'Station Road, Jamnagar',     2300.00),
('Om Auto Spare Parts', '9823456789', 'Electrical & Lights','Bedi Gate, Jamnagar',         1800.00),
('Shree Tyre House',    '9834567890', 'Tyres & Tubes',      'Digvijay Plot, Jamnagar',     5200.00),
('Jay Oil Agency',      '9845678901', 'Oils & Lubricants',  'New Road, Jamnagar',           800.00),
('Khodiyar Auto Needs', '9856789012', 'Filters & Misc',     'Khambhalia Road, Jamnagar',   3100.00),
('Mahavir Body Parts',  '9867890123', 'Body & Frame',       'Industrial Area, Jamnagar',      0.00),
('Swami Battery House', '9878901234', 'Batteries',          'MG Road, Jamnagar',           4500.00)
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO employees (name, role, salary, phone, active) VALUES
('Ramesh Patel',    'Senior Mechanic',   15000, '9812001001', 1),
('Suresh Yadav',    'Helper',             9000, '9812001002', 1),
('Dinesh Solanki',  'Lead Mechanic',     18000, '9812001003', 1),
('Bhavesh Rathod',  'Mechanic',          14000, '9812001004', 1),
('Kiran Parmar',    'Electrician',       16000, '9812001005', 1),
('Nilesh Chauhan',  'Helper',             8500, '9812001006', 1),
('Jignesh Makwana', 'Welder',            17000, '9812001007', 1),
('Haresh Gohil',    'Painter',           15500, '9812001008', 1),
('Mahesh Vala',     'Helper',             9500, '9812001009', 1),
('Paresh Joshi',    'Mechanic',          14500, '9812001010', 1),
('Hitesh Barot',    'Spare Parts Mgr',   12000, '9812001011', 1),
('Vikas Thakor',    'Apprentice',         8000, '9812001012', 0)
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO customers (name, contact, vehicle, vehicle_no, visits, total_spent) VALUES
('Rajesh Patel', '9876543210', 'Honda Activa 6G',  'GJ03AB1234', 5, 8500.00),
('Vijay Shah',   '9867432109', 'Hero Splendor+',   'GJ03CD5678', 2, 2200.00),
('Amit Trivedi', '9858321098', 'Bajaj Pulsar 150', 'GJ03EF9012', 3, 4700.00)
ON DUPLICATE KEY UPDATE name=VALUES(name);
