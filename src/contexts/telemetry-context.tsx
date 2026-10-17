import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { telemetry, TelemetryService } from '../services/telemetry-service';
import { T } from '../telemetry/codes';
import type { TelemetryConfig } from '../types/telemetry';

interface TelemetryContextType {
  emit: TelemetryService['emit'];
  ids: TelemetryService['ids'];
}

const TelemetryContext = createContext<TelemetryContextType | null>(null);

interface TelemetryProviderProps {
  children: ReactNode;
  config?: Partial<TelemetryConfig>;
}

/** Page load timing as one `[1003]` event, once the browser has the numbers. */
function reportPageLoad(): void {
  const report = () => {
    const nav = performance.getEntriesByType?.('navigation')?.[0] as PerformanceNavigationTiming | undefined;
    if (nav && nav.loadEventEnd > 0) {
      telemetry.emit(T.PERF_PAGE_LOAD, { ms: Math.round(nav.loadEventEnd - nav.fetchStart) });
    }
  };
  if (document.readyState === 'complete') {
    setTimeout(report, 0);
  } else {
    window.addEventListener('load', () => setTimeout(report, 0), { once: true });
  }
}

/**
 * Starts the app-wide telemetry service exactly once. There is deliberately no cleanup:
 * the service outlives any React tree, and stopping it on an effect re-run was what used
 * to kill the flush timer on every App re-render.
 */
export const TelemetryProvider: React.FC<TelemetryProviderProps> = ({ children, config }) => {
  useEffect(() => {
    telemetry.start(config);
    telemetry.installGlobalErrorHandlers(window);
    telemetry.emit(T.APP_LOADED, { path: window.location.pathname });
    reportPageLoad();
    // Runs once per page; config changes after mount are applied by the next start() caller.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value: TelemetryContextType = {
    emit: telemetry.emit.bind(telemetry),
    ids: telemetry.ids.bind(telemetry),
  };

  return <TelemetryContext.Provider value={value}>{children}</TelemetryContext.Provider>;
};

export const useTelemetry = (): TelemetryContextType => {
  const context = useContext(TelemetryContext);
  if (!context) {
    throw new Error('useTelemetry must be used within a TelemetryProvider');
  }
  return context;
};
