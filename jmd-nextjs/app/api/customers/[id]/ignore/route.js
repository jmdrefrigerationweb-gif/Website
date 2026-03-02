import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Customer from '@/lib/models/Customer';
import { handleError } from '@/lib/errorHandler';

export async function PATCH(request, { params }) {
    try {
        await connectDB();
        const { id } = await params;
        const { days } = await request.json();

        if (!days || days < 1) {
            return NextResponse.json(
                { success: false, message: 'Please provide valid number of days (min 1)' },
                { status: 400 }
            );
        }

        const customer = await Customer.findById(id);
        if (!customer) {
            return NextResponse.json({ success: false, message: 'Customer not found' }, { status: 404 });
        }

        const ignoreUntil = new Date();
        ignoreUntil.setDate(ignoreUntil.getDate() + parseInt(days));
        customer.ignoredUntil = ignoreUntil;
        await customer.save();

        return NextResponse.json({
            success: true,
            message: `Reminder ignored until ${ignoreUntil.toDateString()}`,
            data: customer,
        });
    } catch (err) {
        return handleError(err);
    }
}
