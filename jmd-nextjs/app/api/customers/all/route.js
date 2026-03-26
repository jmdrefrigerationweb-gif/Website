import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Customer from '@/lib/models/Customer';
import { handleError } from '@/lib/errorHandler';

export async function GET() {
    try {
        await connectDB();
        const customers = await Customer.find({}).sort({ createdAt: -1 });
        return NextResponse.json({ success: true, count: customers.length, data: customers });
    } catch (err) {
        return handleError(err);
    }
}
