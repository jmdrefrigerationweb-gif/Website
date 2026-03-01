import React, { useState } from 'react';
import { Search as SearchIcon, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { customerAPI } from '../services/api';
import CustomerCard3D from '../components/CustomerCard3D';
import EditCustomerModal from '../components/EditCustomerModal';
import { formatDate } from '../utils/helpers';
import './Search.css';

const Search = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [openCard, setOpenCard] = useState(null);
    const [editCustomer, setEditCustomer] = useState(null);
    const [searched, setSearched] = useState(false);

    const handleSearch = async (e) => {
        e?.preventDefault();
        if (!query.trim()) { toast.error('Enter a name or phone number'); return; }
        setSearching(true);
        setSearched(true);
        try {
            const res = await customerAPI.search(query);
            setResults(res.data || []);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSearching(false);
        }
    };

    const handleInputChange = (e) => {
        setQuery(e.target.value);
        if (!e.target.value) { setResults([]); setSearched(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this customer permanently?')) return;
        try {
            await customerAPI.delete(id);
            toast.success('Customer deleted');
            setOpenCard(null);
            setResults((prev) => prev.filter((c) => c._id !== id));
        } catch (err) {
            toast.error(err.message);
        }
    };

    return (
        <div className="search-page">
            <div className="search-header">
                <h1>Find Customer</h1>
                <p>Search by name or phone number</p>
            </div>

            <form className="search-form" onSubmit={handleSearch}>
                <div className="search-input-wrapper">
                    <SearchIcon size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Name or phone number..."
                        value={query}
                        onChange={handleInputChange}
                        className="search-input"
                        autoFocus
                    />
                </div>
                <button type="submit" className="btn-search" disabled={searching}>
                    {searching ? '...' : 'Search'}
                </button>
            </form>

            {/* Results */}
            {searching && (
                <div className="search-loading">
                    <div className="loading-spinner" />
                </div>
            )}

            {!searching && searched && results.length === 0 && (
                <div className="search-empty">
                    <User size={40} />
                    <p>No customers found for "{query}"</p>
                </div>
            )}

            {!searching && results.length > 0 && (
                <div className="search-results">
                    <p className="results-count">{results.length} result{results.length !== 1 ? 's' : ''} found</p>
                    {results.map((customer) => (
                        <div
                            key={customer._id}
                            className="search-result-card"
                            onClick={() => setOpenCard(customer)}
                        >
                            <div className="result-avatar">{customer.name.charAt(0).toUpperCase()}</div>
                            <div className="result-info">
                                <h3>{customer.name}</h3>
                                <p className="result-phone">📞 {customer.phone}</p>
                                <p className="result-address">📍 {customer.address}</p>
                            </div>
                            <div className="result-meta">
                                <span className="result-entries-count">
                                    {customer.serviceEntries?.length || 0} records
                                </span>
                                <span className="result-since">{formatDate(customer.createdAt)}</span>
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
                    onSave={async () => {
                        setEditCustomer(null);
                        await handleSearch();
                    }}
                />
            )}
        </div>
    );
};

export default Search;
