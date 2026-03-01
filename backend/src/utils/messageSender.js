const { formatDate } = require('./reminderLogic');

/**
 * Message Templates for reminders
 */
const generateSMSMessage = (customer, nextServiceDate) => {
    return `Dear ${customer.name}, your RO water purifier service is due this month (${formatDate(nextServiceDate)}). Please contact JMD Refrigeration to schedule your service. Call us: ${process.env.BUSINESS_PHONE || '9999999999'}`;
};

const generateWhatsAppMessage = (customer, nextServiceDate) => {
    return (
        `🌊 *JMD Refrigeration - Service Reminder* 🌊\n\n` +
        `Hello *${customer.name}* 👋,\n\n` +
        `Your *RO Water Purifier* is due for service this month *(${formatDate(nextServiceDate)})*.\n\n` +
        `Regular servicing ensures:\n` +
        `✅ Clean & Pure Water\n` +
        `✅ Long System Life\n` +
        `✅ Best Performance\n\n` +
        `📞 *Call/WhatsApp us to book your service:*\n` +
        `${process.env.BUSINESS_PHONE || '9999999999'}\n\n` +
        `_JMD Refrigeration — Trusted RO Service Since Years_ 💧`
    );
};

/**
 * Send a reminder via Twilio WhatsApp or SMS
 * To use this:
 *  1. Create a Twilio account at https://www.twilio.com
 *  2. Get your Account SID and Auth Token
 *  3. Set up a WhatsApp Sandbox or verified number
 *  4. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE to .env
 */
const sendReminder = async (customer, nextServiceDate) => {
    // If Twilio credentials are not configured, return a simulated success
    if (
        !process.env.TWILIO_ACCOUNT_SID ||
        !process.env.TWILIO_AUTH_TOKEN ||
        !process.env.TWILIO_PHONE
    ) {
        console.log(`[REMINDER SIMULATION] Would send to ${customer.phone} (${customer.name})`);
        console.log(generateWhatsAppMessage(customer, nextServiceDate));
        return {
            status: 'simulated',
            message: `Reminder simulated for ${customer.name} (${customer.phone}). Configure Twilio in .env to enable real sending.`,
        };
    }

    // Real Twilio sending
    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    const toPhone = customer.phone.startsWith('+') ? customer.phone : `+91${customer.phone}`;

    try {
        // Attempt WhatsApp first
        const message = await client.messages.create({
            from: `whatsapp:${process.env.TWILIO_PHONE}`,
            to: `whatsapp:${toPhone}`,
            body: generateWhatsAppMessage(customer, nextServiceDate),
        });
        return { status: 'sent', message: `WhatsApp message sent. SID: ${message.sid}` };
    } catch (whatsappError) {
        console.warn(`WhatsApp failed for ${customer.phone}, trying SMS: ${whatsappError.message}`);
        try {
            // Fallback to SMS
            const sms = await client.messages.create({
                from: process.env.TWILIO_PHONE,
                to: toPhone,
                body: generateSMSMessage(customer, nextServiceDate),
            });
            return { status: 'sent_sms', message: `SMS sent. SID: ${sms.sid}` };
        } catch (smsError) {
            throw new Error(`Failed to send message: ${smsError.message}`);
        }
    }
};

module.exports = { sendReminder, generateWhatsAppMessage, generateSMSMessage };
