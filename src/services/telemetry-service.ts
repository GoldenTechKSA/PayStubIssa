// services/TelemetryService.ts
import { TelemetryEvent, TelemetryConfig, UserSession } from '../types/telemetry';

class TelemetryService {
  private config: Required<TelemetryConfig>;
  private eventQueue: TelemetryEvent[] = [];
  private session: UserSession;
  private flushTimer: ReturnType<typeof setInterval> | null = null;

  constructor(config: TelemetryConfig = {}) {
    this.config = {
      endpoint: config.endpoint || '/api/telemetry',
      batchSize: config.batchSize || 10,
      flushInterval: config.flushInterval || 30000, // 30 seconds
      enableConsoleLogging: config.enableConsoleLogging || false,
      enablePerformanceTracking: config.enablePerformanceTracking || true,
      enableErrorTracking: config.enableErrorTracking || true,
      userId: config.userId || this.generateUserId(),
      anonymizeData: config.anonymizeData || false,
    };

    this.session = this.initializeSession();
    this.setupAutoFlush();
    this.setupBeforeUnloadHandler();
    
    if (this.config.enablePerformanceTracking) {
      this.setupPerformanceTracking();
    }

    if (this.config.enableErrorTracking) {
      this.setupErrorTracking();
    }
  }

  private initializeSession(): UserSession {
    const sessionId = this.generateSessionId();
    return {
      sessionId,
      userId: this.config.userId,
      startTime: Date.now(),
      lastActivity: Date.now(),
      pageViews: 0,
      events: [],
    };
  }

  private generateUserId(): string {
    const stored = localStorage.getItem('telemetry_user_id');
    if (stored) return stored;
    
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('telemetry_user_id', userId);
    return userId;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public track(eventName: string, properties?: Record<string, any>): void {
    const event: TelemetryEvent = {
      eventName,
      properties,
      timestamp: Date.now(),
      userId: this.config.userId,
      sessionId: this.session.sessionId,
    };

    if (this.config.anonymizeData) {
      this.anonymizeEvent(event);
    }

    this.eventQueue.push(event);
    this.session.events.push(event);
    this.session.lastActivity = Date.now();

    if (this.config.enableConsoleLogging) {
      console.log('Telemetry Event:', event);
    }

    if (this.eventQueue.length >= this.config.batchSize) {
      this.flush();
    }
  }

  public trackPageView(path: string, title?: string, referrer?: string): void {
    this.session.pageViews++;
    this.track('page_view', {
      path,
      title,
      referrer,
      sessionPageViews: this.session.pageViews,
    });
  }

  public trackUserAction(action: string, component: string, value?: any, metadata?: Record<string, any>): void {
    this.track('user_action', {
      action,
      component,
      value,
      metadata,
    });
  }

  public trackError(error: Error, component?: string, errorBoundary?: boolean): void {
    this.track('error', {
      message: error.message,
      stack: error.stack,
      component,
      errorBoundary,
    });
  }

  public trackPerformance(metric: string, value: number, url?: string): void {
    this.track('performance', {
      metric,
      value,
      url,
    });
  }

  public setUserId(userId: string): void {
    this.config.userId = userId;
    this.session.userId = userId;
    localStorage.setItem('telemetry_user_id', userId);
  }

  private anonymizeEvent(event: TelemetryEvent): void {
    // Remove or hash sensitive data
    if (event.properties?.email) {
      delete event.properties.email;
    }
    if (event.properties?.phone) {
      delete event.properties.phone;
    }
    // Add more anonymization rules as needed
  }

  private async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const eventsToSend = [...this.eventQueue];
    this.eventQueue = [];

    try {
      await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          events: eventsToSend,
          session: this.session,
        }),
      });
    } catch (error) {
      // Re-add events to queue if send failed
      this.eventQueue.unshift(...eventsToSend);
      console.error('Failed to send telemetry data:', error);
    }
  }

  private setupAutoFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  private setupBeforeUnloadHandler(): void {
    window.addEventListener('beforeunload', () => {
      // Send any remaining events before page unload
      if (this.eventQueue.length > 0) {
        navigator.sendBeacon(
          this.config.endpoint,
          JSON.stringify({
            events: this.eventQueue,
            session: this.session,
          })
        );
      }
    });
  }

  private setupPerformanceTracking(): void {
    // Track page load performance
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (perfData) {
          this.trackPerformance('page_load_time', perfData.loadEventEnd - perfData.fetchStart);
          this.trackPerformance('dom_content_loaded', perfData.domContentLoadedEventEnd - perfData.fetchStart);
          this.trackPerformance('time_to_first_byte', perfData.responseStart - perfData.requestStart);
        }
      }, 0);
    });

    // Track Core Web Vitals
    this.setupWebVitals();
  }

  private setupWebVitals(): void {
    // Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.trackPerformance('largest_contentful_paint', lastEntry.startTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay
      const fidObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          this.trackPerformance('first_input_delay', (entry as any).processingStart - entry.startTime);
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift
      let clsScore = 0;
      const clsObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsScore += (entry as any).value;
          }
        }
        this.trackPerformance('cumulative_layout_shift', clsScore);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    }
  }

  private setupErrorTracking(): void {
    window.addEventListener('error', (event) => {
      this.trackError(new Error(event.message), 'global', false);
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.trackError(new Error(`Unhandled Promise Rejection: ${event.reason}`), 'global', false);
    });
  }

  public destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush(); // Send any remaining events
  }
}

export const telemetryService = new TelemetryService();
export default TelemetryService;