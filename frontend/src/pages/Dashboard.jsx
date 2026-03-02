import React, { useEffect, useState, useCallback } from 'react';
import { Bell, Send, EyeOff, CheckSquare, Square, RefreshCw, Droplets, Wifi, WifiOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useApp } from '../context/AppContext';
import { customerAPI } from '../services/api';
import api from '../services/api';
import CustomerCard3D from '../components/CustomerCard3D';
import EditCustomerModal from '../components/EditCustomerModal';
import { formatDate, getNextServiceDate, getUrgencyColor } from '../utils/helpers';
import './Dashboard.css';

const Dashboard = () => {
    const { pendingCustomers, setPendingCustomers, fetchPendingReminders, loading } = useApp();
    const [selected, setSelected] = useState([]);
    const [openCard, setOpenCard] = useState(null);
    const [editCustomer, setEditCustomer] = useState(null);
    const [ignoreModal, setIgnoreModal] = useState({ open: false, customerId: null });
    const [ignoreDays, setIgnoreDays] = useState(7);
    const [sendingReminder, setSendingReminder] = useState(false);
    const [waStatus, setWaStatus] = useState('not_configured');

    const currentMonth = new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' });

    // Poll WhatsApp connection status every 5 seconds
    useEffect(() => {
        const checkWA = async () => {
            try {
                const res = await api.get('/whatsapp/status');
                setWaStatus(res.status || 'disconnected');
            } catch {
                setWaStatus('disconnected');
            }
        };
        checkWA();
        const interval = setInterval(checkWA, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        fetchPendingReminders();
    }, [fetchPendingReminders]);

    const toggleSelect = (id) => {
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selected.length === pendingCustomers.length) {
            setSelected([]);
        } else {
            setSelected(pendingCustomers.map((c) => c._id));
        }
    };

    const handleSendReminders = async () => {
        if (selected.length === 0) {
            toast.error('Please select at least one customer');
            return;
        }
        setSendingReminder(true);
        try {
            const res = await customerAPI.sendReminders(selected);
            const results = res.results || [];
            const sent = results.filter((r) => r.status === 'sent').length;
            const pending = results.filter((r) => r.status === 'pending').length;
            const failed = results.filter((r) => r.status === 'error').length;

            if (sent > 0) toast.success(`✅ ${sent} WhatsApp reminder(s) sent!`);
            if (pending > 0) toast(`📱 WhatsApp not connected — scan QR in terminal first`, { icon: '⚠️', duration: 6000 });
            if (failed > 0) toast.error(`❌ ${failed} reminder(s) failed`);
            setSelected([]);
        } catch (err) {
            toast.error(err.message || 'Failed to send reminders');
        } finally {
            setSendingReminder(false);
        }
    };

    const handleIgnoreSubmit = async () => {
        if (!ignoreModal.customerId) return;
        try {
            await customerAPI.ignoreReminder(ignoreModal.customerId, ignoreDays);
            toast.success(`⏸ Reminder snoozed for ${ignoreDays} days`);
            setIgnoreModal({ open: false, customerId: null });
            setSelected((prev) => prev.filter((id) => id !== ignoreModal.customerId));
            await fetchPendingReminders();
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this customer permanently?')) return;
        try {
            await customerAPI.delete(id);
            toast.success('Customer deleted');
            setOpenCard(null);
            await fetchPendingReminders();
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleEditSave = async () => {
        setEditCustomer(null);
        await fetchPendingReminders();
    };

    return (
        <div className="dashboard">
            {/* Page Header */}
            <div className="dashboard-header">
                <div className="dashboard-title-row">
                    <Bell size={22} className="header-icon" />
                    <div>
                        <h1>Pending Reminders</h1>
                        <p className="dashboard-subtitle">{currentMonth}</p>
                    </div>
                </div>
                <button className="btn-refresh" onClick={fetchPendingReminders} disabled={loading} title="Refresh">
                    <RefreshCw size={18} className={loading ? 'spin' : ''} />
                </button>
            </div>

            {/* Stats Bar */}
            <div className="dashboard-stats">
                <div className="stat-pill total">
                    <Droplets size={14} />
                    <span>{pendingCustomers.length} pending</span>
                </div>
                {selected.length > 0 && (
                    <div className="stat-pill selected">
                        <CheckSquare size={14} />
                        <span>{selected.length} selected</span>
                    </div>
                )}
                {/* WhatsApp / Meta API Status */}
                <div className={`stat-pill wa-status wa-${waStatus}`}>
                    {waStatus === 'ready' && <><Wifi size={14} /><span>WhatsApp Ready</span></>}
                    {waStatus === 'not_configured' && <><WifiOff size={14} /><span>WhatsApp Not Set Up</span></>}
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="dashboard-loading">
                    <div className="loading-spinner" />
                    <p>Fetching pending services...</p>
                </div>
            )}

            {/* Empty State */}
            {!loading && pendingCustomers.length === 0 && (
                <div className="dashboard-empty">
                    <div className="empty-icon">✅</div>
                    <h3>All clear for {currentMonth}!</h3>
                    <p>No pending service reminders this month.</p>
                </div>
            )}

            {/* Customer Cards */}
            {!loading && pendingCustomers.length > 0 && (
                <>
                    {/* Select All Bar */}
                    <div className="select-all-bar">
                        <button className="btn-select-all" onClick={toggleSelectAll}>
                            {selected.length === pendingCustomers.length ? (
                                <CheckSquare size={18} />
                            ) : (
                                <Square size={18} />
                            )}
                            <span>{selected.length === pendingCustomers.length ? 'Deselect All' : 'Select All'}</span>
                        </button>
                    </div>

                    {/* Cards Grid */}
                    <div className="pending-cards">
                        {pendingCustomers.map((customer) => {
                            const isSelected = selected.includes(customer._id);
                            const nextDate = getNextServiceDate(customer);
                            const urgencyColor = getUrgencyColor(nextDate);

                            return (
                                <div
                                    key={customer._id}
                                    className={`pending-card ${isSelected ? 'card-selected' : ''}`}
                                    style={{ '--urgency-color': urgencyColor }}
                                >
                                    {/* Checkbox */}
                                    <button
                                        className="card-checkbox"
                                        onClick={() => toggleSelect(customer._id)}
                                    >
                                        {isSelected ? <CheckSquare size={20} color="#60a5fa" /> : <Square size={20} />}
                                    </button>

                                    {/* Card Main Content (click to open 3D view) */}
                                    <div
                                        className="card-content"
                                        onClick={() => setOpenCard(customer)}
                                    >
                                        <div className="card-top">
                                            <div className="card-avatar">{customer.name.charAt(0).toUpperCase()}</div>
                                            <div className="card-info">
                                                <h3 className="card-customer-name">{customer.name}</h3>
                                                <p className="card-phone">📞 {customer.phone}</p>
                                                <p className="card-address">📍 {customer.address}</p>
                                            </div>
                                            <div className="card-urgency-dot" />
                                        </div>
                                        <div className="card-bottom">
                                            <div className="card-service-due">
                                                <span className="due-label">Service Due</span>
                                                <span className="due-date">{formatDate(nextDate)}</span>
                                            </div>
                                            <div className="card-entries-count">
                                                {customer.serviceEntries?.length || 0} records
                                            </div>
                                        </div>
                                    </div>

                                    {/* Ignore Button */}
                                    <button
                                        className="card-ignore-btn"
                                        onClick={() => setIgnoreModal({ open: true, customerId: customer._id })}
                                        title="Snooze reminder"
                                    >
                                        <EyeOff size={15} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* ─── Bottom Action Bar ─── */}
            {selected.length > 0 && (
                <div className="action-bar">
                    <div className="action-bar-inner">
                        <span className="action-count">{selected.length} selected</span>
                        <button
                            className="btn-send-reminder"
                            onClick={handleSendReminders}
                            disabled={sendingReminder}
                        >
                            <Send size={18} />
                            {sendingReminder ? 'Sending...' : 'Send Reminder'}
                        </button>
                    </div>
                </div>
            )}

            {/* ─── Ignore Modal ─── */}
            {ignoreModal.open && (
                <div className="modal-overlay" onClick={() => setIgnoreModal({ open: false, customerId: null })}>
                    <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                        <h3>⏸ Snooze Reminder</h3>
                        <p>How many days to snooze this reminder?</p>
                        <div className="ignore-presets">
                            {[3, 7, 14, 30].map((d) => (
                                <button
                                    key={d}
                                    className={`preset-btn ${ignoreDays === d ? 'active' : ''}`}
                                    onClick={() => setIgnoreDays(d)}
                                >
                                    {d}d
                                </button>
                            ))}
                        </div>
                        <div className="ignore-input-row">
                            <input
                                type="number"
                                value={ignoreDays}
                                min={1}
                                max={365}
                                onChange={(e) => setIgnoreDays(Number(e.target.value))}
                                className="ignore-input"
                            />
                            <span>days</span>
                        </div>
                        <div className="modal-actions">
                            <button className="btn-modal-cancel" onClick={() => setIgnoreModal({ open: false, customerId: null })}>
                                Cancel
                            </button>
                            <button className="btn-modal-confirm" onClick={handleIgnoreSubmit}>
                                Snooze
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 3D Card View */}
            {openCard && (
                <CustomerCard3D
                    customer={openCard}
                    onClose={() => setOpenCard(null)}
                    onEdit={(c) => { setOpenCard(null); setEditCustomer(c); }}
                    onDelete={handleDelete}
                />
            )}

            {/* Edit Modal */}
            {editCustomer && (
                <EditCustomerModal
                    customer={editCustomer}
                    onClose={() => setEditCustomer(null)}
                    onSave={handleEditSave}
                />
            )}
        </div>
    );
};

export default Dashboard;
