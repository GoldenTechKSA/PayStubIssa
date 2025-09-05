// types/telemetry.ts
export interface TelemetryEvent {
  eventName: string;
  properties?: Record<string, any>;
  timestamp?: number;
  userId?: string;
  sessionId?: string;
}

export interface UserSession {
  sessionId: string;
  userId?: string;
  startTime: number;
  lastActivity: number;
  pageViews: number;
  events: TelemetryEvent[];
}

export interface PageViewEvent extends TelemetryEvent {
  eventName: 'page_view';
  properties: {
    path: string;
    referrer?: string;
    title?: string;
    duration?: number;
  };
}

export interface UserActionEvent extends TelemetryEvent {
  eventName: 'user_action';
  properties: {
    action: string;
    component: string;
    value?: any;
    metadata?: Record<string, any>;
  };
}

export interface PerformanceEvent extends TelemetryEvent {
  eventName: 'performance';
  properties: {
    metric: string;
    value: number;
    url?: string;
  };
}

export interface ErrorEvent extends TelemetryEvent {
  eventName: 'error';
  properties: {
    message: string;
    stack?: string;
    component?: string;
    errorBoundary?: boolean;
  };
}

export interface TelemetryConfig {
  endpoint?: string;
  batchSize?: number;
  flushInterval?: number;
  enableConsoleLogging?: boolean;
  enablePerformanceTracking?: boolean;
  enableErrorTracking?: boolean;
  userId?: string;
  anonymizeData?: boolean;
}