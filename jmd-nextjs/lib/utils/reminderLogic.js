/**
 * Reminder Logic Utilities
 */

export const calculateNextServiceDate = (customer) => {
    if (!customer.serviceEntries || customer.serviceEntries.length === 0) return null;

    const entriesWithSchedule = customer.serviceEntries.filter(
        (e) => e.nextServiceAfterMonths && e.nextServiceAfterMonths > 0
    );

    if (entriesWithSchedule.length === 0) return null;

    const latest = entriesWithSchedule.reduce((a, b) =>
        new Date(a.date) > new Date(b.date) ? a : b
    );

    const serviceDate = new Date(latest.date);
    serviceDate.setMonth(serviceDate.getMonth() + latest.nextServiceAfterMonths);
    return serviceDate;
};

export const isServicePendingThisMonth = (nextServiceDate, now) => {
    if (!nextServiceDate) return false;
    const serviceYear = nextServiceDate.getFullYear();
    const serviceMonth = nextServiceDate.getMonth();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    if (serviceYear < currentYear) return true;
    if (serviceYear === currentYear && serviceMonth <= currentMonth) return true;
    return false;
};

export const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });
};
