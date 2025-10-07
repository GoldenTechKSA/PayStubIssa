import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface PDFDownloadButtonProps {
  targetId: string;
  fileName?: string;
  buttonText?: string;
  marginInches?: number; // Margin in inches (default: 0.5)
}

const PDFDownloadButton: React.FC<PDFDownloadButtonProps> = ({
  targetId,
  fileName = 'document',
  buttonText = 'Download PDF',
  marginInches = 0.5
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownloadPDF = async () => {
    setIsLoading(true);
    
    try {
      // Get the target element
      const element = document.getElementById(targetId);
      if (!element) {
        console.error(`Element with id "${targetId}" not found`);
        return;
      }

      // Capture the element as canvas
      const canvas = await html2canvas(element, {
        useCORS: true,
        scale: 2, // Higher scale for better quality
        logging: false
      });

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'in', // Changed to inches for easier margin calculation
        format: 'a4'
      });

      // Convert margin from inches to the PDF's unit (inches)
      const margin = marginInches;
      
      // A4 dimensions in inches: 8.27 x 11.69
      const pageWidth = 8.27;
      const pageHeight = 11.69;
      
      // Calculate available width and height with margins
      const availableWidth = pageWidth - (2 * margin);
      const availableHeight = pageHeight - (2 * margin);
      
      // Calculate image dimensions to fit within available space
      const imgAspectRatio = canvas.width / canvas.height;
      let imgWidth = availableWidth;
      let imgHeight = imgWidth / imgAspectRatio;
      
      // If image is too tall for the page, scale by height instead
      if (imgHeight > availableHeight) {
        imgHeight = availableHeight;
        imgWidth = imgHeight * imgAspectRatio;
      }

      const imgData = canvas.toDataURL('image/png');
      let positionX = margin;
      let positionY = margin;
      let heightLeft = imgHeight;
      let currentPage = 1;

      // Add first page
      pdf.addImage(imgData, 'PNG', positionX, positionY, imgWidth, imgHeight);
      heightLeft -= availableHeight;

      // Add additional pages if content overflows
      while (heightLeft > 0) {
        pdf.addPage();
        currentPage++;
        positionY = margin - (currentPage - 1) * availableHeight;
        pdf.addImage(imgData, 'PNG', positionX, positionY, imgWidth, imgHeight);
        heightLeft -= availableHeight;
      }

      // Download the PDF
      pdf.save(`${fileName}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button 
      onClick={handleDownloadPDF}
      disabled={isLoading}
      style={{
        padding: '8px 16px',
        backgroundColor: isLoading ? '#ccc' : '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: isLoading ? 'not-allowed' : 'pointer'
      }}
    >
      {isLoading ? 'Generating...' : buttonText}
    </button>
  );
};

export default PDFDownloadButton;