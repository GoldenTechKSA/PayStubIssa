import { useState } from 'react';
import type { PDFOptions } from '../components/pdf/pdf-options';

interface UsePDFDownloadReturn {
  generatePDF: (element: HTMLElement, options: PDFOptions) => Promise<void>;
  isGenerating: boolean;
  error: string | null;
  clearError: () => void;
}

export const usePDFDownload = (): UsePDFDownloadReturn => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const generatePDF = async (element: HTMLElement, options: PDFOptions): Promise<void> => {
    setIsGenerating(true);
    setError(null);

    try {
      // Dynamic imports for better code splitting
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf')
      ]);

      // Configure html2canvas options for better quality
      const canvas = await html2canvas(element, {
        scale: 2, // Higher quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        removeContainer: true,
        imageTimeout: 10000,
        logging: false,
        onclone: (clonedDoc) => {
          // Ensure fonts are loaded in the cloned document
          const style = clonedDoc.createElement('style');
          style.textContent = `
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
            * { font-family: 'Inter', system-ui, sans-serif; }
          `;
          clonedDoc.head.appendChild(style);
        }
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      
      // Calculate PDF dimensions based on format and orientation
      const formats = {
        A4: { width: 210, height: 297 },
        Letter: { width: 216, height: 279 }
      };
      
      const format = formats[options.format];
      const pageWidth = options.orientation === 'portrait' ? format.width : format.height;
      const pageHeight = options.orientation === 'portrait' ? format.height : format.width;
      
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * pageWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      // Create PDF with specified options
      const pdf = new jsPDF({
        orientation: options.orientation,
        unit: 'mm',
        format: options.format.toLowerCase() as 'a4' | 'letter'
      });

      // Add metadata
      pdf.setProperties({
        title: options.filename,
        creator: 'PDF Download App',
        author: 'React PDF Generator'
      });

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      // Add additional pages if content exceeds one page
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }

      // Save the PDF with proper filename
      const filename = options.filename.endsWith('.pdf') 
        ? options.filename 
        : `${options.filename}.pdf`;
      
      pdf.save(filename);
      
    } catch (err) {
      console.error('PDF generation error:', err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to generate PDF. Please try again.';
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  return { 
    generatePDF, 
    isGenerating, 
    error, 
    clearError 
  };
};