import { NextResponse } from 'next/server';
import * as xlsx from 'xlsx';
import connectDB from '@/lib/mongodb';
import Customer from '@/lib/models/Customer';
import { cleanName, normalizePhone, normalizeAddress, mapExcelHeaders, parseExcelDate } from '@/lib/utils/importHelpers';
import { handleError } from '@/lib/errorHandler';

export async function POST(request) {
    try {
        await connectDB();
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const workbook = xlsx.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // Getting raw rows
        const rows = xlsx.utils.sheet_to_json(sheet, { defval: "" });
        
        if (rows.length === 0) {
            return NextResponse.json({ success: false, message: 'Excel file is empty' }, { status: 400 });
        }

        const headers = Object.keys(rows[0] || {});
        if (headers.length === 0) {
            return NextResponse.json({ success: false, message: 'No headers found in Excel' }, { status: 400 });
        }

        const mappedHeaders = mapExcelHeaders(headers);

        const summary = {
            totalRows: rows.length,
            processedRows: 0,
            skippedRows: 0,
            createdCustomers: 0,
            matchedCustomers: 0,
            addedServiceEntries: 0,
            duplicateRowsSkipped: 0,
            errors: []
        };

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            try {
                // Extract values using mapped headers
                const rawDate = mappedHeaders.date ? row[mappedHeaders.date] : "";
                const rawPhone = mappedHeaders.phone ? row[mappedHeaders.phone] : "";
                const rawName = mappedHeaders.name ? row[mappedHeaders.name] : "";
                const rawAddress = mappedHeaders.address ? row[mappedHeaders.address] : "";
                const rawCity = mappedHeaders.city ? row[mappedHeaders.city] : "";
                const rawModel = mappedHeaders.productModel ? row[mappedHeaders.productModel] : "";
                const rawPart = mappedHeaders.part ? row[mappedHeaders.part] : "";
                const rawAmount = mappedHeaders.amount ? row[mappedHeaders.amount] : "";

                let combinedAddress = rawAddress ? String(rawAddress).trim() : "";
                if (rawCity) {
                    const cityStr = String(rawCity).trim();
                    if (combinedAddress) combinedAddress += `, ${cityStr}`;
                    else combinedAddress = cityStr;
                }

                // Normalize and clean
                const phone = normalizePhone(rawPhone);
                const address = normalizeAddress(combinedAddress);
                const name = cleanName(rawName);
                
                // If completely empty row, skip
                if (!phone && !address && !name) {
                    summary.skippedRows++;
                    continue;
                }

                summary.processedRows++;

                // Build Service Entry
                let componentName = "Imported Service Item";
                if (rawModel && rawPart) componentName = `${rawModel} : ${rawPart}`;
                else if (rawModel) componentName = String(rawModel);
                else if (rawPart) componentName = String(rawPart);

                const amount = parseFloat(rawAmount) || 0;
                const parsedDate = parseExcelDate(rawDate);
                
                const newServiceEntry = {
                    date: parsedDate,
                    type: "service",
                    components: [{ name: componentName, price: amount }],
                    totalCost: amount,
                    nextServiceAfterMonths: 12,
                    source: "excel_import"
                };

                let matchedCustomer = null;

                // RULE 4: If only name exists -> always create new card
                if (!phone && !address && name) {
                    matchedCustomer = null; 
                } else {
                    // RULE 1, 2, 3: Match phone first, then address
                    if (phone) {
                        matchedCustomer = await Customer.findOne({ normalizedPhone: phone });
                    }
                    if (!matchedCustomer && address) {
                        matchedCustomer = await Customer.findOne({ normalizedAddress: address });
                    }
                }

                if (matchedCustomer) {
                    // MATCHED EXISTING
                    summary.matchedCustomers++;
                    
                    // Duplicate check (exact same date, price, component)
                    const isDuplicate = matchedCustomer.serviceEntries.some(entry => {
                        const sameDate = new Date(entry.date).toDateString() === parsedDate.toDateString();
                        const sameCost = entry.totalCost === amount;
                        const sameComp = entry.components.length > 0 && entry.components[0].name === componentName;
                        return sameDate && sameCost && sameComp;
                    });

                    if (isDuplicate) {
                        summary.duplicateRowsSkipped++;
                        // Optionally update missing customer fields
                        let updated = false;
                        if (!matchedCustomer.name && name) { matchedCustomer.name = name; updated = true; }
                        if (!matchedCustomer.phone && rawPhone && /^\+?[0-9]{10,15}$/.test(String(rawPhone).trim())) { 
                            matchedCustomer.phone = String(rawPhone).trim(); 
                            matchedCustomer.normalizedPhone = phone; 
                            updated = true; 
                        }
                        if (!matchedCustomer.address && combinedAddress) { 
                            matchedCustomer.address = combinedAddress; 
                            matchedCustomer.normalizedAddress = address; 
                            updated = true; 
                        }
                        if (updated) await matchedCustomer.save();
                        continue;
                    }

                    // Append entry and update missing fields
                    matchedCustomer.serviceEntries.push(newServiceEntry);
                    
                    if (!matchedCustomer.name && name) { matchedCustomer.name = name; }
                    if (!matchedCustomer.phone && rawPhone && /^(?:\+?[0-9]{10,15})?$/.test(String(rawPhone).trim())) { 
                        matchedCustomer.phone = String(rawPhone).trim(); 
                        matchedCustomer.normalizedPhone = phone; 
                    }
                    if (!matchedCustomer.address && combinedAddress) { 
                        matchedCustomer.address = combinedAddress; 
                        matchedCustomer.normalizedAddress = address; 
                    }
                    
                    await matchedCustomer.save();
                    summary.addedServiceEntries++;

                } else {
                    // CREATE NEW
                    const newCust = new Customer({
                        name: name || "Unknown",
                        phone: rawPhone ? String(rawPhone).trim() : "",
                        address: combinedAddress || "Unknown",
                        normalizedPhone: phone,
                        normalizedAddress: address,
                        serviceEntries: [newServiceEntry]
                    });

                    await newCust.save();
                    summary.createdCustomers++;
                    summary.addedServiceEntries++;
                }

            } catch (err) {
                summary.errors.push({ row: i + 2, reason: err.message });
            }
        }

        return NextResponse.json({ success: true, summary });

    } catch (err) {
        return handleError(err);
    }
}
