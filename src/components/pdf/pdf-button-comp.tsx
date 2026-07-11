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
      const element = document.getElementById(targetId);
      if (!element) {
        console.error(`Element with id "${targetId}" not found`);
        return;
      }

      // The customer pays per stub and may buy up to 12, so the target holds one
      // `.paystub-page` per stub. Each becomes its own PDF page. If the markup has no pages
      // (older templates, or a single un-wrapped stub), fall back to the target itself.
      const pageNodes = Array.from(element.querySelectorAll<HTMLElement>('.paystub-page'));
      const pages: HTMLElement[] = pageNodes.length > 0 ? pageNodes : [element];

      // US Letter, matching the on-screen sheet and print.css. (This was A4, which silently
      // cropped/letterboxed the paid PDF relative to the preview the customer approved.)
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'in', format: 'letter' });

      const margin = marginInches;
      const pageWidth = 8.5;
      const pageHeight = 11;
      const availableWidth = pageWidth - 2 * margin;
      const availableHeight = pageHeight - 2 * margin;

      for (let i = 0; i < pages.length; i++) {
        const canvas = await html2canvas(pages[i], {
          useCORS: true,
          scale: 2, // Higher scale for better quality
          logging: false,
        });

        // Scale each stub to fit inside one page's margins, preserving aspect ratio.
        const aspectRatio = canvas.width / canvas.height;
        let imgWidth = availableWidth;
        let imgHeight = imgWidth / aspectRatio;
        if (imgHeight > availableHeight) {
          imgHeight = availableHeight;
          imgWidth = imgHeight * aspectRatio;
        }

        if (i > 0) pdf.addPage();
        // Center horizontally so a narrow stub doesn't hug the left margin.
        const offsetX = margin + (availableWidth - imgWidth) / 2;
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', offsetX, margin, imgWidth, imgHeight);
      }

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