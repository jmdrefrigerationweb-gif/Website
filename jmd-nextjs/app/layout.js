import './globals.css';
import { Toaster } from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import { AppProvider } from '@/context/AppContext';

export const metadata = {
  title: 'JMD Refrigeration',
  description: 'RO Systems Sales & Service Management',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppProvider>
          <div className="app">
            <Navbar />
            <main className="main-content">{children}</main>
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
                success: { iconTheme: { primary: '#4ade80', secondary: '#0f172a' } },
                error: { iconTheme: { primary: '#f87171', secondary: '#0f172a' } },
              }}
            />
          </div>
        </AppProvider>
      </body>
    </html>
  );
}
