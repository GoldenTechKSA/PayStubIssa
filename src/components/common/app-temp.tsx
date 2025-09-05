// App.tsx - Main application demonstrating telemetry usage
import React, { useState } from 'react';
import { TelemetryProvider } from '../../contexts/telemetry-context';
import { usePageTracking, useComponentLifecycle, useTimeTracking, useScrollTracking } from '../../hooks/use-telemetry-hooks';
import TelemetryErrorBoundary from './telemetry-error-boundary';
import TelemetryDashboard from './telemetry-dashboard';
import { TrackedButton, TrackedForm, TrackedInput } from './tracked-components';
import { TelemetryConfig } from '../../types/telemetry';

// Demo Page Components
const HomePage: React.FC = () => {
  useComponentLifecycle('HomePage');
  useTimeTracking('page_view_time', 'HomePage');
  useScrollTracking();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Telemetry Demo Application
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            This application demonstrates comprehensive user behavior tracking with React and TypeScript. 
            Every interaction you make is being tracked and analyzed in real-time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <FeatureCard
            icon="📊"
            title="Real-time Analytics"
            description="Track user interactions, page views, and custom events in real-time with automatic batching and error handling."
          />
          <FeatureCard
            icon="🎯"
            title="User Behavior Insights"
            description="Monitor how users navigate your app, which features they use most, and where they encounter issues."
          />
          <FeatureCard
            icon="⚡"
            title="Performance Monitoring"
            description="Automatically track Core Web Vitals, page load times, and custom performance metrics."
          />
          <FeatureCard
            icon="🔍"
            title="Error Tracking"
            description="Capture and analyze JavaScript errors, React component crashes, and unhandled promise rejections."
          />
          <FeatureCard
            icon="📱"
            title="Session Management"
            description="Track user sessions, time spent on pages, and user journey paths throughout your application."
          />
          <FeatureCard
            icon="🛡️"
            title="Privacy First"
            description="Built-in data anonymization, GDPR compliance features, and configurable privacy controls."
          />
        </div>
      </div>
    </div>
  );
};

const FeatureCard: React.FC<{ icon: string; title: string; description: string }> = ({ icon, title, description }) => {
  useComponentLifecycle('FeatureCard');

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
};

const DemoFormPage: React.FC = () => {
  useComponentLifecycle('DemoFormPage');
  useTimeTracking('form_page_time', 'DemoFormPage');

  const handleFormSubmit = async (data: Record<string, any>) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Form submitted:', data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Demo Form</h2>
            <p className="text-gray-600">
              This form demonstrates telemetry tracking for form interactions, field focus/blur events, 
              submission success/failure, and form abandonment detection.
            </p>
          </div>

          <TrackedForm
            formName="demo_contact_form"
            onSubmit={handleFormSubmit}
            className="mb-8"
          >
            <TrackedInput
              name="firstName"
              placeholder="Enter your first name"
              required
            />
            <TrackedInput
              name="lastName"
              placeholder="Enter your last name"
              required
            />
            <TrackedInput
              name="email"
              type="email"
              placeholder="Enter your email address"
              required
            />
            <TrackedInput
              name="message"
              placeholder="Enter your message"
            />
            
            <div className="flex gap-4 pt-4">
              <TrackedButton
                variant="primary"
                size="lg"
                trackingData={{ formName: 'demo_contact_form', action: 'submit' }}
              >
                Submit Form
              </TrackedButton>
              <TrackedButton
                variant="secondary"
                size="lg"
                trackingData={{ formName: 'demo_contact_form', action: 'reset' }}
                onClick={() => {
                  const form = document.querySelector('form') as HTMLFormElement;
                  form?.reset();
                }}
              >
                Reset
              </TrackedButton>
            </div>
          </TrackedForm>
        </div>
      </div>
    </div>
  );
};

