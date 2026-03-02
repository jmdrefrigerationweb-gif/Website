import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Customer from '@/lib/models/Customer';
import { calculateNextServiceDate, isServicePendingThisMonth } from '@/lib/utils/reminderLogic';
import { handleError } from '@/lib/errorHandler';

export async function GET() {
    try {
        await connectDB();
        const now = new Date();
        const allCustomers = await Customer.find({});

        const pending = allCustomers.filter((customer) => {
            if (customer.ignoredUntil && customer.ignoredUntil > now) return false;
            const nextDate = calculateNextServiceDate(customer);
            if (!nextDate) return false;
            return isServicePendingThisMonth(nextDate, now);
        });

        const result = pending.map((c) => {
            const obj = c.toJSON();
            obj.nextServiceDate = calculateNextServiceDate(c);
            return obj;
        });

        return NextResponse.json({ success: true, count: result.length, data: result });
    } catch (err) {
        return handleError(err);
    }
}
