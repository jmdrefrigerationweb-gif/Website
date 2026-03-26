/**
 * Helper functions for parsing and normalizing customer data from Excel imports.
 */

export const cleanName = (name) => {
    if (!name) return "";
    return String(name).trim().replace(/\s+/g, " ");
};

export const normalizePhone = (phone) => {
    if (!phone) return "";
    let str = String(phone).trim();
    
    // Remove all non-digit characters
    str = str.replace(/\D/g, "");
    
    // Handle leading Indian prefixes (91 or 0)
    if (str.length > 10 && str.startsWith("91")) {
        str = str.substring(2);
    } else if (str.length > 10 && str.startsWith("0")) {
        str = str.substring(1);
    }
    
    // For anything still longer than 10, just keep the last 10 digits
    if (str.length > 10) {
        str = str.slice(-10);
    }
    
    return str;
};

export const normalizeAddress = (address) => {
    if (!address) return "";
    let str = String(address).toLowerCase().trim();
    // Collapse spaces
    str = str.replace(/\s+/g, " ");
    // Remove unnecessary commas or dots
    str = str.replace(/[,.]/g, "");
    return str.trim();
};

export const mapExcelHeaders = (headers) => {
    const mapped = {
        date: null,
        phone: null,
        name: null,
        address: null,
        city: null,
        productModel: null,
        part: null,
        amount: null,
    };

    headers.forEach((h) => {
        if (!h) return;
        const normalized = String(h).toLowerCase().replace(/[^a-z0-9]/g, "");

        if (normalized.includes("date") && !mapped.date) mapped.date = h;
        else if ((normalized.includes("mobil") || normalized.includes("phone")) && !mapped.phone) mapped.phone = h;
        else if ((normalized.includes("name") || normalized.includes("customer")) && !mapped.name) mapped.name = h;
        else if (normalized.includes("address") && !mapped.address) mapped.address = h;
        else if (normalized.includes("city") && !mapped.city) mapped.city = h;
        else if ((normalized.includes("model") || normalized.includes("product")) && !mapped.productModel) mapped.productModel = h;
        else if (normalized.includes("part") && !mapped.part) mapped.part = h;
        else if ((normalized.includes("amount") || normalized.includes("amou") || normalized.includes("price") || normalized.includes("cost")) && !mapped.amount) mapped.amount = h;
    });

    return mapped;
};

export const parseExcelDate = (excelDate) => {
    if (!excelDate) return new Date();
    
    // Check if it's already a JS Date
    if (excelDate instanceof Date) return excelDate;
    
    // If it's a number (Excel serial date)
    if (typeof excelDate === 'number') {
        const date = new Date((excelDate - (25567 + 2)) * 86400 * 1000);
        return isNaN(date.getTime()) ? new Date() : date;
    }
    
    // String form
    const parsed = new Date(excelDate);
    if (!isNaN(parsed.getTime())) return parsed;
    
    // Fallback to today if unparseable
    return new Date();
};
