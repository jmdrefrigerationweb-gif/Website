import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
});

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        const message = error.response?.data?.message || error.message || 'Network error';
        return Promise.reject(new Error(message));
    }
);

export const customerAPI = {
    // Check if phone exists
    checkPhone: (phone) => api.get(`/customers/check/${phone}`),

    // Create or update customer / add service entry
    upsert: (data) => api.post('/customers/upsert', data),

    // Get pending reminders for current month
    getPendingReminders: () => api.get('/customers/pending'),

    // Search customers
    search: (query) => api.get(`/customers/search?q=${encodeURIComponent(query)}`),

    // Get single customer
    getById: (id) => api.get(`/customers/${id}`),

    // Update customer basic info
    update: (id, data) => api.put(`/customers/${id}`, data),

    // Update a service entry
    updateServiceEntry: (customerId, entryId, data) =>
        api.put(`/customers/${customerId}/entries/${entryId}`, data),

    // Delete customer
    delete: (id) => api.delete(`/customers/${id}`),

    // Delete service entry
    deleteServiceEntry: (customerId, entryId) =>
        api.delete(`/customers/${customerId}/entries/${entryId}`),

    // Ignore reminder for N days
    ignoreReminder: (id, days) => api.patch(`/customers/${id}/ignore`, { days }),

    // Send reminders to selected customers
    sendReminders: (customerIds) => api.post('/customers/send-reminders', { customerIds }),
};

export default api;
