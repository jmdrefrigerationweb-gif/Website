'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Droplets, LayoutDashboard, Search, Plus } from 'lucide-react';

const Navbar = () => {
    const pathname = usePathname();

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
                <div className="brand-tagline">RO Systems • Sales &amp; Service</div>
            </header>

            {/* Bottom Navigation */}
            <nav className="bottom-nav">
                {navItems.map((item) => (
                    <Link
                        key={item.to}
                        href={item.to}
                        className={`bottom-nav-item ${pathname === item.to ? 'active' : ''}`}
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
