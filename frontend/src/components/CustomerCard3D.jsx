import React, { useState, useRef } from 'react';
import { X, Edit2, Trash2, Droplets, MapPin, Phone, User, Calendar, Package, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDate, formatCurrency, getEntryTypeLabel, getNextServiceDate } from '../utils/helpers';
import './CustomerCard3D.css';

const CustomerCard3D = ({ customer, onClose, onEdit, onDelete }) => {
    const [expandedEntry, setExpandedEntry] = useState(null);
    const [tilt, setTilt] = useState({ x: 0, y: 0 });
    const cardRef = useRef(null);

    const nextServiceDate = getNextServiceDate(customer);

    // 3D tilt effect on mouse move
    const handleMouseMove = (e) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateY = ((x - centerX) / centerX) * 8;
        const rotateX = -((y - centerY) / centerY) * 6;
        setTilt({ x: rotateX, y: rotateY });
    };

    const handleMouseLeave = () => {
        setTilt({ x: 0, y: 0 });
    };

    return (
        <div className="card3d-overlay" onClick={onClose}>
            <div className="card3d-scene">
                <div
                    ref={cardRef}
                    className="card3d-card"
                    onClick={(e) => e.stopPropagation()}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    style={{
                        transform: `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                    }}
                >
                    {/* Glow orbs */}
                    <div className="card3d-orb orb-1" />
                    <div className="card3d-orb orb-2" />
                    <div className="card3d-orb orb-3" />

                    {/* Header */}
                    <div className="card3d-header">
                        <div className="card3d-logo">
                            <Droplets size={18} />
                            <span>JMD Refrigeration</span>
                        </div>
                        <div className="card3d-actions-top">
                            <button className="card3d-btn-action edit" onClick={() => onEdit(customer)} title="Edit">
                                <Edit2 size={16} />
                            </button>
                            <button className="card3d-btn-action delete" onClick={() => onDelete(customer._id)} title="Delete">
                                <Trash2 size={16} />
                            </button>
                            <button className="card3d-btn-action close" onClick={onClose} title="Close">
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Customer Info */}
                    <div className="card3d-customer-info">
                        <div className="card3d-avatar">
                            {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="card3d-details">
                            <h2 className="card3d-name">{customer.name}</h2>
                            <div className="card3d-meta">
                                <span className="card3d-meta-item">
                                    <Phone size={13} /> {customer.phone}
                                </span>
                                <span className="card3d-meta-item">
                                    <MapPin size={13} /> {customer.address}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Next Service Badge */}
                    {nextServiceDate && (
                        <div className="card3d-service-badge">
                            <Calendar size={14} />
                            <span>Next service: <strong>{formatDate(nextServiceDate)}</strong></span>
                        </div>
                    )}

                    {/* Divider */}
                    <div className="card3d-divider">
                        <span>Service History</span>
                    </div>

                    {/* Service Entries */}
                    <div className="card3d-entries">
                        {customer.serviceEntries && customer.serviceEntries.length > 0 ? (
                            [...customer.serviceEntries].reverse().map((entry, idx) => (
                                <div key={entry._id || idx} className="card3d-entry">
                                    <div
                                        className="card3d-entry-header"
                                        onClick={() => setExpandedEntry(expandedEntry === idx ? null : idx)}
                                    >
                                        <div className="entry-header-left">
                                            <span className="entry-type-badge">{getEntryTypeLabel(entry.type)}</span>
                                            <span className="entry-date">{formatDate(entry.date)}</span>
                                        </div>
                                        <div className="entry-header-right">
                                            <span className="entry-total">{formatCurrency(entry.totalCost)}</span>
                                            {expandedEntry === idx ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </div>
                                    </div>

                                    {expandedEntry === idx && (
                                        <div className="card3d-entry-body">
                                            {entry.components && entry.components.length > 0 && (
                                                <div className="entry-components">
                                                    <div className="components-header">
                                                        <Package size={13} /> Parts & Components
                                                    </div>
                                                    <div className="components-list">
                                                        {entry.components.map((comp, i) => (
                                                            <div key={i} className="component-row">
                                                                <span className="comp-name">{comp.name}</span>
                                                                <span className="comp-price">{formatCurrency(comp.price)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="component-row total-row">
                                                        <span className="comp-name">Total Collected</span>
                                                        <span className="comp-price total">{formatCurrency(entry.totalCost)}</span>
                                                    </div>
                                                </div>
                                            )}
                                            {entry.notes && (
                                                <div className="entry-notes">
                                                    <strong>Notes:</strong> {entry.notes}
                                                </div>
                                            )}
                                            {entry.nextServiceAfterMonths > 0 && (
                                                <div className="entry-next-service">
                                                    🗓 Next service after <strong>{entry.nextServiceAfterMonths} month{entry.nextServiceAfterMonths !== 1 ? 's' : ''}</strong>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="card3d-no-entries">No service entries yet</div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="card3d-footer">
                        <span>Customer since {formatDate(customer.createdAt)}</span>
                        <span>{customer.serviceEntries?.length || 0} service record{customer.serviceEntries?.length !== 1 ? 's' : ''}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerCard3D;
