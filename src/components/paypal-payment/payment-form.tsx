import React, { useState } from 'react';
import PayPalButton from './paypal-button';

interface PaymentFormProps {
  onPaymentSuccess?: (details: any) => void;
  onPaymentError?: (error: any) => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  onPaymentSuccess,
  onPaymentError
}) => {
  const [amount, setAmount] = useState<string>('10.00');
  const [currency, setCurrency] = useState<string>('USD');
  const [description, setDescription] = useState<string>('');
  const [isPaymentSuccessful, setIsPaymentSuccessful] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers and decimal point
    if (/^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const handlePaymentSuccess = (details: any) => {
    setPaymentDetails(details);
    setIsPaymentSuccessful(true);
    if (onPaymentSuccess) {
      onPaymentSuccess(details);
    }
  };

  const handlePaymentError = (error: any) => {
    console.error('Payment failed:', error);
    if (onPaymentError) {
      onPaymentError(error);
    }
  };

  const handlePaymentCancel = () => {
    console.log('Payment cancelled by user');
  };

  const resetForm = () => {
    setIsPaymentSuccessful(false);
    setPaymentDetails(null);
    setAmount('10.00');
    setDescription('');
  };

  if (isPaymentSuccessful && paymentDetails) {
    return (
      <div style={{
        maxWidth: '500px',
        margin: '0 auto',
        padding: '32px',
        backgroundColor: '#f0fdf4',
        borderRadius: '12px',
        border: '1px solid #bbf7d0',
        textAlign: 'center'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          backgroundColor: '#10b981',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          fontSize: '32px',
          color: 'white'
        }}>
          ✓
        </div>
        <h2 style={{
          margin: '0 0 16px',
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#065f46'
        }}>
          Payment Successful!
        </h2>
        <p style={{
          margin: '0 0 24px',
          color: '#047857',
          fontSize: '16px'
        }}>
          Transaction ID: {paymentDetails.id}
        </p>
        <p style={{
          margin: '0 0 24px',
          color: '#047857',
          fontSize: '16px'
        }}>
          Amount: ${paymentDetails.purchase_units[0].amount.value} {paymentDetails.purchase_units[0].amount.currency_code}
        </p>
        <button
          onClick={resetForm}
          style={{
            backgroundColor: '#059669',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#047857';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#059669';
          }}
        >
          Make Another Payment
        </button>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '500px',
      margin: '0 auto',
      padding: '32px',
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      border: '1px solid #e5e7eb'
    }}>
      <h2 style={{
        margin: '0 0 24px',
        fontSize: '28px',
        fontWeight: 'bold',
        color: '#1f2937',
        textAlign: 'center'
      }}>
        Secure Payment
      </h2>

      <div style={{ marginBottom: '20px' }}>
        <label style={{
          display: 'block',
          marginBottom: '8px',
          fontSize: '14px',
          fontWeight: '600',
          color: '#374151'
        }}>
          Amount
        </label>
        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '16px',
            color: '#6b7280',
            fontWeight: '600'
          }}>
            $
          </span>
          <input
            type="text"
            value={amount}
            onChange={handleAmountChange}
            placeholder="0.00"
            style={{
              width: '100%',
              padding: '12px 16px 12px 28px',
              border: '2px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '16px',
              backgroundColor: '#f9fafb',
              transition: 'border-color 0.2s, background-color 0.2s',
              outline: 'none'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#3b82f6';
              e.target.style.backgroundColor = '#ffffff';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#d1d5db';
              e.target.style.backgroundColor = '#f9fafb';
            }}
          />
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{
          display: 'block',
          marginBottom: '8px',
          fontSize: '14px',
          fontWeight: '600',
          color: '#374151'
        }}>
          Currency
        </label>
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            border: '2px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '16px',
            backgroundColor: '#f9fafb',
            transition: 'border-color 0.2s, background-color 0.2s',
            outline: 'none'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#3b82f6';
            e.target.style.backgroundColor = '#ffffff';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#d1d5db';
            e.target.style.backgroundColor = '#f9fafb';
          }}
        >
          <option value="USD">USD - US Dollar</option>
          <option value="EUR">EUR - Euro</option>
          <option value="GBP">GBP - British Pound</option>
          <option value="CAD">CAD - Canadian Dollar</option>
          <option value="AUD">AUD - Australian Dollar</option>
        </select>
      </div>

      <div style={{ marginBottom: '28px' }}>
        <label style={{
          display: 'block',
          marginBottom: '8px',
          fontSize: '14px',
          fontWeight: '600',
          color: '#374151'
        }}>
          Description (Optional)
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is this payment for?"
          style={{
            width: '100%',
            padding: '12px 16px',
            border: '2px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '16px',
            backgroundColor: '#f9fafb',
            transition: 'border-color 0.2s, background-color 0.2s',
            outline: 'none'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#3b82f6';
            e.target.style.backgroundColor = '#ffffff';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#d1d5db';
            e.target.style.backgroundColor = '#f9fafb';
          }}
        />
      </div>

      {amount && parseFloat(amount) > 0 ? (
        <PayPalButton
          amount={amount}
          currency={currency}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
          onCancel={handlePaymentCancel}
          style={{
            layout: 'horizontal',
            color: 'gold',
            shape: 'rect',
            label: 'paypal'
          }}
        />
      ) : (
        <div style={{
          padding: '16px',
          backgroundColor: '#fef3c7',
          border: '1px solid #fbbf24',
          borderRadius: '8px',
          color: '#92400e',
          textAlign: 'center',
          fontSize: '14px'
        }}>
          Please enter a valid amount to proceed with payment
        </div>
      )}

      <div style={{
        marginTop: '24px',
        padding: '16px',
        backgroundColor: '#f3f4f6',
        borderRadius: '8px',
        fontSize: '12px',
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: '1.5'
      }}>
        <p style={{ margin: '0 0 8px' }}>
          🔒 Your payment is secured by PayPal's advanced encryption
        </p>
        <p style={{ margin: '0' }}>
          We never store your payment information on our servers
        </p>
      </div>
    </div>
  );
};

export default PaymentForm;