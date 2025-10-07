// src/components/GeneralInfoCard.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom'; // or use your routing method

interface GeneralInfo {
  employmentType?: string;
  paymentMethod?: string;
  paymentFrequency?: string;
  payStubCount: number;
  payStubNumber: number;
  checkNumber?: number;
  extraNotes?: string;
}

interface GeneralInfoCardProps {
  generalInfo: GeneralInfo;
  onGeneralInfoClick: (e: React.MouseEvent) => void;
  onViewPaystubs?: () => void; // Optional callback to handle navigation
}

const GeneralInfoCard: React.FC<GeneralInfoCardProps> = ({
  generalInfo,
  onGeneralInfoClick,
  onViewPaystubs
}) => {
  return (
    <div className="border rounded-3 shadow-sm bg-white p-4">
      <a 
        className="company-info-link d-inline-block fs-5 fw-semibold text-decoration-none mb-3"
        tabIndex={0} 
        onClick={onGeneralInfoClick}
        href="/general-info"
        style={{ color: '#2563eb' }}
      >
        General Information
      </a>

      <table className="general-info-table w-100">
        <tbody>
          <tr>
            {generalInfo.employmentType && (
              <td className="py-2">
                <strong className="d-block text-muted fw-normal mb-1">Employment Type</strong>
                {generalInfo.employmentType}
              </td>
            )}
            {generalInfo.paymentMethod && (
              <td className="py-2">
                <strong className="d-block text-muted fw-normal mb-1">Payment Method</strong>
                {generalInfo.paymentMethod}
              </td>
            )}
          </tr>
          <tr>
            {generalInfo.paymentFrequency && (
              <td className="py-2">
                <strong className="d-block text-muted fw-normal mb-1">How often you get paid?</strong>
                {generalInfo.paymentFrequency}
              </td>
            )}
            {generalInfo.payStubCount > 0 && (
              <td className="py-2">
                <strong className="d-block text-muted fw-normal mb-1">Number of paystubs requested</strong>
                {generalInfo.payStubCount}
              </td>
            )}
          </tr>
          <tr>
            {generalInfo.payStubNumber > 0 && (
              <td className="py-2">
                <strong className="d-block text-muted fw-normal mb-1">Paystub number or id</strong>
                {generalInfo.payStubNumber}
              </td>
            )}
            {generalInfo.checkNumber !== undefined && generalInfo.checkNumber > 0 && (
              <td className="py-2">
                <strong className="d-block text-muted fw-normal mb-1">Starting check number</strong>
                {generalInfo.checkNumber}
              </td>
            )}
          </tr>
          {generalInfo.extraNotes && (
            <tr>
              <td colSpan={2} className="py-2">
                <strong className="d-block text-muted fw-normal mb-1">Additional notes or reference</strong>
                {generalInfo.extraNotes}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Button to view paystubs (only if count > 1) */}
      {generalInfo.payStubCount > 1 && (
        <div className="mt-4 text-center">
          <button
            type="button"
            className="btn btn-outline-primary px-4"
            onClick={onViewPaystubs}
          >
            View {generalInfo.payStubCount} Paystubs
          </button>
        </div>
      )}
    </div>
  );
};

export default GeneralInfoCard;