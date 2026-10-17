// components/TelemetryErrorBoundary.tsx
import React, { Component, ReactNode, ErrorInfo } from 'react';
import { telemetry } from '../../services/telemetry-service';
import { T } from '../../telemetry/codes';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class TelemetryErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    telemetry.emit(T.ERROR_BOUNDARY, { component: this.props.componentName || 'ErrorBoundary', message: error.message });

    this.setState({
      error,
      errorInfo,
    });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-red-100 p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Oops! Something went wrong
            </h2>
            
            <p className="text-gray-600 mb-6">
              We've encountered an unexpected error. Our team has been notified and we're working to fix this issue.
            </p>
            
            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 shadow-lg hover:shadow-xl"
              >
                Try Again
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-xl transition-colors duration-200"
              >
                Reload Page
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm font-medium text-gray-500 hover:text-gray-700">
                  Error Details (Development Only)
                </summary>
                <div className="mt-3 p-4 bg-gray-50 rounded-lg text-xs text-gray-600 overflow-auto">
                  <pre className="whitespace-pre-wrap">
                    {this.state.error.message}
                    {'\n\n'}
                    {this.state.error.stack}
                    {this.state.errorInfo?.componentStack && (
                      <>
                        {'\n\nComponent Stack:'}
                        {this.state.errorInfo.componentStack}
                      </>
                    )}
                  </pre>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default TelemetryErrorBoundary;