const Customer = require('../models/Customer');
const { calculateNextServiceDate, isServicePendingThisMonth } = require('../utils/reminderLogic');
const { sendReminder } = require('../utils/messageSender');

// ─────────────────────────────────────────────
// @desc    Create new customer or add service entry if phone exists
// @route   POST /api/customers/upsert
// ─────────────────────────────────────────────
const upsertCustomer = async (req, res) => {
    const { name, phone, address, serviceEntry } = req.body;

    if (!phone) {
        return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    let customer = await Customer.findOne({ phone });

    if (customer) {
        // Customer exists — update basic info if provided, then add entry
        if (name) customer.name = name;
        if (address) customer.address = address;
        if (serviceEntry) {
            // Calculate totalCost from components if not provided
            if (serviceEntry.components && !serviceEntry.totalCost) {
                serviceEntry.totalCost = serviceEntry.components.reduce((sum, c) => sum + c.price, 0);
            }
            customer.serviceEntries.push(serviceEntry);
        }
        customer.ignoredUntil = null; // reset ignore when new work is done
        await customer.save();
        return res.status(200).json({ success: true, isNew: false, data: customer });
    } else {
        // New customer
        if (!name || !address) {
            return res.status(400).json({
                success: false,
                message: 'Name and address are required for a new customer',
            });
        }
        if (serviceEntry && serviceEntry.components && !serviceEntry.totalCost) {
            serviceEntry.totalCost = serviceEntry.components.reduce((sum, c) => sum + c.price, 0);
        }
        customer = await Customer.create({
            name,
            phone,
            address,
            serviceEntries: serviceEntry ? [serviceEntry] : [],
        });
        return res.status(201).json({ success: true, isNew: true, data: customer });
    }
};

// ─────────────────────────────────────────────
// @desc    Check if phone exists, returns customer data or isNew flag
// @route   GET /api/customers/check/:phone
// ─────────────────────────────────────────────
const checkPhone = async (req, res) => {
    const customer = await Customer.findOne({ phone: req.params.phone });
    if (customer) {
        return res.json({ success: true, exists: true, data: customer });
    }
    return res.json({ success: true, exists: false, data: null });
};

// ─────────────────────────────────────────────
// @desc    Get all customers whose service is pending this month
// @route   GET /api/customers/pending
// ─────────────────────────────────────────────
const getPendingReminders = async (req, res) => {
    const now = new Date();
    const allCustomers = await Customer.find({});

    const pending = allCustomers.filter((customer) => {
        // Skip customers who are currently ignored
        if (customer.ignoredUntil && customer.ignoredUntil > now) return false;

        const nextDate = calculateNextServiceDate(customer);
        if (!nextDate) return false;

        return isServicePendingThisMonth(nextDate, now);
    });

    // Attach computed nextServiceDate to each result
    const result = pending.map((c) => {
        const obj = c.toJSON();
        obj.nextServiceDate = calculateNextServiceDate(c);
        return obj;
    });

    res.json({ success: true, count: result.length, data: result });
};

// ─────────────────────────────────────────────
// @desc    Ignore a customer's reminder for N days
// @route   PATCH /api/customers/:id/ignore
// ─────────────────────────────────────────────
const ignoreReminder = async (req, res) => {
    const { days } = req.body;
    if (!days || days < 1) {
        return res.status(400).json({ success: false, message: 'Please provide valid number of days (min 1)' });
    }

    const customer = await Customer.findById(req.params.id);
    if (!customer) {
        return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const ignoreUntil = new Date();
    ignoreUntil.setDate(ignoreUntil.getDate() + parseInt(days));
    customer.ignoredUntil = ignoreUntil;
    await customer.save();

    res.json({
        success: true,
        message: `Reminder ignored until ${ignoreUntil.toDateString()}`,
        data: customer,
    });
};

// ─────────────────────────────────────────────
// @desc    Search customers by name or phone
// @route   GET /api/customers/search?q=...
// ─────────────────────────────────────────────
const searchCustomers = async (req, res) => {
    const { q } = req.query;
    if (!q || q.trim() === '') {
        return res.status(400).json({ success: false, message: 'Search query is required' });
    }

    const regex = new RegExp(q.trim(), 'i');
    const customers = await Customer.find({
        $or: [{ name: regex }, { phone: regex }],
    }).limit(20);

    res.json({ success: true, count: customers.length, data: customers });
};

// ─────────────────────────────────────────────
// @desc    Get a single customer by ID
// @route   GET /api/customers/:id
// ─────────────────────────────────────────────
const getCustomerById = async (req, res) => {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
        return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    const obj = customer.toJSON();
    obj.nextServiceDate = calculateNextServiceDate(customer);
    res.json({ success: true, data: obj });
};

// ─────────────────────────────────────────────
// @desc    Update customer basic info
// @route   PUT /api/customers/:id
// ─────────────────────────────────────────────
const updateCustomer = async (req, res) => {
    const { name, phone, address } = req.body;

    const customer = await Customer.findById(req.params.id);
    if (!customer) {
        return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    if (phone && phone !== customer.phone) {
        const exists = await Customer.findOne({ phone });
        if (exists) {
            return res.status(400).json({ success: false, message: 'Phone number already in use by another customer' });
        }
    }

    if (name) customer.name = name;
    if (phone) customer.phone = phone;
    if (address) customer.address = address;

    await customer.save();
    res.json({ success: true, data: customer });
};

// ─────────────────────────────────────────────
// @desc    Update a specific service entry
// @route   PUT /api/customers/:id/entries/:entryId
// ─────────────────────────────────────────────
const updateServiceEntry = async (req, res) => {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    const entry = customer.serviceEntries.id(req.params.entryId);
    if (!entry) return res.status(404).json({ success: false, message: 'Service entry not found' });

    const { date, type, components, totalCost, notes, nextServiceAfterMonths } = req.body;
    if (date) entry.date = date;
    if (type) entry.type = type;
    if (components) {
        entry.components = components;
        entry.totalCost = components.reduce((sum, c) => sum + c.price, 0);
    }
    if (totalCost !== undefined) entry.totalCost = totalCost;
    if (notes !== undefined) entry.notes = notes;
    if (nextServiceAfterMonths !== undefined) entry.nextServiceAfterMonths = nextServiceAfterMonths;

    await customer.save();
    res.json({ success: true, data: customer });
};

// ─────────────────────────────────────────────
// @desc    Delete a customer
// @route   DELETE /api/customers/:id
// ─────────────────────────────────────────────
const deleteCustomer = async (req, res) => {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) {
        return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    res.json({ success: true, message: 'Customer deleted successfully' });
};

// ─────────────────────────────────────────────
// @desc    Delete a specific service entry
// @route   DELETE /api/customers/:id/entries/:entryId
// ─────────────────────────────────────────────
const deleteServiceEntry = async (req, res) => {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    const entry = customer.serviceEntries.id(req.params.entryId);
    if (!entry) return res.status(404).json({ success: false, message: 'Service entry not found' });

    entry.deleteOne();
    await customer.save();
    res.json({ success: true, data: customer });
};

// ─────────────────────────────────────────────
// @desc    Send reminders to selected customers
// @route   POST /api/customers/send-reminders
// ─────────────────────────────────────────────
const sendReminders = async (req, res) => {
    const { customerIds } = req.body;
    if (!customerIds || !Array.isArray(customerIds) || customerIds.length === 0) {
        return res.status(400).json({ success: false, message: 'Please provide customer IDs' });
    }

    const customers = await Customer.find({ _id: { $in: customerIds } });
    const results = [];

    for (const customer of customers) {
        try {
            const nextDate = calculateNextServiceDate(customer);
            const result = await sendReminder(customer, nextDate);
            results.push({ customerId: customer._id, phone: customer.phone, name: customer.name, status: result.status, message: result.message });
        } catch (err) {
            results.push({ customerId: customer._id, phone: customer.phone, name: customer.name, status: 'error', message: err.message });
        }
    }

    res.json({ success: true, results });
};

module.exports = {
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
};
