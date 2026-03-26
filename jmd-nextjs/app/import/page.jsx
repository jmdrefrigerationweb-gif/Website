'use client';

import React, { useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ImportPage() {
    const [file, setFile] = useState(null);
    const [importing, setImporting] = useState(false);
    const [summary, setSummary] = useState(null);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setSummary(null);
        }
    };

    const handleImport = async () => {
        if (!file) {
            toast.error("Please select an Excel file first.");
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        setImporting(true);
        try {
            const res = await fetch('/api/customers/import-excel', {
                method: 'POST',
                body: formData
            });

            const data = await res.json();
            if (res.ok && data.success) {
                toast.success("Import completed successfully!");
                setSummary(data.summary);
            } else {
                toast.error(data.message || "Failed to import file.");
            }
        } catch (err) {
            toast.error(err.message || "An error occurred during import.");
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="search-page" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
            <div className="search-header">
                <h1>Bulk Excel Import</h1>
                <p>Upload historical service data to automatically create records and update the CRM.</p>
            </div>

            <div style={{
                border: '2px dashed #93c5fd',
                borderRadius: '12px',
                padding: '3rem',
                textAlign: 'center',
                backgroundColor: '#eff6ff',
                marginBottom: '2rem'
            }}>
                <FileSpreadsheet size={48} color="#3b82f6" style={{ margin: '0 auto 1rem' }} />
                <h3 style={{ marginBottom: '0.5rem', color: '#1e3a8a' }}>Select Excel File</h3>
                <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Supports .xlsx and .xls formats</p>
                
                <input 
                    type="file" 
                    accept=".xlsx, .xls" 
                    onChange={handleFileChange} 
                    id="excel-upload"
                    style={{ display: 'none' }}
                />
                <label htmlFor="excel-upload" className="btn-primary" style={{ cursor: 'pointer', display: 'inline-block' }}>
                    Choose File
                </label>
                {file && <p style={{ marginTop: '1rem', fontWeight: 'bold', color: '#16a34a' }}>Selected: {file.name}</p>}
            </div>

            <button 
                onClick={handleImport} 
                className="btn-primary" 
                disabled={!file || importing}
                style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
            >
                {importing ? <Loader size={20} className="spin" /> : <Upload size={20} />}
                {importing ? "Importing Data..." : "Run Import"}
            </button>

            {summary && (
                <div style={{ marginTop: '2rem', padding: '1.5rem', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a', marginBottom: '1rem' }}>
                        <CheckCircle color="#16a34a" /> Import Summary
                    </h2>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#334155' }}>
                        <li style={{ padding: '0.5rem 0', borderBottom: '1px solid #e2e8f0' }}><strong>Total Rows Read:</strong> {summary.totalRows}</li>
                        <li style={{ padding: '0.5rem 0', borderBottom: '1px solid #e2e8f0' }}><strong>Successfully Processed:</strong> {summary.processedRows}</li>
                        <li style={{ padding: '0.5rem 0', borderBottom: '1px solid #e2e8f0', color: '#ca8a04' }}><strong>Skipped (Empty):</strong> {summary.skippedRows}</li>
                        <li style={{ padding: '0.5rem 0', borderBottom: '1px solid #e2e8f0', color: '#ca8a04' }}><strong>Duplicate Entries Skipped:</strong> {summary.duplicateRowsSkipped}</li>
                        <li style={{ padding: '0.5rem 0', borderBottom: '1px solid #e2e8f0', color: '#16a34a' }}><strong>New Customers Created:</strong> {summary.createdCustomers}</li>
                        <li style={{ padding: '0.5rem 0', borderBottom: '1px solid #e2e8f0', color: '#1e3a8a' }}><strong>Existing Customers Matched & Updated:</strong> {summary.matchedCustomers}</li>
                        <li style={{ padding: '0.5rem 0' }}><strong>Total Service Entries Added:</strong> {summary.addedServiceEntries}</li>
                    </ul>

                    {summary.errors && summary.errors.length > 0 && (
                        <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#fef2f2', borderLeft: '4px solid #dc2626', borderRadius: '4px' }}>
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#991b1b', margin: '0 0 0.5rem 0' }}>
                                <AlertCircle size={16} /> Error Log
                            </h4>
                            <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.85rem', color: '#7f1d1d' }}>
                                {summary.errors.map((err, idx) => (
                                    <li key={idx}>Row {err.row}: {err.reason}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
