import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Droplets, LayoutDashboard, Search, Plus } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
    const location = useLocation();

    const navItems = [
        { to: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
        { to: '/search', icon: <Search size={20} />, label: 'Search' },
        { to: '/add', icon: <Plus size={20} />, label: 'Add Card' },
    ];

    return (
        <>
            {/* Top Header */}
            <header className="navbar-header">
                <div className="navbar-brand">
                    <div className="brand-icon">
                        <Droplets size={28} color="#60a5fa" />
                    </div>
                    <div className="brand-text">
                        <span className="brand-main">JMD</span>
                        <span className="brand-sub">Refrigeration</span>
                    </div>
                </div>
                <div className="brand-tagline">RO Systems • Sales & Service</div>
            </header>

            {/* Bottom Navigation (Mobile) */}
            <nav className="bottom-nav">
                {navItems.map((item) => (
                    <Link
                        key={item.to}
                        to={item.to}
                        className={`bottom-nav-item ${location.pathname === item.to ? 'active' : ''}`}
                    >
                        {item.icon}
                        <span>{item.label}</span>
                    </Link>
                ))}
            </nav>
        </>
    );
};

export default Navbar;
