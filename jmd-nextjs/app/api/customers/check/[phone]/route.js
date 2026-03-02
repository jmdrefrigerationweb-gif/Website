import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Customer from '@/lib/models/Customer';
import { handleError } from '@/lib/errorHandler';

export async function GET(request, { params }) {
    try {
        await connectDB();
        const { phone } = await params;
        const customer = await Customer.findOne({ phone });
        if (customer) {
            return NextResponse.json({ success: true, exists: true, data: customer });
        }
        return NextResponse.json({ success: true, exists: false, data: null });
    } catch (err) {
        return handleError(err);
    }
}
