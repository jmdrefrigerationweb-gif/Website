import axios from 'axios';
import { formatDate } from './reminderLogic.js';

const TEXTBEE_BASE = 'https://api.textbee.dev/api/v1';

export const isTextBeeConfigured = () => {
    return !!(process.env.TEXTBEE_API_KEY && process.env.TEXTBEE_DEVICE_ID);
};

export const getWhatsAppStatus = () => {
    if (isTextBeeConfigured()) return 'ready';
    return 'not_configured';
};

const formatPhone = (phone) => {
    let p = phone.replace(/\D/g, '');
    if (p.startsWith('0')) p = p.substring(1);
    if (!p.startsWith('91') && p.length === 10) p = '91' + p;
    return `+${p}`;
};

const generateSMSMessage = (customer, nextServiceDate) => {
    return (
        `JMD Refrigeration - Service Reminder\n\n` +
        `Dear ${customer.name},\n` +
        `Your RO water purifier service is due this month (${formatDate(nextServiceDate)}).\n\n` +
        `Please call us to schedule: ${process.env.BUSINESS_PHONE || 'our number'}\n\n` +
        `- JMD Refrigeration`
    );
};

const sendSMSViaTextBee = async (phone, message) => {
    const response = await axios.post(
        `${TEXTBEE_BASE}/gateway/devices/${process.env.TEXTBEE_DEVICE_ID}/send-sms`,
        { recipients: [formatPhone(phone)], message },
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

export const sendReminder = async (customer, nextServiceDate) => {
    const message = generateSMSMessage(customer, nextServiceDate);

    if (!isTextBeeConfigured()) {
        console.log(`[SMS SIMULATION] Would send to ${customer.phone} (${customer.name})`);
        return {
            status: 'simulated',
            message: `TextBee not configured. Add TEXTBEE_API_KEY and TEXTBEE_DEVICE_ID to .env.local.`,
        };
    }

    try {
        const result = await sendSMSViaTextBee(customer.phone, message);
        return { status: 'sent', message: `SMS sent to ${customer.name} via TextBee`, data: result };
    } catch (err) {
        const detail = err.response?.data?.message || err.message;
        throw new Error(`TextBee error: ${detail}`);
    }
};
