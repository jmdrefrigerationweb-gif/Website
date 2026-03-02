'use client';

import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

const api = axios.create({
    baseURL: API_BASE,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        const message = error.response?.data?.message || error.message || 'Network error';
        return Promise.reject(new Error(message));
    }
);

export const customerAPI = {
    checkPhone: (phone) => api.get(`/customers/check/${phone}`),
    upsert: (data) => api.post('/customers/upsert', data),
    getPendingReminders: () => api.get('/customers/pending'),
    search: (query) => api.get(`/customers/search?q=${encodeURIComponent(query)}`),
    getById: (id) => api.get(`/customers/${id}`),
    update: (id, data) => api.put(`/customers/${id}`, data),
    updateServiceEntry: (customerId, entryId, data) =>
        api.put(`/customers/${customerId}/entries/${entryId}`, data),
    delete: (id) => api.delete(`/customers/${id}`),
    deleteServiceEntry: (customerId, entryId) =>
        api.delete(`/customers/${customerId}/entries/${entryId}`),
    ignoreReminder: (id, days) => api.patch(`/customers/${id}/ignore`, { days }),
    sendReminders: (customerIds) => api.post('/customers/send-reminders', { customerIds }),
};

export default api;
