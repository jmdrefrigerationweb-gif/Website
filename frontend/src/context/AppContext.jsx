import React, { createContext, useContext, useState, useCallback } from 'react';
import { customerAPI } from '../services/api';
import toast from 'react-hot-toast';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const [pendingCustomers, setPendingCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchPendingReminders = useCallback(async () => {
        setLoading(true);
        try {
            const res = await customerAPI.getPendingReminders();
            setPendingCustomers(res.data || []);
        } catch (err) {
            toast.error(err.message || 'Failed to load reminders');
        } finally {
            setLoading(false);
        }
    }, []);

    return (
        <AppContext.Provider
            value={{
                pendingCustomers,
                setPendingCustomers,
                selectedCustomer,
                setSelectedCustomer,
                loading,
                fetchPendingReminders,
            }}
        >
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useApp must be used within AppProvider');
    return ctx;
};
