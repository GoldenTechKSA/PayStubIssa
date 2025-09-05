// contexts/TelemetryContext.tsx
import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { telemetryService } from '../services/telemetry-service';
import { TelemetryConfig } from '../types/telemetry';

interface TelemetryContextType {
  track: (eventName: string, properties?: Record<string, any>) => void;
  trackPageView: (path: string, title?: string, referrer?: string) => void;
  trackUserAction: (action: string, component: string, value?: any, metadata?: Record<string, any>) => void;
  trackError: (error: Error, component?: string, errorBoundary?: boolean) => void;
  setUserId: (userId: string) => void;
}

const TelemetryContext = createContext<TelemetryContextType | null>(null);

interface TelemetryProviderProps {
  children: ReactNode;
  config?: TelemetryConfig;
}

export const TelemetryProvider: React.FC<TelemetryProviderProps> = ({ children, config }) => {
  useEffect(() => {
    if (config) {
      // Reinitialize service with new config if needed
      Object.assign((telemetryService as any).config, config);
    }

    // Track initial page view
    telemetryService.trackPageView(window.location.pathname, document.title, document.referrer);

    return () => {
      telemetryService.destroy();
    };
  }, [config]);

  const contextValue: TelemetryContextType = {
    track: telemetryService.track.bind(telemetryService),
    trackPageView: telemetryService.trackPageView.bind(telemetryService),
    trackUserAction: telemetryService.trackUserAction.bind(telemetryService),
    trackError: telemetryService.trackError.bind(telemetryService),
    setUserId: telemetryService.setUserId.bind(telemetryService),
  };

  return (
    <TelemetryContext.Provider value={contextValue}>
      {children}
    </TelemetryContext.Provider>
  );
};

export const useTelemetry = (): TelemetryContextType => {
  const context = useContext(TelemetryContext);
  if (!context) {
    throw new Error('useTelemetry must be used within a TelemetryProvider');
  }
  return context;
};