'use client';

import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { customerAPI } from '@/services/api';
import CustomerCard3D from '@/components/CustomerCard3D';
import EditCustomerModal from '@/components/EditCustomerModal';

export default function AllCustomersPage() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openCard, setOpenCard] = useState(null);
    const [editCustomer, setEditCustomer] = useState(null);

    const fetchAllCustomers = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/customers/all');
            const data = await res.json();
            if (res.ok && data.success) {
                setCustomers(data.data || []);
            } else {
                toast.error(data.message || 'Failed to fetch customers');
            }
        } catch (err) {
            toast.error(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllCustomers();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this customer permanently?')) return;
        try {
            await customerAPI.delete(id);
            toast.success('Customer deleted');
            setOpenCard(null);
            setCustomers((prev) => prev.filter((c) => c._id !== id));
        } catch (err) {
            toast.error(err.message);
        }
    };

    return (
        <div className="search-page">
            <div className="search-header">
                <h1>All Customers</h1>
                <p>View all stored customer cards in the CRM</p>
            </div>

            {loading ? (
                <div className="search-loading">
                    <div className="loading-spinner" />
                </div>
            ) : customers.length === 0 ? (
                <div className="search-empty">
                    <Users size={40} />
                    <p>No customers found</p>
                </div>
            ) : (
                <div className="search-results">
                    <p className="results-count">Total {customers.length} customer{customers.length !== 1 ? 's' : ''}</p>
                    {customers.map((customer) => (
                        <div key={customer._id} className="search-result-card" onClick={() => setOpenCard(customer)}>
                            <div className="result-avatar">{customer.name.charAt(0).toUpperCase()}</div>
                            <div className="result-info">
                                <h3>{customer.name}</h3>
                                <p className="result-phone" style={!customer.phone ? { color: '#9ca3af' } : {}}>
                                    📞 {customer.phone || 'No Phone Number'}
                                </p>
                                <p className="result-address">📍 {customer.address}</p>
                            </div>
                            <div className="result-meta">
                                <span className="result-entries-count">{customer.serviceEntries?.length || 0} records</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {openCard && (
                <CustomerCard3D
                    customer={openCard}
                    onClose={() => setOpenCard(null)}
                    onEdit={(c) => { setOpenCard(null); setEditCustomer(c); }}
                    onDelete={handleDelete}
                />
            )}

            {editCustomer && (
                <EditCustomerModal
                    customer={editCustomer}
                    onClose={() => setEditCustomer(null)}
                    onSave={async () => { setEditCustomer(null); await fetchAllCustomers(); }}
                />
            )}
        </div>
    );
}
