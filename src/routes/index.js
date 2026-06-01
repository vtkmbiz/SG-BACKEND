const router = require('express').Router();
const { auth, ownerOnly, ownerOrCo } = require('../middleware/auth');

const authCtrl = require('../controllers/authController');
const usersCtrl = require('../controllers/usersController');
const custCtrl = require('../controllers/customersController');
const entriesCtrl = require('../controllers/entriesController');
const invCtrl = require('../controllers/invoicesController');
const vendCtrl = require('../controllers/vendorsController');
const repCtrl = require('../controllers/reportsController');
const empCtrl = require('../controllers/employeesController');

// Auth
router.post('/auth/login', authCtrl.login);
router.get('/auth/me', auth, authCtrl.me);

// Users
router.get('/users', auth, ownerOrCo, usersCtrl.getAll);
router.post('/users', auth, ownerOnly, usersCtrl.create);
router.put('/users/password', auth, usersCtrl.changePassword);

// Customers
router.get('/customers', auth, custCtrl.search);
router.post('/customers', auth, custCtrl.create);

// Service Entries
router.get('/entries', auth, entriesCtrl.getAll);
router.post('/entries', auth, entriesCtrl.create);

// Invoices
router.get('/invoices', auth, invCtrl.getAll);
router.get('/invoices/:id', auth, invCtrl.getOne);
router.post('/invoices', auth, invCtrl.create);
router.put('/invoices/:id/status', auth, invCtrl.updateStatus);
router.get('/invoices/:id/whatsapp', auth, invCtrl.getWhatsAppMessage);

// Vendors
router.get('/vendors', auth, vendCtrl.getAll);
router.post('/vendors', auth, ownerOrCo, vendCtrl.create);
router.get('/vendors/:id/ledger', auth, vendCtrl.getLedger);

// Purchases
router.get('/purchases', auth, vendCtrl.getPurchases);
router.post('/purchases', auth, vendCtrl.createPurchase);

// Vendor Payments
router.get('/vendor-payments', auth, vendCtrl.getPayments);
router.post('/vendor-payments', auth, vendCtrl.createPayment);

// Reports
router.get('/reports', auth, ownerOrCo, repCtrl.getReport);
router.get('/settlements', auth, ownerOrCo, repCtrl.getSettlements);
router.post('/settlements', auth, ownerOrCo, repCtrl.createSettlement);

// Employees & Attendance
router.get('/employees', auth, empCtrl.getEmployees);
router.post('/employees', auth, ownerOnly, empCtrl.createEmployee);
router.put('/employees/:id/toggle', auth, ownerOnly, empCtrl.toggleActive);
router.get('/attendance', auth, empCtrl.getAttendance);
router.post('/attendance', auth, empCtrl.markAttendance);
router.get('/salary/:month', auth, ownerOrCo, empCtrl.getMonthlySalary);
router.get('/dashboard/attendance', auth, empCtrl.getDashboardAttendance);

module.exports = router;
