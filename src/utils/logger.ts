/**
 * Production-safe logging utility
 * Automatically filters out sensitive data and disables logs in production
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  userId?: string;
  action?: string;
  component?: string;
  [key: string]: any;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;
  private isProduction = import.meta.env.PROD;
  
  // Sensitive data patterns to filter out
  private sensitivePatterns = [
    /api[_-]?key/i,
    /secret/i,
    /token/i,
    /password/i,
    /auth/i,
    /bearer/i,
    /jwt/i,
    /session/i
  ];

  /**
   * Sanitize data by removing sensitive information
   */
  private sanitizeData(data: any): any {
    if (typeof data === 'string') {
      // Check if string contains sensitive patterns
      for (const pattern of this.sensitivePatterns) {
        if (pattern.test(data)) {
          return '[REDACTED]';
        }
      }
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item));
    }

    if (data && typeof data === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        // Check if key contains sensitive patterns
        const isSensitiveKey = this.sensitivePatterns.some(pattern => pattern.test(key));
        
        if (isSensitiveKey) {
          sanitized[key] = '[REDACTED]';
        } else {
          sanitized[key] = this.sanitizeData(value);
        }
      }
      return sanitized;
    }

    return data;
  }

  /**
   * Format log message with context
   */
  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    
    if (context) {
      const sanitizedContext = this.sanitizeData(context);
      return `${prefix} ${message} ${JSON.stringify(sanitizedContext)}`;
    }
    
    return `${prefix} ${message}`;
  }

  /**
   * Log debug messages (development only)
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      const formattedMessage = this.formatMessage('debug', message, context);
      console.debug(formattedMessage);
    }
  }

  /**
   * Log info messages (development only)
   */
  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      const formattedMessage = this.formatMessage('info', message, context);
      console.info(formattedMessage);
    }
  }

  /**
   * Log warning messages (all environments)
   */
  warn(message: string, context?: LogContext): void {
    const formattedMessage = this.formatMessage('warn', message, context);
    console.warn(formattedMessage);
  }

  /**
   * Log error messages (all environments)
   */
  error(message: string, error?: Error, context?: LogContext): void {
    const errorContext = {
      ...context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined
      } : undefined
    };
    
    const formattedMessage = this.formatMessage('error', message, errorContext);
    console.error(formattedMessage);
  }

  /**
   * Log performance metrics (development only)
   */
  performance(name: string, duration: number, context?: LogContext): void {
    if (this.isDevelopment) {
      this.info(`Performance: ${name} took ${duration.toFixed(2)}ms`, context);
    }
  }

  /**
   * Log user actions for analytics (production safe)
   */
  userAction(action: string, userId?: string, metadata?: Record<string, any>): void {
    // Only log non-sensitive user actions
    const safeMetadata = this.sanitizeData(metadata);
    const context = {
      userId: userId ? `user_${userId.slice(0, 8)}***` : undefined, // Partially mask user ID
      action,
      metadata: safeMetadata
    };

    if (this.isDevelopment) {
      this.info('User Action', context);
    }
    
    // In production, you might want to send this to analytics service
    // analytics.track(action, context);
  }

  /**
   * Security-focused logging for sensitive operations
   */
  security(message: string, context?: LogContext): void {
    // Always log security events, but sanitize data
    const sanitizedContext = this.sanitizeData(context);
    const formattedMessage = this.formatMessage('warn', `[SECURITY] ${message}`, sanitizedContext);
    console.warn(formattedMessage);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export types for use in other files
export type { LogLevel, LogContext };