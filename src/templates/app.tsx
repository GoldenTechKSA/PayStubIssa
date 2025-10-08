/**
 * Main Application Component
 * Entry point for the Dynamic Paystub Template System
 */

import React, { useState } from 'react';
import TemplateManager from './components/templatemanager';

function App() {
  const [showWelcome, setShowWelcome] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Dynamic Paystub Template System
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                JSON-driven template rendering with zero hardcoded layouts
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                Production Ready
              </span>
              <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                v1.0.0
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Welcome Banner */}
      {showWelcome && (
        <div className="max-w-7xl mx-auto px-4 pt-6">
          <div className="bg-blue-50 border-blue-200 relative">
            <button
              onClick={() => setShowWelcome(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              aria-label="Close"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            <div>
              <div className="pr-6">
                <strong className="text-blue-900">🎉 Welcome to the Demo!</strong>
                <p className="mt-2 text-blue-800">
                  This system demonstrates how to build paystub templates dynamically from JSON configurations.
                  Select a template below to see it rendered in real-time. Each template is completely defined
                  by its JSON configuration - no hardcoded layouts!
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-sm">
                  <span className="bg-white px-2 py-1 rounded text-blue-900">✓ 4 Working Templates</span>
                  <span className="bg-white px-2 py-1 rounded text-blue-900">✓ Auto Calculations</span>
                  <span className="bg-white px-2 py-1 rounded text-blue-900">✓ Multiple Layouts</span>
                  <span className="bg-white px-2 py-1 rounded text-blue-900">✓ Export Config</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="py-8">
        <TemplateManager
          initialTemplateId="classic_blue"
          allowEditing={false}
          onDataChange={(data) => {
            console.log('Paystub data updated:', data);
          }}
        />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Features</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• JSON-driven templates</li>
                <li>• Dynamic field calculations</li>
                <li>• Multiple layout types</li>
                <li>• Real-time updates</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Components</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Template Registry</li>
                <li>• Calculation Engine</li>
                <li>• Field Formatter</li>
                <li>• Template Renderer</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Documentation</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• README.md</li>
                <li>• Implementation Guide</li>
                <li>• API Reference</li>
                <li>• System Summary</li>
              </ul>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t text-center text-sm text-gray-500">
            <p>Dynamic Paystub Template System • Built with React + TypeScript + Tailwind CSS</p>
            <p className="mt-1">MIT License • Production Ready</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;