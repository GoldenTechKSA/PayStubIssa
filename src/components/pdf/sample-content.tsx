import React from 'react';

const SampleContent: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-md p-8 animate-fade-in">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 text-balance">Sample Document</h1>
      
      <div className="prose max-w-none">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Introduction</h2>
        <p className="text-gray-600 mb-4 leading-relaxed">
          This is a sample document that demonstrates the PDF download functionality. 
          The content includes various elements like headings, paragraphs, lists, and images 
          that will be converted to PDF format when you click the download button.
        </p>

        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Features</h2>
        <ul className="list-disc list-inside text-gray-600 mb-4 space-y-2">
          <li>High-quality PDF generation from HTML content</li>
          <li>Customizable PDF options (format, orientation, filename)</li>
          <li>Support for images and complex layouts</li>
          <li>Multi-page support for long content</li>
          <li>Modern and responsive design</li>
          <li>TypeScript support for better development experience</li>
          <li>Production-ready with proper error handling</li>
        </ul>

        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Technical Details</h2>
        <p className="text-gray-600 mb-4 leading-relaxed">
          This implementation uses modern React hooks and TypeScript for type safety. 
          The PDF generation is powered by html2canvas for capturing the DOM elements 
          and jsPDF for creating the final PDF document.
        </p>

        <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-2">Code Example:</h3>
          <pre className="text-sm text-gray-600 overflow-x-auto">
            <code>{`const { generatePDF, isGenerating } = usePDFDownload();

// Generate PDF from element
await generatePDF(elementRef.current, {
  filename: 'document.pdf',
  format: 'A4',
  orientation: 'portrait',
  includeImages: true
});`}</code>
          </pre>
        </div>

        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Benefits</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">Easy Integration</h4>
            <p className="text-blue-700 text-sm">
              Simple API that can be integrated into any React application with minimal setup.
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <h4 className="font-semibold text-green-800 mb-2">High Quality Output</h4>
            <p className="text-green-700 text-sm">
              Generates high-resolution PDFs with proper scaling and formatting.
            </p>
          </div>
        </div>

        <p className="text-gray-600 leading-relaxed mb-6">
          The solution is designed to be production-ready and can be easily integrated 
          into any React application. It provides a clean API and handles error states 
          gracefully. The component architecture allows for easy customization and extension.
        </p>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-800 mb-2">📝 Note</h4>
          <p className="text-yellow-700 text-sm">
            This content will be rendered exactly as you see it in the generated PDF, 
            maintaining all styling and layout information.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SampleContent;