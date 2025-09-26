import React from 'react';
import { Download, Loader2 } from 'lucide-react';

interface DownloadButtonProps {
  onClick: () => void;
  isLoading: boolean;
  disabled?: boolean;
  className?: string;
}

const DownloadButton: React.FC<DownloadButtonProps> = ({ 
  onClick, 
  isLoading, 
  disabled = false,
  className = '' 
}) => {
  return (
    <button
      onClick={onClick}
      disabled={isLoading || disabled}
      className={`
        w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 
        text-white font-semibold py-3 px-6 rounded-lg shadow-md 
        transition-all duration-200 flex items-center justify-center gap-2
        hover:shadow-lg hover:scale-105 disabled:hover:scale-100 disabled:hover:shadow-md
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${className}
      `}
    >
      {isLoading ? (
        <>
          <Loader2 size={20} className="animate-spin" />
          <span>Generating PDF...</span>
        </>
      ) : (
        <>
          <Download size={20} />
          <span>Download as PDF</span>
        </>
      )}
    </button>
  );
};

export default DownloadButton;