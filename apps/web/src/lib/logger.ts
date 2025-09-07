/**
 * Comprehensive logging system for debugging and monitoring
 * Supports structured logging, performance tracking, and audit trails
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  operation?: string;
  metadata?: Record<string, any>;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  performance?: {
    duration: number;
    operation: string;
  };
}

export interface AuditLogEntry extends LogEntry {
  action: string;
  resource: string;
  resourceId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Main Logger class with structured logging capabilities
 */
export class Logger {
  private static instance: Logger;
  private context: LogContext = {};
  private isDevelopment = process.env.NODE_ENV === 'development';

  constructor() {
    // Singleton pattern
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Set global context for all log entries
   */
  setContext(context: Partial<LogContext>): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Clear global context
   */
  clearContext(): void {
    this.context = {};
  }

  /**
   * Create structured log entry
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    additionalContext?: Partial<LogContext>,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: { ...this.context, ...additionalContext },
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined,
        code: (error as any).code,
      };
    }

    return entry;
  }

  /**
   * Log entry to console or external service
   */
  private logEntry(entry: LogEntry): void {
    if (this.isDevelopment) {
      // Pretty print in development
      const color = this.getLogColor(entry.level);
      console.log(
        `%c[${entry.level.toUpperCase()}] ${entry.timestamp} - ${entry.message}`,
        `color: ${color}; font-weight: bold;`,
        entry.context ? '\nContext:' : '',
        entry.context || '',
        entry.error ? '\nError:' : '',
        entry.error || ''
      );
    } else {
      // Structured JSON in production
      console.log(JSON.stringify(entry));
      
      // TODO: Send to external logging service (DataDog, LogRocket, etc.)
      // await this.sendToExternalLogger(entry);
    }
  }

  private getLogColor(level: LogLevel): string {
    switch (level) {
      case 'debug': return '#666666';
      case 'info': return '#0066cc';
      case 'warn': return '#ff9900';
      case 'error': return '#cc0000';
      default: return '#000000';
    }
  }

  /**
   * Debug logging
   */
  debug(message: string, context?: Partial<LogContext>): void {
    if (this.isDevelopment) {
      this.logEntry(this.createLogEntry('debug', message, context));
    }
  }

  /**
   * Info logging
   */
  info(message: string, context?: Partial<LogContext>): void {
    this.logEntry(this.createLogEntry('info', message, context));
  }

  /**
   * Warning logging
   */
  warn(message: string, context?: Partial<LogContext>): void {
    this.logEntry(this.createLogEntry('warn', message, context));
  }

  /**
   * Error logging
   */
  error(message: string, error?: Error, context?: Partial<LogContext>): void {
    this.logEntry(this.createLogEntry('error', message, context, error));
  }

  /**
   * Performance logging with timing
   */
  performance(operation: string, duration: number, context?: Partial<LogContext>): void {
    const entry: LogEntry = {
      ...this.createLogEntry('info', `Performance: ${operation} completed`, context),
      performance: { duration, operation }
    };
    this.logEntry(entry);
  }
}

/**
 * Audit Logger for sensitive operations
 */
export class AuditLogger {
  private static instance: AuditLogger;
  private logger: Logger;

  constructor() {
    this.logger = Logger.getInstance();
  }

  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  /**
   * Log audit event
   */
  log(entry: Omit<AuditLogEntry, 'timestamp' | 'level'>): void {
    const auditEntry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      ...entry,
    };

    // Log to main logger
    this.logger.info(`AUDIT: ${entry.action} on ${entry.resource}`, {
      ...entry.context,
      audit: true,
    });

    // In production, send to dedicated audit log system
    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify({ ...auditEntry, type: 'AUDIT' }));
    }
  }

  /**
   * Log data creation
   */
  logCreate(resource: string, resourceId: string, data: Record<string, any>, context?: LogContext): void {
    this.log({
      message: `Created ${resource}`,
      action: 'CREATE',
      resource,
      resourceId,
      newValues: data,
      context,
    });
  }

  /**
   * Log data update
   */
  logUpdate(
    resource: string, 
    resourceId: string, 
    oldValues: Record<string, any>, 
    newValues: Record<string, any>,
    context?: LogContext
  ): void {
    this.log({
      message: `Updated ${resource}`,
      action: 'UPDATE',
      resource,
      resourceId,
      oldValues,
      newValues,
      context,
    });
  }

  /**
   * Log data deletion
   */
  logDelete(resource: string, resourceId: string, data: Record<string, any>, context?: LogContext): void {
    this.log({
      message: `Deleted ${resource}`,
      action: 'DELETE',
      resource,
      resourceId,
      oldValues: data,
      context,
    });
  }
}

/**
 * Performance measurement utility
 */
export class PerformanceTracker {
  private static timers: Map<string, number> = new Map();
  private static logger = Logger.getInstance();

  /**
   * Start timing an operation
   */
  static start(operationName: string): void {
    this.timers.set(operationName, Date.now());
  }

  /**
   * End timing and log performance
   */
  static end(operationName: string, context?: Partial<LogContext>): number {
    const startTime = this.timers.get(operationName);
    if (!startTime) {
      this.logger.warn(`Performance timer not found for operation: ${operationName}`);
      return 0;
    }

    const duration = Date.now() - startTime;
    this.timers.delete(operationName);

    this.logger.performance(operationName, duration, context);

    // Warn if operation is slow
    if (duration > 1000) {
      this.logger.warn(`Slow operation detected: ${operationName} took ${duration}ms`, context);
    }

    return duration;
  }

  /**
   * Measure async operation
   */
  static async measure<T>(
    operationName: string,
    operation: () => Promise<T>,
    context?: Partial<LogContext>
  ): Promise<T> {
    this.start(operationName);
    try {
      const result = await operation();
      this.end(operationName, context);
      return result;
    } catch (error) {
      const duration = this.end(operationName, context);
      this.logger.error(
        `Operation ${operationName} failed after ${duration}ms`,
        error as Error,
        context
      );
      throw error;
    }
  }
}

/**
 * Database operation logger
 */
export class DatabaseLogger {
  private static logger = Logger.getInstance();
  private static auditLogger = AuditLogger.getInstance();

  /**
   * Log database query
   */
  static logQuery(table: string, operation: string, duration?: number, context?: LogContext): void {
    this.logger.debug(`DB Query: ${operation} on ${table}`, {
      ...context,
      table,
      operation,
      performance: duration ? { duration, operation: `${operation}_${table}` } : undefined,
    });
  }

  /**
   * Log database error
   */
  static logError(table: string, operation: string, error: Error, context?: LogContext): void {
    this.logger.error(`DB Error: ${operation} on ${table} failed`, error, {
      ...context,
      table,
      operation,
    });
  }

  /**
   * Log sensitive database operation
   */
  static logSensitiveOperation(
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    table: string,
    recordId: string,
    oldData?: Record<string, any>,
    newData?: Record<string, any>,
    context?: LogContext
  ): void {
    if (action === 'CREATE') {
      this.auditLogger.logCreate(table, recordId, newData || {}, context);
    } else if (action === 'UPDATE') {
      this.auditLogger.logUpdate(table, recordId, oldData || {}, newData || {}, context);
    } else if (action === 'DELETE') {
      this.auditLogger.logDelete(table, recordId, oldData || {}, context);
    }
  }
}

// Export singleton instances for easy use
export const logger = Logger.getInstance();
export const auditLogger = AuditLogger.getInstance();
export const performanceTracker = PerformanceTracker;
export const dbLogger = DatabaseLogger;