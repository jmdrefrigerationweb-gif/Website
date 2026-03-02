import { NextResponse } from 'next/server';
import { getWhatsAppStatus } from '@/lib/utils/messageSender';

export async function GET() {
    return NextResponse.json({ status: getWhatsAppStatus() });
}
