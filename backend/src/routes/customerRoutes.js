const express = require('express');
const router = express.Router();
const {
    upsertCustomer,
    checkPhone,
    getPendingReminders,
    ignoreReminder,
    searchCustomers,
    getCustomerById,
    updateCustomer,
    updateServiceEntry,
    deleteCustomer,
    deleteServiceEntry,
    sendReminders,
} = require('../controllers/customerController');

// Special routes (before :id routes to avoid conflicts)
router.get('/pending', getPendingReminders);
router.get('/search', searchCustomers);
router.get('/check/:phone', checkPhone);
router.post('/upsert', upsertCustomer);
router.post('/send-reminders', sendReminders);

// Customer CRUD
router.get('/:id', getCustomerById);
router.put('/:id', updateCustomer);
router.delete('/:id', deleteCustomer);

// Reminder ignore
router.patch('/:id/ignore', ignoreReminder);

// Service entry operations
router.put('/:id/entries/:entryId', updateServiceEntry);
router.delete('/:id/entries/:entryId', deleteServiceEntry);

module.exports = router;
