import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProvider } from './context/AppContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Search from './pages/Search';
import AddCustomer from './pages/AddCustomer';
import './index.css';

const App = () => {
  return (
    <AppProvider>
      <Router>
        <div className="app">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/search" element={<Search />} />
              <Route path="/add" element={<AddCustomer />} />
            </Routes>
          </main>
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: '#0f172a',
                color: '#f1f5f9',
                border: '1px solid rgba(96, 165, 250, 0.2)',
                borderRadius: '12px',
                fontSize: '0.88rem',
                padding: '12px 16px',
              },
              success: {
                iconTheme: { primary: '#4ade80', secondary: '#0f172a' },
              },
              error: {
                iconTheme: { primary: '#f87171', secondary: '#0f172a' },
              },
            }}
          />
        </div>
      </Router>
    </AppProvider>
  );
};

export default App;