const InteractionsPage: React.FC = () => {
  const [counter, setCounter] = useState(0);
  useComponentLifecycle('InteractionsPage');
  useTimeTracking('interactions_page_time', 'InteractionsPage');

  const triggerError = () => {
    throw new Error('This is a test error triggered by user interaction');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Interactive Elements</h2>
            <p className="text-gray-600">
              Try these interactive elements to see how telemetry tracks different types of user interactions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Counter Section */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Counter Demo</h3>
              <div className="text-center mb-6">
                <span className="text-6xl font-bold text-blue-500">{counter}</span>
              </div>
              <div className="flex gap-4 justify-center">
                <TrackedButton
                  variant="primary"
                  trackingData={{ action: 'increment', currentValue: counter }}
                  onClick={() => setCounter(c => c + 1)}
                >
                  Increment
                </TrackedButton>
                <TrackedButton
                  variant="secondary"
                  trackingData={{ action: 'decrement', currentValue: counter }}
                  onClick={() => setCounter(c => c - 1)}
                >
                  Decrement
                </TrackedButton>
                <TrackedButton
                  variant="danger"
                  trackingData={{ action: 'reset', previousValue: counter }}
                  onClick={() => setCounter(0)}
                >
                  Reset
                </TrackedButton>
              </div>
            </div>

            {/* Error Testing Section */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Error Testing</h3>
              <p className="text-gray-600 mb-6 text-center">
                Test error tracking and error boundary functionality.
              </p>
              <div className="space-y-4">
                <TrackedButton
                  variant="danger"
                  className="w-full"
                  trackingData={{ action: 'trigger_error', errorType: 'intentional' }}
                  onClick={triggerError}
                >
                  Trigger Error
                </TrackedButton>
                <TrackedButton
                  variant="secondary"
                  className="w-full"
                  trackingData={{ action: 'console_error' }}
                  onClick={() => console.error('Console error triggered by user')}
                >
                  Console Error
                </TrackedButton>
                <TrackedButton
                  variant="secondary"
                  className="w-full"
                  trackingData={{ action: 'promise_rejection' }}
                  onClick={() => Promise.reject('Unhandled promise rejection')}
                >
                  Promise Rejection
                </TrackedButton>
              </div>
            </div>
          </div>

          {/* Long Content for Scroll Tracking */}
          <div className="mt-12 bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Scroll Tracking Demo</h3>
            <p className="text-gray-600 mb-4">
              This section contains long content to demonstrate scroll depth tracking. 
              As you scroll through this content, telemetry will track your scroll progress.
            </p>
            {Array.from({ length: 20 }, (_, i) => (
              <div key={i} className="mb-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Content Block {i + 1}</h4>
                <p className="text-gray-600">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor 
                  incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud 
                  exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute 
                  irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Main App Component
const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'home' | 'form' | 'interactions'>('home');

  const telemetryConfig: TelemetryConfig = {
    endpoint: '/api/telemetry', // Replace with your actual endpoint
    batchSize: 5,
    flushInterval: 10000, // 10 seconds
    enableConsoleLogging: true, // Enable for development
    enablePerformanceTracking: true,
    enableErrorTracking: true,
    anonymizeData: false, // Set to true in production as needed
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'form':
        return <DemoFormPage />;
      case 'interactions':
        return <InteractionsPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <TelemetryProvider config={telemetryConfig}>
      <TelemetryErrorBoundary componentName="App">
        <div className="App">
          {/* Navigation */}
          <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-30">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center space-x-8">
                  <h1 className="text-xl font-bold text-gray-900">Telemetry Demo</h1>
                  <div className="flex space-x-4">
                    <TrackedButton
                      variant={currentPage === 'home' ? 'primary' : 'secondary'}
                      size="sm"
                      trackingData={{ page: 'home', navigation: true }}
                      onClick={() => setCurrentPage('home')}
                    >
                      Home
                    </TrackedButton>
                    <TrackedButton
                      variant={currentPage === 'form' ? 'primary' : 'secondary'}
                      size="sm"
                      trackingData={{ page: 'form', navigation: true }}
                      onClick={() => setCurrentPage('form')}
                    >
                      Form Demo
                    </TrackedButton>
                    <TrackedButton
                      variant={currentPage === 'interactions' ? 'primary' : 'secondary'}
                      size="sm"
                      trackingData={{ page: 'interactions', navigation: true }}
                      onClick={() => setCurrentPage('interactions')}
                    >
                      Interactions
                    </TrackedButton>
                  </div>
                </div>
              </div>
            </div>
          </nav>

          {/* Page Content */}
          {renderCurrentPage()}

          {/* Telemetry Dashboard */}
          <TelemetryDashboard />
        </div>
      </TelemetryErrorBoundary>
    </TelemetryProvider>
  );
};

export default App;