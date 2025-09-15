import React, { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    paypal: any;
  }
}

interface PayPalButtonProps {
  amount: string;
  currency?: string;
  onSuccess?: (details: any) => void;
  onError?: (error: any) => void;
  onCancel?: () => void;
  style?: {
    layout?: 'vertical' | 'horizontal';
    color?: 'gold' | 'blue' | 'silver' | 'white' | 'black';
    shape?: 'rect' | 'pill';
    label?: 'paypal' | 'checkout' | 'buynow' | 'pay';
  };
}

const PayPalButton: React.FC<PayPalButtonProps> = ({
  amount,
  currency = 'USD',
  onSuccess,
  onError,
  onCancel,
  style = {
    layout: 'vertical',
    color: 'gold',
    shape: 'rect',
    label: 'paypal'
  }
}) => {
  const paypalRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if PayPal SDK is already loaded
    if (window.paypal) {
      renderPayPalButton();
      return;
    }

    // Load PayPal SDK
    const script = document.createElement('script');
    script.src = 'https://www.paypal.com/sdk/js?client-id=YOUR_PAYPAL_CLIENT_ID&currency=' + currency;
    script.async = true;
    script.onload = () => {
      renderPayPalButton();
    };
    script.onerror = () => {
      setError('Failed to load PayPal SDK');
      setIsLoading(false);
    };

    document.body.appendChild(script);

    return () => {
      // Cleanup: remove script if component unmounts
      const existingScript = document.querySelector('script[src*="paypal.com/sdk/js"]');
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, [amount, currency]);

  const renderPayPalButton = () => {
    if (!paypalRef.current || !window.paypal) return;

    // Clear previous button
    paypalRef.current.innerHTML = '';

    window.paypal.Buttons({
      style: {
        layout: style.layout,
        color: style.color,
        shape: style.shape,
        label: style.label,
      },
      createOrder: (data: any, actions: any) => {
        return actions.order.create({
          purchase_units: [{
            amount: {
              value: amount,
              currency_code: currency
            }
          }]
        });
      },
      onApprove: async (data: any, actions: any) => {
        try {
          const details = await actions.order.capture();
          if (onSuccess) {
            onSuccess(details);
          }
        } catch (error) {
          if (onError) {
            onError(error);
          }
        }
      },
      onError: (err: any) => {
        if (onError) {
          onError(err);
        }
      },
      onCancel: () => {
        if (onCancel) {
          onCancel();
        }
      }
    }).render(paypalRef.current).then(() => {
      setIsLoading(false);
    }).catch((error: any) => {
      setError('Failed to render PayPal button');
      setIsLoading(false);
    });
  };

  if (error) {
    return (
      <div style={{
        padding: '16px',
        backgroundColor: '#fee2e2',
        border: '1px solid #fecaca',
        borderRadius: '8px',
        color: '#dc2626',
        textAlign: 'center'
      }}>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div style={{
      position: 'relative',
      minHeight: '50px'
    }}>
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{
            width: '24px',
            height: '24px',
            border: '3px solid #e5e7eb',
            borderTop: '3px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <span style={{
            marginLeft: '12px',
            color: '#6b7280',
            fontSize: '14px'
          }}>Loading PayPal...</span>
        </div>
      )}
      <div ref={paypalRef}></div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default PayPalButton;