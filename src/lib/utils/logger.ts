/**
 * Comprehensive logging system with different levels and outputs
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  data?: any;
  context?: {
    userId?: string;
    sessionId?: string;
    userAgent?: string;
    url?: string;
    component?: string;
    operation?: string;
  };
  error?: Error;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  enableStorage: boolean;
  maxStorageEntries: number;
  remoteEndpoint?: string;
  context?: Partial<LogEntry['context']>;
}

class Logger {
  private config: LoggerConfig;
  private storage: LogEntry[] = [];
  private sessionId: string;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: LogLevel.INFO,
      enableConsole: true,
      enableRemote: false,
      enableStorage: true,
      maxStorageEntries: 1000,
      ...config
    };

    this.sessionId = this.generateSessionId();
    
    // Set up global error handler
    if (typeof window !== 'undefined') {
      window.addEventListener('error', this.handleGlobalError.bind(this));
      window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    data?: any,
    error?: Error,
    context?: Partial<LogEntry['context']>
  ): LogEntry {
    return {
      timestamp: new Date(),
      level,
      message,
      data,
      error,
      context: {
        sessionId: this.sessionId,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        ...this.config.context,
        ...context
      }
    };
  }

  private async logEntry(entry: LogEntry): Promise<void> {
    if (!this.shouldLog(entry.level)) {
      return;
    }

    // Console logging
    if (this.config.enableConsole) {
      this.logToConsole(entry);
    }

    // Storage logging
    if (this.config.enableStorage) {
      this.logToStorage(entry);
    }

    // Remote logging
    if (this.config.enableRemote && this.config.remoteEndpoint) {
      await this.logToRemote(entry);
    }
  }

  private logToConsole(entry: LogEntry): void {
    const { timestamp, level, message, data, error } = entry;
    const timeStr = timestamp.toISOString();
    const levelStr = LogLevel[level];
    
    const logMessage = `[${timeStr}] ${levelStr}: ${message}`;
    
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(logMessage, data, error);
        break;
      case LogLevel.INFO:
        console.info(logMessage, data);
        break;
      case LogLevel.WARN:
        console.warn(logMessage, data, error);
        break;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        console.error(logMessage, data, error);
        break;
    }
  }

  private logToStorage(entry: LogEntry): void {
    this.storage.push(entry);
    
    // Trim storage if it exceeds max entries
    if (this.storage.length > this.config.maxStorageEntries) {
      this.storage = this.storage.slice(-this.config.maxStorageEntries);
    }

    // Also store in localStorage for persistence
    if (typeof localStorage !== 'undefined') {
      try {
        const recentLogs = this.storage.slice(-100); // Keep last 100 entries
        localStorage.setItem('app_logs', JSON.stringify(recentLogs));
      } catch (error) {
        // Ignore localStorage errors
      }
    }
  }

  private async logToRemote(entry: LogEntry): Promise<void> {
    try {
      await fetch(this.config.remoteEndpoint!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...entry,
          error: entry.error ? {
            name: entry.error.name,
            message: entry.error.message,
            stack: entry.error.stack
          } : undefined
        })
      });
    } catch (error) {
      // Silently fail remote logging to avoid infinite loops
      console.warn('Failed to send log to remote endpoint:', error);
    }
  }

  private handleGlobalError(event: ErrorEvent): void {
    this.error('Global error caught', {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    }, event.error);
  }

  private handleUnhandledRejection(event: PromiseRejectionEvent): void {
    this.error('Unhandled promise rejection', {
      reason: event.reason
    });
  }

  // Public logging methods
  debug(message: string, data?: any, context?: Partial<LogEntry['context']>): void {
    this.logEntry(this.createLogEntry(LogLevel.DEBUG, message, data, undefined, context));
  }

  info(message: string, data?: any, context?: Partial<LogEntry['context']>): void {
    this.logEntry(this.createLogEntry(LogLevel.INFO, message, data, undefined, context));
  }

  warn(message: string, data?: any, error?: Error, context?: Partial<LogEntry['context']>): void {
    this.logEntry(this.createLogEntry(LogLevel.WARN, message, data, error, context));
  }

  error(message: string, data?: any, error?: Error, context?: Partial<LogEntry['context']>): void {
    this.logEntry(this.createLogEntry(LogLevel.ERROR, message, data, error, context));
  }

  critical(message: string, data?: any, error?: Error, context?: Partial<LogEntry['context']>): void {
    this.logEntry(this.createLogEntry(LogLevel.CRITICAL, message, data, error, context));
  }

  // Utility methods
  setContext(context: Partial<LogEntry['context']>): void {
    this.config.context = { ...this.config.context, ...context };
  }

  setUserId(userId: string): void {
    this.setContext({ userId });
  }

  getLogs(level?: LogLevel): LogEntry[] {
    if (level !== undefined) {
      return this.storage.filter(entry => entry.level >= level);
    }
    return [...this.storage];
  }

  clearLogs(): void {
    this.storage = [];
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('app_logs');
    }
  }

  exportLogs(): string {
    return JSON.stringify(this.storage, null, 2);
  }

  // Performance logging
  time(label: string): void {
    if (typeof performance !== 'undefined') {
      performance.mark(`${label}_start`);
    }
  }

  timeEnd(label: string, context?: Partial<LogEntry['context']>): void {
    if (typeof performance !== 'undefined') {
      performance.mark(`${label}_end`);
      performance.measure(label, `${label}_start`, `${label}_end`);
      
      const measure = performance.getEntriesByName(label)[0];
      this.info(`Performance: ${label}`, {
        duration: measure.duration,
        startTime: measure.startTime
      }, context);
    }
  }
}

// Create default logger instance
export const logger = new Logger({
  level: process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO,
  enableConsole: true,
  enableRemote: process.env.NODE_ENV === 'production',
  enableStorage: true,
  remoteEndpoint: process.env.NEXT_PUBLIC_LOG_ENDPOINT
});

// Specialized loggers for different components
export const aiLogger = new Logger({
  level: LogLevel.INFO,
  enableConsole: true,
  enableRemote: true,
  enableStorage: true,
  context: { component: 'AI' }
});

export const imageLogger = new Logger({
  level: LogLevel.INFO,
  enableConsole: true,
  enableRemote: true,
  enableStorage: true,
  context: { component: 'ImageProcessing' }
});

export const authLogger = new Logger({
  level: LogLevel.INFO,
  enableConsole: true,
  enableRemote: true,
  enableStorage: true,
  context: { component: 'Auth' }
});