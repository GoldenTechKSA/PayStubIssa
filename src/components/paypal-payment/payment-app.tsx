import React, { useState } from 'react';
import PaymentForm from './payment-form';
import PaymentHistory from './payment-history';

interface PaymentRecord {
  id: string;
  amount: string;
  currency: string;
  timestamp: Date;
  status: string;
}

const App: React.FC = () => {
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([]);
  const [currentView, setCurrentView] = useState<'payment' | 'history'>('payment');

  const handlePaymentSuccess = (details: any) => {
    const newPayment: PaymentRecord = {
      id: details.id,
      amount: details.purchase_units[0].amount.value,
      currency: details.purchase_units[0].amount.currency_code,
      timestamp: new Date(),
      status: 'completed'
    };

    setPaymentHistory(prev => [newPayment, ...prev]);
    
    // Log payment details for debugging
    console.log('Issam Payment successful:', details);
  };

  const handlePaymentError = (error: any) => {
    console.error('Payment error:', error);
    // You could add error tracking or user notifications here
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <header style={{
          textAlign: 'center',
          marginBottom: '40px'
        }}>
          <h1 style={{
            fontSize: '36px',
            fontWeight: 'bold',
            color: '#1f2937',
            margin: '0 0 16px',
            textShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            PayPal Integration Demo
          </h1>
          <p style={{
            fontSize: '18px',
            color: '#6b7280',
            margin: '0',
            maxWidth: '600px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            A secure payment solution built with React and TypeScript
          </p>
        </header>

        {/* Navigation */}
        <nav style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '40px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <button
              onClick={() => setCurrentView('payment')}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: '600',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: currentView === 'payment' ? '#3b82f6' : 'transparent',
                color: currentView === 'payment' ? '#ffffff' : '#6b7280'
              }}
              onMouseEnter={(e) => {
                if (currentView !== 'payment') {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                }
              }}
              onMouseLeave={(e) => {
                if (currentView !== 'payment') {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              Make Payment
            </button>
            <button
              onClick={() => setCurrentView('history')}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: '600',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: currentView === 'history' ? '#3b82f6' : 'transparent',
                color: currentView === 'history' ? '#ffffff' : '#6b7280'
              }}
              onMouseEnter={(e) => {
                if (currentView !== 'history') {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                }
              }}
              onMouseLeave={(e) => {
                if (currentView !== 'history') {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              Payment History ({paymentHistory.length})
            </button>
          </div>
        </nav>

        {/* Main Content */}
        <main style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start'
        }}>
          {currentView === 'payment' ? (
            <PaymentForm
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
            />
          ) : (
            <PaymentHistory payments={paymentHistory} />
          )}
        </main>

        {/* Footer */}
        <footer style={{
          marginTop: '60px',
          textAlign: 'center',
          padding: '20px',
          borderTop: '1px solid #e5e7eb',
          backgroundColor: '#ffffff',
          borderRadius: '12px'
        }}>
          <p style={{
            margin: '0 0 8px',
            fontSize: '14px',
            color: '#6b7280'
          }}>
            Built with React, TypeScript, and PayPal SDK
          </p>
          <p style={{
            margin: '0',
            fontSize: '12px',
            color: '#9ca3af'
          }}>
            Remember to replace YOUR_PAYPAL_CLIENT_ID with your actual PayPal client ID
          </p>
        </footer>
      </div>
    </div>
  );
};

export default App;