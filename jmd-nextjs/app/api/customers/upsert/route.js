import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Customer from '@/lib/models/Customer';
import { handleError } from '@/lib/errorHandler';

export async function POST(request) {
    try {
        await connectDB();
        const { name, phone, address, serviceEntry } = await request.json();

        if (!phone) {
            return NextResponse.json(
                { success: false, message: 'Phone number is required' },
                { status: 400 }
            );
        }

        let customer = await Customer.findOne({ phone });

        if (customer) {
            if (name) customer.name = name;
            if (address) customer.address = address;
            if (serviceEntry) {
                if (serviceEntry.components && !serviceEntry.totalCost) {
                    serviceEntry.totalCost = serviceEntry.components.reduce((sum, c) => sum + c.price, 0);
                }
                customer.serviceEntries.push(serviceEntry);
            }
            customer.ignoredUntil = null;
            await customer.save();
            return NextResponse.json({ success: true, isNew: false, data: customer });
        } else {
            if (!name || !address) {
                return NextResponse.json(
                    { success: false, message: 'Name and address are required for a new customer' },
                    { status: 400 }
                );
            }
            if (serviceEntry && serviceEntry.components && !serviceEntry.totalCost) {
                serviceEntry.totalCost = serviceEntry.components.reduce((sum, c) => sum + c.price, 0);
            }
            customer = await Customer.create({
                name,
                phone,
                address,
                serviceEntries: serviceEntry ? [serviceEntry] : [],
            });
            return NextResponse.json({ success: true, isNew: true, data: customer }, { status: 201 });
        }
    } catch (err) {
        return handleError(err);
    }
}
