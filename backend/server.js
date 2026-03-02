require('express-async-errors');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./src/config/db');
const customerRoutes = require('./src/routes/customerRoutes');
const { errorHandler } = require('./src/middleware/errorHandler');
const { getWhatsAppStatus, isTextBeeConfigured } = require('./src/utils/messageSender');

const app = express();

// Connect to MongoDB
connectDB();

// Log TextBee SMS configuration status
if (isTextBeeConfigured()) {
  console.log('✅ TextBee SMS Gateway configured — reminders will be sent as SMS via your Android phone');
} else {
  console.log('⚠️  TextBee not configured — reminders will be SIMULATED (add TEXTBEE_API_KEY & TEXTBEE_DEVICE_ID to .env)');
}

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/customers', customerRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// WhatsApp / Meta API status — frontend polls this
app.get('/api/whatsapp/status', (req, res) => {
  res.json({ status: getWhatsAppStatus() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ JMD Refrigeration server running on port ${PORT}`);
});

module.exports = app;
