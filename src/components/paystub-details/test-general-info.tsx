// You can also choose to navigate to a new route instead of toggling state—just replace the useState logic with useNavigate() and render PaystubGallery on a dedicated /paystubs page.

// Let me know if you'd like the routing-based version!

// In your main page/component
import React, { useState } from 'react';
import GeneralInfoCard from './general-info-card';
import PaystubGallery from './paystub-gallery';

const PayrollPage: React.FC = () => {
  const [showPaystubGallery, setShowPaystubGallery] = useState(false);

  // Mock state – replace with your actual state
  const state = {
    generalInfo: {
      employmentType: "Full-time",
      paymentMethod: "Direct Deposit",
      paymentFrequency: "Biweekly",
      payStubCount: 3,
      payStubNumber: 1001,
      checkNumber: 5001,
      extraNotes: "Urgent processing required"
    }
  };

  const handleViewPaystubs = () => {
    setShowPaystubGallery(true);
    // Or navigate to a new route: navigate('/paystubs');
  };

  const handlePaystubSelect = (stubNumber: number) => {
    console.log('Selected paystub:', stubNumber);
    // Open modal, navigate, etc.
  };

  const getPaystubImageUrl = (stubNumber: number): string | null => {
    // Return actual URL or null
    return `/api/paystubs/${stubNumber}/preview.png`;
  };

  if (showPaystubGallery) {
    return (
      <div className="container py-4">
        <PaystubGallery
          payStubCount={state.generalInfo.payStubCount}
          basePayStubNumber={state.generalInfo.payStubNumber}
          baseCheckNumber={state.generalInfo.checkNumber}
          paymentFrequency={state.generalInfo.paymentFrequency}
        //   periodStartDate={state.incomeDetails?.periodStartDate} // from your income state
        //   periodPayDate={state.incomeDetails?.periodPayDate}
          onPaystubSelect={handlePaystubSelect}
          getPaystubImageUrl={getPaystubImageUrl}
        />
        <div className="mt-4 text-center">
          <button 
            className="btn btn-secondary" 
            onClick={() => setShowPaystubGallery(false)}
          >
            Back to General Info
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <GeneralInfoCard
        generalInfo={state.generalInfo}
        onGeneralInfoClick={(e) => {
          e.preventDefault();
          // handle click
        }}
        onViewPaystubs={handleViewPaystubs}
      />
      
      {/* Other sections (Company, Employee, Income) can go here */}
    </div>
  );
};

export default PayrollPage;