export const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

export const formatCurrency = (amount) => {
    if (amount == null) return '₹0';
    return `₹${Number(amount).toLocaleString('en-IN')}`;
};

export const getEntryTypeLabel = (type) => {
    const labels = {
        new_installation: '🆕 New System Installed',
        service: '🔧 Service Done',
    };
    return labels[type] || type;
};

export const getNextServiceDate = (customer) => {
    if (!customer.serviceEntries || customer.serviceEntries.length === 0) return null;
    const entries = customer.serviceEntries.filter(
        (e) => e.nextServiceAfterMonths && e.nextServiceAfterMonths > 0
    );
    if (!entries.length) return null;
    const latest = entries.reduce((a, b) =>
        new Date(a.date) > new Date(b.date) ? a : b
    );
    const d = new Date(latest.date);
    d.setMonth(d.getMonth() + latest.nextServiceAfterMonths);
    return d;
};

export const getUrgencyColor = (nextServiceDate) => {
    if (!nextServiceDate) return '#64748b';
    const now = new Date();
    const diff = now - new Date(nextServiceDate);
    const monthsOverdue = diff / (1000 * 60 * 60 * 24 * 30);
    if (monthsOverdue > 3) return '#ef4444';
    if (monthsOverdue > 1) return '#f97316';
    return '#22c55e';
};

export const capitalize = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
};
