import React, { useState } from 'react';
import { X, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { customerAPI } from '../services/api';
import './EditCustomerModal.css';

const EditCustomerModal = ({ customer, onClose, onSave }) => {
    const [form, setForm] = useState({
        name: customer.name || '',
        phone: customer.phone || '',
        address: customer.address || '',
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim() || !form.address.trim()) {
            toast.error('Name and address are required');
            return;
        }
        setSaving(true);
        try {
            await customerAPI.update(customer._id, form);
            toast.success('Customer updated successfully!');
            onSave();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="edit-modal-overlay" onClick={onClose}>
            <div className="edit-modal-box" onClick={(e) => e.stopPropagation()}>
                <div className="edit-modal-header">
                    <h3>Edit Customer</h3>
                    <button className="btn-modal-close" onClick={onClose}><X size={18} /></button>
                </div>

                <form onSubmit={handleSubmit} className="edit-form">
                    <div className="edit-field">
                        <label>Full Name *</label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="edit-input"
                            placeholder="Customer name"
                        />
                    </div>

                    <div className="edit-field">
                        <label>Phone Number *</label>
                        <input
                            type="tel"
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            className="edit-input"
                            placeholder="Phone number"
                        />
                    </div>

                    <div className="edit-field">
                        <label>Address *</label>
                        <textarea
                            value={form.address}
                            onChange={(e) => setForm({ ...form, address: e.target.value })}
                            className="edit-input edit-textarea"
                            placeholder="Full address"
                            rows={3}
                        />
                    </div>

                    <div className="edit-modal-actions">
                        <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn-save" disabled={saving}>
                            {saving ? <><Loader size={14} className="spin" /> Saving...</> : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditCustomerModal;
