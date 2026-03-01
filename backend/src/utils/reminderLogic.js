/**
 * Reminder Logic Utilities
 * Calculates next service dates and determines if service is pending this month
 */

/**
 * Calculate the next service date based on the last service entry
 * @param {Object} customer - Mongoose customer document
 * @returns {Date|null} - Next service date or null if not scheduled
 */
const calculateNextServiceDate = (customer) => {
    if (!customer.serviceEntries || customer.serviceEntries.length === 0) return null;

    // Find the latest entry that has a nextServiceAfterMonths set
    const entriesWithSchedule = customer.serviceEntries.filter(
        (e) => e.nextServiceAfterMonths && e.nextServiceAfterMonths > 0
    );

    if (entriesWithSchedule.length === 0) return null;

    // Use the most recent entry with a schedule
    const latest = entriesWithSchedule.reduce((a, b) =>
        new Date(a.date) > new Date(b.date) ? a : b
    );

    const serviceDate = new Date(latest.date);
    serviceDate.setMonth(serviceDate.getMonth() + latest.nextServiceAfterMonths);
    return serviceDate;
};

/**
 * Check if a service is pending in the current month (current month ± 0 buffer)
 * We show if next service month <= current month (overdue or due this month)
 * @param {Date} nextServiceDate
 * @param {Date} now
 * @returns {boolean}
 */
const isServicePendingThisMonth = (nextServiceDate, now) => {
    if (!nextServiceDate) return false;

    const serviceYear = nextServiceDate.getFullYear();
    const serviceMonth = nextServiceDate.getMonth();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Show if service was due this month or earlier (overdue)
    if (serviceYear < currentYear) return true;
    if (serviceYear === currentYear && serviceMonth <= currentMonth) return true;
    return false;
};

/**
 * Format date to readable string
 * @param {Date} date
 * @returns {string}
 */
const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });
};

module.exports = {
    calculateNextServiceDate,
    isServicePendingThisMonth,
    formatDate,
};
