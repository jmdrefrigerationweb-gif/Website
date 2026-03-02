const axios = require('axios');
const { formatDate } = require('./reminderLogic');

/**
 * TextBee.dev — Android SMS Gateway
 *
 * Setup (5 minutes):
 * 1. Go to https://textbee.dev → Sign up free
 * 2. On dashboard → "Add Device" → scan QR code from the TextBee Android app
 * 3. Copy your API Key → TEXTBEE_API_KEY in .env
 * 4. Copy your Device ID → TEXTBEE_DEVICE_ID in .env
 * 5. Install TextBee app on Android → Settings > Apps > TextBee > Battery → set "Unrestricted"
 *
 * Free Tier: 300 SMS/month — perfect for this use case
 */

const TEXTBEE_BASE = 'https://api.textbee.dev/api/v1';

// ─── Check if TextBee is configured ──────────────────────────────────────────
const isTextBeeConfigured = () => {
    return !!(process.env.TEXTBEE_API_KEY && process.env.TEXTBEE_DEVICE_ID);
};

// ─── Get status for dashboard ─────────────────────────────────────────────────
const getWhatsAppStatus = () => {
    if (isTextBeeConfigured()) return 'ready';
    return 'not_configured';
};

// ─── Format phone for Indian numbers ─────────────────────────────────────────
const formatPhone = (phone) => {
    let p = phone.replace(/\D/g, '');
    if (p.startsWith('0')) p = p.substring(1);
    if (!p.startsWith('91') && p.length === 10) p = '91' + p;
    return `+${p}`;
};

// ─── SMS Message Template ─────────────────────────────────────────────────────
const generateSMSMessage = (customer, nextServiceDate) => {
    return (
        `JMD Refrigeration - Service Reminder\n\n` +
        `Dear ${customer.name},\n` +
        `Your RO water purifier service is due this month (${formatDate(nextServiceDate)}).\n\n` +
        `Please call us to schedule: ${process.env.BUSINESS_PHONE || 'our number'}\n\n` +
        `- JMD Refrigeration`
    );
};

// ─── Send SMS via TextBee ─────────────────────────────────────────────────────
const sendSMSViaTextBee = async (phone, message) => {
    const response = await axios.post(
        `${TEXTBEE_BASE}/gateway/devices/${process.env.TEXTBEE_DEVICE_ID}/send-sms`,
        {
            recipients: [formatPhone(phone)],
            message,
        },
        {
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.TEXTBEE_API_KEY,
            },
            timeout: 15000,
        }
    );
    return response.data;
};

// ─── Main sendReminder function ───────────────────────────────────────────────
const sendReminder = async (customer, nextServiceDate) => {
    const message = generateSMSMessage(customer, nextServiceDate);

    // Simulate if not configured
    if (!isTextBeeConfigured()) {
        console.log(`[SMS SIMULATION] Would send to ${customer.phone} (${customer.name})`);
        console.log(message);
        return {
            status: 'simulated',
            message: `TextBee not configured. Add TEXTBEE_API_KEY and TEXTBEE_DEVICE_ID to .env.`,
        };
    }

    try {
        const result = await sendSMSViaTextBee(customer.phone, message);
        console.log(`✅ SMS sent to ${customer.name} (${customer.phone})`);
        return {
            status: 'sent',
            message: `SMS sent to ${customer.name} via TextBee`,
            data: result,
        };
    } catch (err) {
        const detail = err.response?.data?.message || err.message;
        console.error(`❌ TextBee error for ${customer.phone}: ${detail}`);
        throw new Error(`TextBee error: ${detail}`);
    }
};

module.exports = {
    sendReminder,
    getWhatsAppStatus,
    isTextBeeConfigured,
    generateSMSMessage,
};
