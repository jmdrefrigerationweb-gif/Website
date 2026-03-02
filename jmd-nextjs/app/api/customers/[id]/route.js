import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Customer from '@/lib/models/Customer';
import { calculateNextServiceDate } from '@/lib/utils/reminderLogic';
import { handleError } from '@/lib/errorHandler';

// GET /api/customers/[id]
export async function GET(request, { params }) {
    try {
        await connectDB();
        const { id } = await params;
        const customer = await Customer.findById(id);
        if (!customer) {
            return NextResponse.json({ success: false, message: 'Customer not found' }, { status: 404 });
        }
        const obj = customer.toJSON();
        obj.nextServiceDate = calculateNextServiceDate(customer);
        return NextResponse.json({ success: true, data: obj });
    } catch (err) {
        return handleError(err);
    }
}

// PUT /api/customers/[id]
export async function PUT(request, { params }) {
    try {
        await connectDB();
        const { id } = await params;
        const { name, phone, address } = await request.json();

        const customer = await Customer.findById(id);
        if (!customer) {
            return NextResponse.json({ success: false, message: 'Customer not found' }, { status: 404 });
        }

        if (phone && phone !== customer.phone) {
            const exists = await Customer.findOne({ phone });
            if (exists) {
                return NextResponse.json(
                    { success: false, message: 'Phone number already in use by another customer' },
                    { status: 400 }
                );
            }
        }

        if (name) customer.name = name;
        if (phone) customer.phone = phone;
        if (address) customer.address = address;

        await customer.save();
        return NextResponse.json({ success: true, data: customer });
    } catch (err) {
        return handleError(err);
    }
}

// DELETE /api/customers/[id]
export async function DELETE(request, { params }) {
    try {
        await connectDB();
        const { id } = await params;
        const customer = await Customer.findByIdAndDelete(id);
        if (!customer) {
            return NextResponse.json({ success: false, message: 'Customer not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, message: 'Customer deleted successfully' });
    } catch (err) {
        return handleError(err);
    }
}
