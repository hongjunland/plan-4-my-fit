/**
 * Analytics and performance monitoring utilities
 * Integrates Vercel Analytics and Speed Insights
 */

import { track } from '@vercel/analytics/react';
import { logger } from './logger';

// Event types for type safety
export interface AnalyticsEvent {
  // User actions
  'user_login': { method: 'google' };
  'user_logout': {};
  'profile_setup_started': {};
  'profile_setup_completed': { steps_completed: number };
  
  // Routine actions
  'routine_generated': { 
    duration_weeks: number;
    workouts_per_week: number;
    split_type: string;
    ai_model: string;
  };
  'routine_activated': { routine_id: string };
  'routine_edited': { routine_id: string; changes: string[] };
  'routine_deleted': { routine_id: string };
  
  // Workout actions
  'workout_started': { routine_id: string; workout_id: string };
  'workout_completed': { 
    routine_id: string; 
    workout_id: string; 
    completion_rate: number;
    duration_minutes?: number;
  };
  'exercise_completed': { 
    exercise_name: string; 
    muscle_group: string;
  };
  
  // Navigation
  'page_view': { page: string; referrer?: string };
  'tab_switched': { from: string; to: string };
  
  // Errors
  'error_occurred': { 
    error_type: string; 
    component?: string; 
    user_action?: string;
  };
  
  // Performance
  'performance_metric': {
    metric_name: string;
    value: number;
    unit: string;
  };
}

/**
 * Track custom events with type safety
 */
export function trackEvent<K extends keyof AnalyticsEvent>(
  event: K,
  properties: AnalyticsEvent[K]
): void {
  try {
    // Send to Vercel Analytics
    track(event, properties as any);
    
    // Log for development
    logger.userAction(event, undefined, properties);
    
  } catch (error) {
    logger.error('Failed to track analytics event', error as Error, {
      event,
      properties
    });
  }
}

/**
 * Track page views
 */
export function trackPageView(page: string, referrer?: string): void {
  trackEvent('page_view', { page, referrer });
}

/**
 * Track user actions with automatic user context
 */
export function trackUserAction<K extends keyof AnalyticsEvent>(
  event: K,
  properties: AnalyticsEvent[K],
  userId?: string
): void {
  try {
    // Add user context if available
    const eventProperties = {
      ...properties,
      ...(userId && { user_id: userId.slice(0, 8) + '***' }) // Partially mask user ID
    };
    
    track(event, eventProperties as any);
    logger.userAction(event, userId, properties);
    
  } catch (error) {
    logger.error('Failed to track user action', error as Error, {
      event,
      properties,
      userId: userId ? 'provided' : 'not_provided'
    });
  }
}

/**
 * Track performance metrics
 */
export function trackPerformance(
  metricName: string,
  value: number,
  unit: string = 'ms'
): void {
  trackEvent('performance_metric', {
    metric_name: metricName,
    value,
    unit
  });
}

/**
 * Track errors with context
 */
export function trackError(
  errorType: string,
  component?: string,
  userAction?: string
): void {
  trackEvent('error_occurred', {
    error_type: errorType,
    component,
    user_action: userAction
  });
}

/**
 * Performance measurement utilities
 */
export class PerformanceTracker {
  private startTimes: Map<string, number> = new Map();
  
  /**
   * Start measuring performance
   */
  start(name: string): void {
    this.startTimes.set(name, performance.now());
  }
  
  /**
   * End measurement and track result
   */
  end(name: string, additionalData?: Record<string, any>): number {
    const startTime = this.startTimes.get(name);
    if (!startTime) {
      logger.warn(`Performance measurement '${name}' was not started`);
      return 0;
    }
    
    const duration = performance.now() - startTime;
    this.startTimes.delete(name);
    
    // Track the performance metric
    trackPerformance(name, duration);
    
    // Log for development
    logger.performance(name, duration, additionalData);
    
    return duration;
  }
  
  /**
   * Measure async operation
   */
  async measure<T>(
    name: string,
    operation: () => Promise<T>,
    additionalData?: Record<string, any>
  ): Promise<T> {
    this.start(name);
    try {
      const result = await operation();
      this.end(name, additionalData);
      return result;
    } catch (error) {
      this.end(name, { ...additionalData, error: true });
      throw error;
    }
  }
}

// Export singleton instance
export const performanceTracker = new PerformanceTracker();

/**
 * React hook for tracking component performance
 */
export function usePerformanceTracking(componentName: string) {
  const tracker = new PerformanceTracker();
  
  React.useEffect(() => {
    tracker.start(`${componentName}_mount`);
    
    return () => {
      tracker.end(`${componentName}_mount`);
    };
  }, [componentName, tracker]);
  
  return {
    trackAction: (actionName: string, operation: () => void | Promise<void>) => {
      const fullName = `${componentName}_${actionName}`;
      
      if (operation.constructor.name === 'AsyncFunction') {
        return tracker.measure(fullName, operation as () => Promise<void>);
      } else {
        tracker.start(fullName);
        (operation as () => void)();
        tracker.end(fullName);
      }
    }
  };
}

/**
 * Web Vitals tracking
 */
export function trackWebVitals(): void {
  // This will be automatically handled by @vercel/speed-insights
  // but we can add custom tracking here if needed
  
  if ('PerformanceObserver' in window) {
    // Track Largest Contentful Paint (LCP)
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      trackPerformance('lcp', lastEntry.startTime);
    });
    
    try {
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (error) {
      // LCP not supported
    }
    
    // Track First Input Delay (FID)
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.name === 'first-input') {
          const fid = (entry as any).processingStart - entry.startTime;
          trackPerformance('fid', fid);
        }
      });
    });
    
    try {
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (error) {
      // FID not supported
    }
  }
}

/**
 * Initialize analytics
 */
export function initAnalytics(): void {
  try {
    // Vercel Analytics is automatically initialized
    // We just need to start tracking web vitals
    trackWebVitals();
    
    logger.info('Analytics initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize analytics', error as Error);
  }
}

// Re-export React import for the hook
import React from 'react';