// components/TelemetryDashboard.tsx
import React, { useState, useEffect } from 'react';
import { useTelemetry } from '../../contexts/telemetry-context';
import { useComponentLifecycle, useInteractionTracking } from '../../hooks/use-telemetry-hooks';

interface TelemetryStats {
  totalEvents: number;
  pageViews: number;
  userActions: number;
  errors: number;
  performance: number;
  sessionDuration: number;
  topEvents: { name: string; count: number }[];
}

const TelemetryDashboard: React.FC = () => {
  const { track } = useTelemetry();
  const { trackClick } = useInteractionTracking('TelemetryDashboard');
  const [stats, setStats] = useState<TelemetryStats>({
    totalEvents: 0,
    pageViews: 0,
    userActions: 0,
    errors: 0,
    performance: 0,
    sessionDuration: 0,
    topEvents: [],
  });
  const [isVisible, setIsVisible] = useState(false);

  useComponentLifecycle('TelemetryDashboard');

  useEffect(() => {
    // Simulate fetching telemetry stats (in real app, this would come from your backend)
    const fetchStats = () => {
      const mockStats: TelemetryStats = {
        totalEvents: Math.floor(Math.random() * 1000) + 100,
        pageViews: Math.floor(Math.random() * 50) + 10,
        userActions: Math.floor(Math.random() * 200) + 50,
        errors: Math.floor(Math.random() * 5),
        performance: Math.floor(Math.random() * 20) + 5,
        sessionDuration: Math.floor(Math.random() * 300000) + 60000, // 1-5 minutes
        topEvents: [
          { name: 'page_view', count: 45 },
          { name: 'user_action', count: 32 },
          { name: 'button_click', count: 28 },
          { name: 'form_submit', count: 12 },
          { name: 'scroll_depth', count: 8 },
        ],
      };
      setStats(mockStats);
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
    trackClick('toggle_dashboard', { visible: !isVisible });
    track('dashboard_toggled', { visible: !isVisible });
  };

  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const StatCard: React.FC<{ title: string; value: string | number; icon: string; color: string }> = ({
    title,
    value,
    icon,
    color,
  }) => (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} bg-opacity-10`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={toggleVisibility}
        className="fixed bottom-4 right-4 z-50 bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 group"
        title="Toggle Telemetry Dashboard"
      >
        <svg 
          className={`w-6 h-6 transition-transform duration-200 ${isVisible ? 'rotate-45' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </button>

      {/* Dashboard Panel */}
      {isVisible && (
        <div className="fixed inset-0 z-40 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={toggleVisibility} />
          <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-gradient-to-br from-gray-50 to-blue-50 shadow-2xl overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Telemetry Dashboard</h2>
                  <p className="text-gray-600 mt-1">Real-time analytics and user behavior insights</p>
                </div>
                <button
                  onClick={toggleVisibility}
                  className="p-2 hover:bg-white hover:bg-opacity-50 rounded-xl transition-colors duration-200"
                >
                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <StatCard
                  title="Total Events"
                  value={stats.totalEvents}
                  icon="📊"
                  color="text-blue-500"
                />
                <StatCard
                  title="Page Views"
                  value={stats.pageViews}
                  icon="👁️"
                  color="text-green-500"
                />
                <StatCard
                  title="User Actions"
                  value={stats.userActions}
                  icon="🎯"
                  color="text-purple-500"
                />
                <StatCard
                  title="Errors"
                  value={stats.errors}
                  icon="⚠️"
                  color="text-red-500"
                />
              </div>

              {/* Additional Stats */}
              <div className="grid grid-cols-1 gap-4 mb-8">
                <StatCard
                  title="Session Duration"
                  value={formatDuration(stats.sessionDuration)}
                  icon="⏱️"
                  color="text-indigo-500"
                />
                <StatCard
                  title="Performance Events"
                  value={stats.performance}
                  icon="🚀"
                  color="text-orange-500"
                />
              </div>

              {/* Top Events */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="text-2xl mr-2">📈</span>
                  Top Events
                </h3>
                <div className="space-y-3">
                  {stats.topEvents.map((event, index) => (
                    <div key={event.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                          {index + 1}
                        </span>
                        <span className="font-medium text-gray-900">{event.name}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-gray-600 font-medium">{event.count}</span>
                        <div className="w-16 h-2 bg-gray-200 rounded-full ml-3 overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full transition-all duration-300"
                            style={{ width: `${(event.count / stats.topEvents[0].count) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Debug Actions */}
              <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="text-2xl mr-2">🔧</span>
                  Debug Actions
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      track('test_event', { type: 'manual_trigger', timestamp: Date.now() });
                      trackClick('test_event_button');
                    }}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                  >
                    Send Test Event
                  </button>
                  <button
                    onClick={() => {
                      track('user_feedback', { rating: 5, source: 'dashboard' });
                      trackClick('feedback_button');
                    }}
                    className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                  >
                    Send Feedback
                  </button>
                  <button
                    onClick={() => {
                      const testError = new Error('Test error from dashboard');
                      track('error', { 
                        message: testError.message, 
                        stack: testError.stack,
                        component: 'TelemetryDashboard',
                        isTest: true
                      });
                      trackClick('error_test_button');
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                  >
                    Test Error
                  </button>
                  <button
                    onClick={() => {
                      track('performance', { 
                        metric: 'test_metric', 
                        value: Math.random() * 1000,
                        component: 'TelemetryDashboard'
                      });
                      trackClick('performance_test_button');
                    }}
                    className="bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                  >
                    Test Performance
                  </button>
                </div>
              </div>

              {/* Info Section */}
              <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">ℹ️ About This Dashboard</h3>
                <p className="text-blue-700 text-sm leading-relaxed">
                  This dashboard shows real-time telemetry data from your application. 
                  Events are automatically tracked and batched for optimal performance. 
                  In production, this data would be sent to your analytics service.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TelemetryDashboard;
