import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Customer from '@/lib/models/Customer';
import { handleError } from '@/lib/errorHandler';

// PUT /api/customers/[id]/entries/[entryId]
export async function PUT(request, { params }) {
    try {
        await connectDB();
        const { id, entryId } = await params;
        const customer = await Customer.findById(id);
        if (!customer) {
            return NextResponse.json({ success: false, message: 'Customer not found' }, { status: 404 });
        }

        const entry = customer.serviceEntries.id(entryId);
        if (!entry) {
            return NextResponse.json(
                { success: false, message: 'Service entry not found' },
                { status: 404 }
            );
        }

        const { date, type, components, totalCost, notes, nextServiceAfterMonths } = await request.json();
        if (date) entry.date = date;
        if (type) entry.type = type;
        if (components) {
            entry.components = components;
            entry.totalCost = components.reduce((sum, c) => sum + c.price, 0);
        }
        if (totalCost !== undefined) entry.totalCost = totalCost;
        if (notes !== undefined) entry.notes = notes;
        if (nextServiceAfterMonths !== undefined) entry.nextServiceAfterMonths = nextServiceAfterMonths;

        await customer.save();
        return NextResponse.json({ success: true, data: customer });
    } catch (err) {
        return handleError(err);
    }
}

// DELETE /api/customers/[id]/entries/[entryId]
export async function DELETE(request, { params }) {
    try {
        await connectDB();
        const { id, entryId } = await params;
        const customer = await Customer.findById(id);
        if (!customer) {
            return NextResponse.json({ success: false, message: 'Customer not found' }, { status: 404 });
        }

        const entry = customer.serviceEntries.id(entryId);
        if (!entry) {
            return NextResponse.json(
                { success: false, message: 'Service entry not found' },
                { status: 404 }
            );
        }

        entry.deleteOne();
        await customer.save();
        return NextResponse.json({ success: true, data: customer });
    } catch (err) {
        return handleError(err);
    }
}
