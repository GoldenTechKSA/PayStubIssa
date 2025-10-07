// src/components/PaystubGallery.tsx
import React from 'react';

// Define props interface
interface PaystubGalleryProps {
  payStubCount: number;
  basePayStubNumber: number;
  baseCheckNumber?: number;
  paymentFrequency?: string;
  periodStartDate?: string;
  periodEndDate?: string;
  periodPayDate?: string;
  onPaystubSelect: (stubNumber: number) => void;
  getPaystubImageUrl: (stubNumber: number) => string | null;
}

// Helper functions (you can also move these to a utils file)
const getDaysPerPeriod = (frequency: string | undefined): number => {
  switch (frequency?.toLowerCase()) {
    case 'weekly': return 7;
    case 'biweekly': return 14;
    case 'semimonthly': return 15;
    case 'monthly': return 30;
    default: return 14;
  }
};

const calculateDate = (baseDateStr: string | undefined, daysOffset: number): Date => {
  const base = baseDateStr ? new Date(baseDateStr) : new Date();
  const result = new Date(base);
  result.setDate(base.getDate() + daysOffset);
  return result;
};

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const PaystubGallery: React.FC<PaystubGalleryProps> = ({
  payStubCount,
  basePayStubNumber,
  baseCheckNumber,
  paymentFrequency,
  periodStartDate,
  periodPayDate,
  onPaystubSelect,
  getPaystubImageUrl
}) => {
  const periodDays = getDaysPerPeriod(paymentFrequency);

  return (
    <div className="paystub-gallery mt-4">
      <h5 className="mb-3 fw-semibold">Your Paystubs</h5>
      <p className="text-muted mb-3">Select a paystub to view or manage:</p>
      
      <div className="d-flex flex-column flex-md-row flex-wrap gap-4">
        {Array.from({ length: payStubCount }, (_, i) => {
          const stubNumber = basePayStubNumber + i;
          const checkNumber = baseCheckNumber ? baseCheckNumber + i : undefined;
          
          // Calculate dates
          const periodStart = calculateDate(periodStartDate, i * periodDays);
          const periodEnd = calculateDate(periodStartDate, (i + 1) * periodDays - 1);
          const payDate = calculateDate(periodPayDate, i * periodDays);
          
          const imageUrl = getPaystubImageUrl(stubNumber);

          return (
            <div 
              key={stubNumber}
              className="border rounded-3 shadow-sm bg-white overflow-hidden"
              style={{ 
                width: '100%', 
                maxWidth: '320px',
                cursor: 'pointer',
                transition: 'box-shadow 0.2s'
              }}
              onClick={() => onPaystubSelect(stubNumber)}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)'}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = ''}
            >
              {/* Image Preview */}
              <div className="bg-light d-flex align-items-center justify-content-center p-3" style={{ height: '160px' }}>
                {imageUrl ? (
                  <img 
                    src={imageUrl} 
                    alt={`Paystub #${stubNumber}`} 
                    className="img-fluid"
                    style={{ 
                      maxHeight: '100%', 
                      maxWidth: '100%',
                      objectFit: 'contain'
                    }}
                  />
                ) : (
                  <div className="text-center text-muted">
                    <svg width="48" height="48" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"/>
                      <path d="M5 4a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1H5zm0 2a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1H5zm0 2a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1H5z"/>
                    </svg>
                    <div className="mt-2">Paystub #{stubNumber}</div>
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="p-3">
                <h6 className="mb-2 fw-semibold">Paystub #{stubNumber}</h6>
                <div className="small text-muted">
                  <div>Period: {formatDate(periodStart)} – {formatDate(periodEnd)}</div>
                  <div>Pay Date: {formatDate(payDate)}</div>
                  {checkNumber !== undefined && (
                    <div>Check #: {checkNumber}</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PaystubGallery;