import React from 'react';
import { FileText, Image } from 'lucide-react';

export interface PDFOptions {
  filename: string;
  format: 'A4' | 'Letter';
  orientation: 'portrait' | 'landscape';
  includeImages: boolean;
}

interface PDFOptionsProps {
  options: PDFOptions;
  onOptionsChange: (options: PDFOptions) => void;
}

const PDFOptions: React.FC<PDFOptionsProps> = ({ options, onOptionsChange }) => {
  const updateOption = <K extends keyof PDFOptions>(key: K, value: PDFOptions[K]) => {
    onOptionsChange({ ...options, [key]: value });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6 animate-slide-up">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <FileText size={20} className="text-blue-600" />
        PDF Options
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filename
          </label>
          <input
            type="text"
            value={options.filename}
            onChange={(e) => updateOption('filename', e.target.value)}
            className="input"
            placeholder="Enter filename..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Format
          </label>
          <select
            value={options.format}
            onChange={(e) => updateOption('format', e.target.value as 'A4' | 'Letter')}
            className="select"
          >
            <option value="A4">A4</option>
            <option value="Letter">Letter</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Orientation
          </label>
          <select
            value={options.orientation}
            onChange={(e) => updateOption('orientation', e.target.value as 'portrait' | 'landscape')}
            className="select"
          >
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
          </select>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="includeImages"
            checked={options.includeImages}
            onChange={(e) => updateOption('includeImages', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="includeImages" className="ml-2 block text-sm text-gray-700 flex items-center gap-1">
            <Image size={16} className="text-blue-600" />
            Include Images
          </label>
        </div>
      </div>
    </div>
  );
};

export default PDFOptions;