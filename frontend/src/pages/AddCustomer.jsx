import React, { useState } from 'react';
import { Plus, Trash2, Loader, Phone, User, MapPin, Wrench, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { customerAPI } from '../services/api';
import './AddCustomer.css';

const EMPTY_COMPONENT = { name: '', price: '' };

const EMPTY_ENTRY = {
    date: new Date().toISOString().split('T')[0],
    type: 'service',
    components: [{ ...EMPTY_COMPONENT }],
    notes: '',
    nextServiceAfterMonths: 12,
};

const AddCustomer = () => {
    const [step, setStep] = useState(1); // 1: phone check, 2: fill form
    const [phoneInput, setPhoneInput] = useState('');
    const [checking, setChecking] = useState(false);
    const [existingCustomer, setExistingCustomer] = useState(null);
    const [isNew, setIsNew] = useState(false);

    const [form, setForm] = useState({
        name: '',
        phone: '',
        address: '',
    });

    const [entry, setEntry] = useState({ ...EMPTY_ENTRY });
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    // ── Step 1: Check phone ──────────────────────────────
    const handlePhoneCheck = async (e) => {
        e.preventDefault();
        if (!/^\+?[0-9]{10,15}$/.test(phoneInput.trim())) {
            toast.error('Enter a valid phone number (10–15 digits)');
            return;
        }
        setChecking(true);
        try {
            const res = await customerAPI.checkPhone(phoneInput.trim());
            if (res.exists) {
                setExistingCustomer(res.data);
                setForm({ name: res.data.name, phone: res.data.phone, address: res.data.address });
                setIsNew(false);
            } else {
                setExistingCustomer(null);
                setForm({ name: '', phone: phoneInput.trim(), address: '' });
                setIsNew(true);
            }
            setStep(2);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setChecking(false);
        }
    };

    // ── Component helpers ─────────────────────────────────
    const updateComponent = (i, field, value) => {
        const updated = [...entry.components];
        updated[i] = { ...updated[i], [field]: value };
        setEntry({ ...entry, components: updated });
    };

    const addComponent = () => {
        setEntry({ ...entry, components: [...entry.components, { ...EMPTY_COMPONENT }] });
    };

    const removeComponent = (i) => {
        const updated = entry.components.filter((_, idx) => idx !== i);
        setEntry({ ...entry, components: updated.length ? updated : [{ ...EMPTY_COMPONENT }] });
    };

    const totalCost = entry.components.reduce(
        (sum, c) => sum + (parseFloat(c.price) || 0),
        0
    );

    // ── Submit ────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.name.trim()) { toast.error('Customer name is required'); return; }
        if (!form.address.trim()) { toast.error('Address is required'); return; }

        const validComponents = entry.components.filter((c) => c.name.trim());
        if (validComponents.length === 0) {
            toast.error('Add at least one component/part');
            return;
        }

        const payload = {
            name: form.name.trim(),
            phone: form.phone.trim(),
            address: form.address.trim(),
            serviceEntry: {
                ...entry,
                components: validComponents.map((c) => ({
                    name: c.name.trim(),
                    price: parseFloat(c.price) || 0,
                })),
                totalCost,
                nextServiceAfterMonths: parseInt(entry.nextServiceAfterMonths) || 0,
            },
        };

        setSubmitting(true);
        try {
            await customerAPI.upsert(payload);
            toast.success(isNew ? '🎉 New customer card created!' : '✅ Service entry added!');
            setSuccess(true);
            // Reset after 2s
            setTimeout(() => {
                setStep(1);
                setPhoneInput('');
                setForm({ name: '', phone: '', address: '' });
                setEntry({ ...EMPTY_ENTRY });
                setSuccess(false);
                setExistingCustomer(null);
                setIsNew(false);
            }, 2000);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    // ── Render Step 1 ─────────────────────────────────────
    if (step === 1) {
        return (
            <div className="add-page">
                <div className="add-header">
                    <h1>Add Customer / Entry</h1>
                    <p>Enter phone number to begin</p>
                </div>

                <form onSubmit={handlePhoneCheck} className="phone-check-form">
                    <div className="form-field">
                        <label><Phone size={14} /> Phone Number</label>
                        <input
                            type="tel"
                            placeholder="e.g. 9876543210"
                            value={phoneInput}
                            onChange={(e) => setPhoneInput(e.target.value)}
                            className="form-input"
                            autoFocus
                        />
                        <p className="field-hint">We'll check if this customer already exists</p>
                    </div>
                    <button type="submit" className="btn-primary" disabled={checking}>
                        {checking ? <><Loader size={16} className="spin" /> Checking...</> : 'Continue →'}
                    </button>
                </form>
            </div>
        );
    }

    // ── Render Step 2 ─────────────────────────────────────
    return (
        <div className="add-page">
            <div className="add-header">
                {existingCustomer ? (
                    <>
                        <div className="existing-badge">Existing Customer</div>
                        <h1>{existingCustomer.name}</h1>
                        <p>Adding a new service entry to this customer's card</p>
                    </>
                ) : (
                    <>
                        <div className="new-badge">New Customer</div>
                        <h1>Create New Card</h1>
                        <p>Fill in all details to create a new customer card</p>
                    </>
                )}
            </div>

            <form onSubmit={handleSubmit} className="customer-form">
                {/* ─── Customer Details ─── */}
                <div className="form-section">
                    <div className="section-title">
                        <User size={16} />
                        Customer Details
                    </div>

                    <div className="form-field">
                        <label>Full Name *</label>
                        <input
                            type="text"
                            placeholder="Customer's full name"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="form-input"
                            readOnly={!!existingCustomer}
                        />
                    </div>

                    <div className="form-field">
                        <label><Phone size={13} /> Phone</label>
                        <input
                            type="tel"
                            value={form.phone}
                            className="form-input"
                            readOnly
                        />
                    </div>

                    <div className="form-field">
                        <label><MapPin size={13} /> Address *</label>
                        <textarea
                            placeholder="Full address"
                            value={form.address}
                            onChange={(e) => setForm({ ...form, address: e.target.value })}
                            className="form-textarea"
                            rows={2}
                            readOnly={!!existingCustomer}
                        />
                    </div>
                </div>

                {/* ─── Service Entry ─── */}
                <div className="form-section">
                    <div className="section-title">
                        <Wrench size={16} />
                        Work Details
                    </div>

                    <div className="form-row">
                        <div className="form-field">
                            <label>Date *</label>
                            <input
                                type="date"
                                value={entry.date}
                                onChange={(e) => setEntry({ ...entry, date: e.target.value })}
                                className="form-input"
                            />
                        </div>

                        <div className="form-field">
                            <label>Type *</label>
                            <div className="select-wrapper">
                                <select
                                    value={entry.type}
                                    onChange={(e) => setEntry({ ...entry, type: e.target.value })}
                                    className="form-select"
                                >
                                    <option value="new_installation">🆕 New System Installed</option>
                                    <option value="service">🔧 Service Done</option>
                                </select>
                                <ChevronDown size={14} className="select-chevron" />
                            </div>
                        </div>
                    </div>

                    {/* Components */}
                    <div className="form-field">
                        <label>Parts & Components</label>
                        <div className="components-editor">
                            <div className="components-head">
                                <span>Part / Component Name</span>
                                <span>Price (₹)</span>
                            </div>
                            {entry.components.map((comp, i) => (
                                <div key={i} className="component-row-editor">
                                    <input
                                        type="text"
                                        placeholder={`e.g. RO Membrane, Filter`}
                                        value={comp.name}
                                        onChange={(e) => updateComponent(i, 'name', e.target.value)}
                                        className="comp-input comp-name-input"
                                    />
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={comp.price}
                                        onChange={(e) => updateComponent(i, 'price', e.target.value)}
                                        className="comp-input comp-price-input"
                                        min="0"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeComponent(i)}
                                        className="btn-remove-comp"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                            <button type="button" onClick={addComponent} className="btn-add-comp">
                                <Plus size={14} /> Add Part
                            </button>
                        </div>

                        <div className="total-display">
                            <span>Total Collected</span>
                            <span className="total-amount">₹{totalCost.toLocaleString('en-IN')}</span>
                        </div>
                    </div>

                    <div className="form-field">
                        <label>Notes (optional)</label>
                        <input
                            type="text"
                            placeholder="Any remarks about this service"
                            value={entry.notes}
                            onChange={(e) => setEntry({ ...entry, notes: e.target.value })}
                            className="form-input"
                        />
                    </div>

                    <div className="form-field">
                        <label>Next Service After (months)</label>
                        <input
                            type="number"
                            placeholder="e.g. 6, 12"
                            value={entry.nextServiceAfterMonths}
                            onChange={(e) => setEntry({ ...entry, nextServiceAfterMonths: e.target.value })}
                            className="form-input"
                            min="0"
                            max="120"
                        />
                        <p className="field-hint">0 = no scheduled next service</p>
                    </div>
                </div>

                {/* Submit */}
                <div className="form-actions">
                    <button type="button" className="btn-secondary" onClick={() => setStep(1)}>
                        ← Back
                    </button>
                    <button type="submit" className="btn-primary" disabled={submitting || success}>
                        {success ? '✅ Saved!' : submitting ? <><Loader size={16} className="spin" /> Saving...</> : isNew ? 'Create Card' : 'Add Entry'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddCustomer;
