import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Customer from '@/lib/models/Customer';
import { calculateNextServiceDate } from '@/lib/utils/reminderLogic';
import { sendReminder } from '@/lib/utils/messageSender';
import { handleError } from '@/lib/errorHandler';

export async function POST(request) {
    try {
        await connectDB();
        const { customerIds } = await request.json();

        if (!customerIds || !Array.isArray(customerIds) || customerIds.length === 0) {
            return NextResponse.json(
                { success: false, message: 'Please provide customer IDs' },
                { status: 400 }
            );
        }

        const customers = await Customer.find({ _id: { $in: customerIds } });
        const results = [];

        for (const customer of customers) {
            try {
                const nextDate = calculateNextServiceDate(customer);
                const result = await sendReminder(customer, nextDate);
                results.push({
                    customerId: customer._id,
                    phone: customer.phone,
                    name: customer.name,
                    status: result.status,
                    message: result.message,
                });
            } catch (err) {
                results.push({
                    customerId: customer._id,
                    phone: customer.phone,
                    name: customer.name,
                    status: 'error',
                    message: err.message,
                });
            }
        }

        return NextResponse.json({ success: true, results });
    } catch (err) {
        return handleError(err);
    }
}
