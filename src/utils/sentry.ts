/**
 * Sentry error monitoring configuration
 * Handles error tracking, performance monitoring, and user feedback
 */

import * as Sentry from '@sentry/react';
import React from 'react';
import { logger } from './logger';

interface SentryConfig {
  dsn?: string;
  environment: string;
  release?: string;
  sampleRate: number;
  tracesSampleRate: number;
  replaysSessionSampleRate: number;
  replaysOnErrorSampleRate: number;
}

/**
 * Initialize Sentry error monitoring
 */
export function initSentry(): void {
  const config: SentryConfig = {
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE || 'development',
    release: import.meta.env.VITE_APP_VERSION || '1.0.0',
    sampleRate: import.meta.env.PROD ? 0.1 : 1.0, // 10% in production, 100% in development
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
  };

  // Only initialize if DSN is provided
  if (!config.dsn) {
    logger.warn('Sentry DSN not provided, error monitoring disabled');
    return;
  }

  try {
    Sentry.init({
      dsn: config.dsn,
      environment: config.environment,
      release: config.release,
      
      // Performance monitoring
      tracesSampleRate: config.tracesSampleRate,
      
      // Session replay
      replaysSessionSampleRate: config.replaysSessionSampleRate,
      replaysOnErrorSampleRate: config.replaysOnErrorSampleRate,
      
      // Error filtering
      beforeSend(event, hint) {
        // Filter out development errors
        if (config.environment === 'development') {
          logger.debug('Sentry event captured in development', { 
            error: hint.originalException,
            event: event.exception?.values?.[0]?.value 
          });
        }

        // Filter out known non-critical errors
        const error = hint.originalException;
        if (error instanceof Error) {
          // Skip network errors that are user-related
          if (error.message.includes('NetworkError') || 
              error.message.includes('Failed to fetch')) {
            return null;
          }
          
          // Skip ResizeObserver errors (common browser quirk)
          if (error.message.includes('ResizeObserver loop limit exceeded')) {
            return null;
          }
        }

        return event;
      },

      // Performance monitoring integrations
      integrations: [
        Sentry.browserTracingIntegration({
          // Capture interactions
          enableInp: true,
        }),
        Sentry.replayIntegration({
          // Mask sensitive data
          maskAllText: true,
          maskAllInputs: true,
          blockAllMedia: true,
        }),
      ],

      // Additional options
      attachStacktrace: true,
      sendDefaultPii: false, // Don't send personally identifiable information
      
      // Custom tags
      initialScope: {
        tags: {
          component: 'fitness-routine-planner',
          platform: 'web',
        },
      },
    });

    logger.info('Sentry initialized successfully', { 
      environment: config.environment,
      release: config.release 
    });

  } catch (error) {
    logger.error('Failed to initialize Sentry', error as Error);
  }
}

/**
 * Capture custom error with context
 */
export function captureError(error: Error, context?: Record<string, any>): void {
  Sentry.withScope((scope) => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setContext(key, value);
      });
    }
    Sentry.captureException(error);
  });
  
  // Also log locally
  logger.error('Error captured by Sentry', error, context);
}

/**
 * Capture custom message with level
 */
export function captureMessage(
  message: string, 
  level: Sentry.SeverityLevel = 'info',
  context?: Record<string, any>
): void {
  Sentry.withScope((scope) => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setContext(key, value);
      });
    }
    Sentry.captureMessage(message, level);
  });
}

/**
 * Set user context for error tracking
 */
export function setUserContext(user: {
  id?: string;
  email?: string;
  username?: string;
}): void {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });
}

/**
 * Clear user context (on logout)
 */
export function clearUserContext(): void {
  Sentry.setUser(null);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  category: string = 'custom',
  level: Sentry.SeverityLevel = 'info',
  data?: Record<string, any>
): void {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Start performance transaction
 */
export function startTransaction(name: string, op: string = 'navigation') {
  return Sentry.startSpan({ name, op }, () => {});
}

/**
 * Measure performance of async operations
 */
export async function measurePerformance<T>(
  name: string,
  operation: () => Promise<T>,
  context?: Record<string, any>
): Promise<T> {
  return await Sentry.startSpan({ name, op: 'function' }, async (span) => {
    try {
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          span?.setAttribute(key, String(value));
        });
      }
      
      const result = await operation();
      span?.setStatus({ code: 1 }); // OK
      return result;
    } catch (error) {
      span?.setStatus({ code: 2 }); // ERROR
      captureError(error as Error, { operation: name, ...context });
      throw error;
    }
  });
}

/**
 * React Error Boundary component
 */
export const SentryErrorBoundary = Sentry.ErrorBoundary;

/**
 * Higher-order component for error boundary
 */
export function withSentryErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryOptions?: Parameters<typeof Sentry.withErrorBoundary>[1]
) {
  return Sentry.withErrorBoundary(Component, {
    fallback: ({ error, resetError }) => React.createElement(
      'div',
      { className: 'min-h-screen flex items-center justify-center bg-gray-50' },
      React.createElement(
        'div',
        { className: 'max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center' },
        React.createElement('div', { className: 'text-red-500 text-6xl mb-4' }, '⚠️'),
        React.createElement(
          'h2',
          { className: 'text-xl font-semibold text-gray-900 mb-2' },
          '앱에 오류가 발생했습니다'
        ),
        React.createElement(
          'p',
          { className: 'text-gray-600 mb-4' },
          '문제가 자동으로 보고되었습니다. 잠시 후 다시 시도해주세요.'
        ),
        React.createElement(
          'button',
          {
            onClick: resetError,
            className: 'bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors'
          },
          '다시 시도'
        ),
        import.meta.env.DEV && React.createElement(
          'details',
          { className: 'mt-4 text-left' },
          React.createElement(
            'summary',
            { className: 'cursor-pointer text-sm text-gray-500' },
            '개발자 정보'
          ),
          React.createElement(
            'pre',
            { className: 'mt-2 text-xs text-red-600 overflow-auto' },
            (error as Error).toString()
          )
        )
      )
    ),
    ...errorBoundaryOptions,
  });
}