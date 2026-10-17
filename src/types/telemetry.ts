import type { Level } from '../telemetry/codes';

export type Primitive = string | number | boolean | null;
export type Props = Record<string, Primitive>;

/** One queued event, exactly as it goes over the wire. */
export interface TelemetryEvent {
  code: number;
  name: string;
  level: Level;
  /** Milliseconds since the epoch, browser clock. */
  ts: number;
  props?: Props;
}

export interface TelemetryConfig {
  endpoint: string;
  batchSize: number;
  flushIntervalMs: number;
  /** Print `[1103] wizard.step.completed {…}` lines to the console as events fire. */
  consoleEcho: boolean;
  /** false makes `emit` a no-op; defaults to false under NODE_ENV=test. */
  enabled: boolean;
}

export interface TelemetryIds {
  visitorId: string;
  sessionId: string;
}
