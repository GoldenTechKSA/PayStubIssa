import React, { useState } from 'react';

interface PaymentRecord {
  id: string;
  amount: string;
  currency: string;
  timestamp: Date;
  status: string;
}

interface PaymentHistoryProps {
  payments: PaymentRecord[];
}

const PaymentHistory: React.FC<PaymentHistoryProps> = ({ payments }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatAmount = (amount: string, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(parseFloat(amount));
  };

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return {
          backgroundColor: '#dcfce7',
          color: '#166534',
          borderColor: '#bbf7d0'
        };
      case 'pending':
        return {
          backgroundColor: '#fef3c7',
          color: '#92400e',
          borderColor: '#fde68a'
        };
      case 'failed':
        return {
          backgroundColor: '#fee2e2',
          color: '#dc2626',
          borderColor: '#fecaca'
        };
      default:
        return {
          backgroundColor: '#f3f4f6',
          color: '#374151',
          borderColor: '#d1d5db'
        };
    }
  };

  const copyToClipboard = async (transactionId: string) => {
    try {
      await navigator.clipboard.writeText(transactionId);
      setCopiedId(transactionId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy transaction ID:', error);
    }
  };

  const calculateTotals = () => {
    const completedPayments = payments.filter(p => p.status.toLowerCase() === 'completed');
    const totalsByCurrency = completedPayments.reduce((acc, payment) => {
      const currency = payment.currency;
      const amount = parseFloat(payment.amount);
      acc[currency] = (acc[currency] || 0) + amount;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalTransactions: payments.length,
      completedTransactions: completedPayments.length,
      successRate: payments.length > 0 ? (completedPayments.length / payments.length) * 100 : 0,
      totalsByCurrency: totalsByCurrency
    };
  };

  // Empty state
  if (payments.length === 0) {
    return (
      <div style={{
        maxWidth: '700px',
        width: '100%',
        padding: '48px 32px',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb',
        textAlign: 'center'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          backgroundColor: '#f3f4f6',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          fontSize: '24px'
        }}>
          📄
        </div>
        <h3 style={{
          margin: '0 0 12px',
          fontSize: '20px',
          fontWeight: 'bold',
          color: '#1f2937'
        }}>
          No Payment History
        </h3>
        <p style={{
          margin: '0',
          fontSize: '16px',
          color: '#6b7280'
        }}>
          Your payment transactions will appear here once you complete your first payment.
        </p>
      </div>
    );
  }

  const totals = calculateTotals();

  return (
    <div style={{
      maxWidth: '700px',
      width: '100%',
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e5e7eb',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '24px 32px',
        backgroundColor: '#f9fafb',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <h2 style={{
          margin: '0 0 8px',
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#1f2937'
        }}>
          Payment History
        </h2>
        <p style={{
          margin: '0',
          fontSize: '14px',
          color: '#6b7280'
        }}>
          {totals.totalTransactions} {totals.totalTransactions === 1 ? 'transaction' : 'transactions'} total
        </p>
      </div>

      {/* Transactions List */}
      <div>
        {payments.map((payment, index) => {
          const statusStyle = getStatusStyle(payment.status);
          const isCopied = copiedId === payment.id;

          return (
            <div
              key={payment.id}
              style={{
                padding: '20px 32px',
                borderBottom: index < payments.length - 1 ? '1px solid #f3f4f6' : 'none',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f9fafb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '16px',
                flexWrap: 'wrap'
              }}>
                {/* Left side - Payment details */}
                <div style={{ flex: '1', minWidth: '280px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '8px',
                    flexWrap: 'wrap'
                  }}>
                    <span style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: '#1f2937'
                    }}>
                      {formatAmount(payment.amount, payment.currency)}
                    </span>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '600',
                      padding: '3px 8px',
                      borderRadius: '12px',
                      backgroundColor: statusStyle.backgroundColor,
                      color: statusStyle.color,
                      border: `1px solid ${statusStyle.borderColor}`,
                      textTransform: 'uppercase'
                    }}>
                      {payment.status}
                    </span>
                  </div>
                  
                  <div style={{
                    fontSize: '13px',
                    color: '#6b7280',
                    marginBottom: '4px',
                    fontFamily: 'monospace'
                  }}>
                    {payment.id.length > 25 ? 
                      `${payment.id.substring(0, 25)}...` : 
                      payment.id
                    }
                  </div>
                  
                  <div style={{
                    fontSize: '14px',
                    color: '#9ca3af'
                  }}>
                    {formatDate(payment.timestamp)}
                  </div>
                </div>

                {/* Right side - Actions */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <button
                    onClick={() => copyToClipboard(payment.id)}
                    style={{
                      padding: '8px 12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: isCopied ? '#dcfce7' : '#f3f4f6',
                      color: isCopied ? '#166534' : '#374151',
                      border: `1px solid ${isCopied ? '#bbf7d0' : '#d1d5db'}`,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    onMouseEnter={(e) => {
                      if (!isCopied) {
                        e.currentTarget.style.backgroundColor = '#e5e7eb';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isCopied) {
                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                      }
                    }}
                  >
                    {isCopied ? '✓' : '📋'}
                    {isCopied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Footer */}
      <div style={{
        padding: '24px 32px',
        backgroundColor: '#f9fafb',
        borderTop: '1px solid #e5e7eb'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '20px',
          textAlign: 'center'
        }}>
          <div>
            <div style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '4px'
            }}>
              {totals.totalTransactions}
            </div>
            <div style={{
              fontSize: '12px',
              color: '#6b7280',
              textTransform: 'uppercase',
              fontWeight: '600'
            }}>
              Total Transactions
            </div>
          </div>

          <div>
            <div style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#10b981',
              marginBottom: '4px'
            }}>
              {Math.round(totals.successRate)}%
            </div>
            <div style={{
              fontSize: '12px',
              color: '#6b7280',
              textTransform: 'uppercase',
              fontWeight: '600'
            }}>
              Success Rate
            </div>
          </div>

          <div>
            <div style={{
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '4px'
            }}>
              {Object.entries(totals.totalsByCurrency).map(([currency, total]) => formatAmount(total.toFixed(2), currency)).join(', ') || '$0.00'}
            </div>
            <div style={{
              fontSize: '12px',
              color: '#6b7280',
              textTransform: 'uppercase',
              fontWeight: '600'
            }}>
              Total Amount
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentHistory;