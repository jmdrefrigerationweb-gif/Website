import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Customer from '@/lib/models/Customer';
import { handleError } from '@/lib/errorHandler';

export async function GET(request) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const q = searchParams.get('q');

        if (!q || q.trim() === '') {
            return NextResponse.json(
                { success: false, message: 'Search query is required' },
                { status: 400 }
            );
        }

        const regex = new RegExp(q.trim(), 'i');
        const customers = await Customer.find({
            $or: [{ name: regex }, { phone: regex }],
        }).limit(20);

        return NextResponse.json({ success: true, count: customers.length, data: customers });
    } catch (err) {
        return handleError(err);
    }
}
