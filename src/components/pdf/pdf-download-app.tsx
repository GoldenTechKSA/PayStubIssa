import React, { useState, useRef } from 'react';
import PDFOptions, { type PDFOptions as PDFOptionsType } from './pdf-options';
import SampleContent from './sample-content';
import ErrorDisplay from './error-display';
import DownloadButton from './download-button';
import { usePDFDownload } from '../../hooks/use-pdf-download';

const PDFDownloadApp: React.FC = () => {
  const contentRef = useRef<HTMLDivElement>(null);
  const { generatePDF, isGenerating, error, clearError } = usePDFDownload();
  
  const [options, setOptions] = useState<PDFOptionsType>({
    filename: 'sample-document',
    format: 'A4',
    orientation: 'portrait',
    includeImages: true
  });

  const handleDownloadPDF = async () => {
    if (!contentRef.current) {
      return;
    }

    clearError();
    await generatePDF(contentRef.current, options);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header Section */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 text-balance">
            PDF Download Demo
          </h1>
          <p className="text-gray-600 text-lg">
            Convert HTML content to PDF with customizable options
          </p>
          <div className="mt-4 flex justify-center">
            <div className="bg-white rounded-full px-4 py-2 shadow-sm border border-gray-200">
              <span className="text-sm text-gray-500">
                Built with React + TypeScript + Tailwind
              </span>
            </div>
          </div>
        </div>

        {/* PDF Options Configuration */}
        <PDFOptions 
          options={options} 
          onOptionsChange={setOptions} 
        />

        {/* Download Button */}
        <div className="mb-6">
          <DownloadButton
            onClick={handleDownloadPDF}
            isLoading={isGenerating}
            disabled={!options.filename.trim()}
          />
        </div>

        {/* Error Display */}
        <ErrorDisplay 
          error={error} 
          onDismiss={clearError} 
        />

        {/* Content to be converted to PDF */}
        <div ref={contentRef} className="pdf-content">
          <SampleContent />
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500 animate-fade-in">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
            <p>Built with React, TypeScript, html2canvas, and jsPDF</p>
            <span className="hidden sm:inline">•</span>
            <p>Ready for production deployment</p>
          </div>
        </div>
      </div>

      {/* Custom styles for better PDF rendering */}
      <style>{`
        .pdf-content {
          background: white;
          padding: 0;
        }
        
        @media print {
          .pdf-content {
            box-shadow: none;
            border-radius: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default PDFDownloadApp;