/**
 * Performance monitoring and optimization utilities
 * Provides real-time performance metrics and monitoring dashboard
 */

import { logger } from './logger';
import { trackPerformance } from './analytics';

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  category: 'loading' | 'runtime' | 'network' | 'memory' | 'user-interaction';
}

export interface PerformanceReport {
  metrics: PerformanceMetric[];
  summary: {
    averageLoadTime: number;
    memoryUsage: number;
    networkRequests: number;
    errorRate: number;
  };
  recommendations: string[];
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];
  private isMonitoring = false;
  
  /**
   * Start performance monitoring
   */
  start(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.setupObservers();
    this.trackInitialMetrics();
    
    logger.info('Performance monitoring started');
  }
  
  /**
   * Stop performance monitoring
   */
  stop(): void {
    if (!this.isMonitoring) return;
    
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.isMonitoring = false;
    
    logger.info('Performance monitoring stopped');
  }
  
  /**
   * Setup performance observers
   */
  private setupObservers(): void {
    if (!('PerformanceObserver' in window)) {
      logger.warn('PerformanceObserver not supported');
      return;
    }
    
    // Navigation timing
    this.createObserver(['navigation'], (entries) => {
      entries.forEach((entry) => {
        const navEntry = entry as PerformanceNavigationTiming;
        
        this.addMetric('dom_content_loaded', navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart, 'ms', 'loading');
        this.addMetric('load_complete', navEntry.loadEventEnd - navEntry.loadEventStart, 'ms', 'loading');
        this.addMetric('dns_lookup', navEntry.domainLookupEnd - navEntry.domainLookupStart, 'ms', 'network');
        this.addMetric('tcp_connection', navEntry.connectEnd - navEntry.connectStart, 'ms', 'network');
      });
    });
    
    // Resource timing
    this.createObserver(['resource'], (entries) => {
      entries.forEach((entry) => {
        const resourceEntry = entry as PerformanceResourceTiming;
        const duration = resourceEntry.responseEnd - resourceEntry.requestStart;
        
        this.addMetric(`resource_${this.getResourceType(resourceEntry.name)}`, duration, 'ms', 'network');
      });
    });
    
    // Largest Contentful Paint
    this.createObserver(['largest-contentful-paint'], (entries) => {
      const lastEntry = entries[entries.length - 1];
      this.addMetric('lcp', lastEntry.startTime, 'ms', 'loading');
    });
    
    // First Input Delay
    this.createObserver(['first-input'], (entries) => {
      entries.forEach((entry) => {
        const fid = (entry as any).processingStart - entry.startTime;
        this.addMetric('fid', fid, 'ms', 'user-interaction');
      });
    });
    
    // Layout shifts
    this.createObserver(['layout-shift'], (entries) => {
      let clsValue = 0;
      entries.forEach((entry) => {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      });
      if (clsValue > 0) {
        this.addMetric('cls', clsValue, 'score', 'loading');
      }
    });
    
    // Long tasks
    this.createObserver(['longtask'], (entries) => {
      entries.forEach((entry) => {
        this.addMetric('long_task', entry.duration, 'ms', 'runtime');
      });
    });
  }
  
  /**
   * Create performance observer with error handling
   */
  private createObserver(entryTypes: string[], callback: (entries: PerformanceEntry[]) => void): void {
    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });
      
      observer.observe({ entryTypes });
      this.observers.push(observer);
    } catch (error) {
      logger.warn(`Failed to create observer for ${entryTypes.join(', ')}`, { error });
    }
  }
  
  /**
   * Track initial performance metrics
   */
  private trackInitialMetrics(): void {
    // Memory usage
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.addMetric('memory_used', memory.usedJSHeapSize / 1024 / 1024, 'MB', 'memory');
      this.addMetric('memory_total', memory.totalJSHeapSize / 1024 / 1024, 'MB', 'memory');
      this.addMetric('memory_limit', memory.jsHeapSizeLimit / 1024 / 1024, 'MB', 'memory');
    }
    
    // Connection info
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.addMetric('network_downlink', connection.downlink, 'Mbps', 'network');
      this.addMetric('network_rtt', connection.rtt, 'ms', 'network');
    }
  }
  
  /**
   * Add performance metric
   */
  private addMetric(name: string, value: number, unit: string, category: PerformanceMetric['category']): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      category
    };
    
    this.metrics.push(metric);
    
    // Keep only last 100 metrics to prevent memory leaks
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
    
    // Track in analytics
    trackPerformance(name, value, unit);
    
    // Log significant metrics
    if (this.isSignificantMetric(name, value)) {
      logger.performance(`Performance: ${name}`, value, { unit, category });
    }
  }
  
  /**
   * Check if metric is significant enough to log
   */
  private isSignificantMetric(name: string, value: number): boolean {
    const thresholds: Record<string, number> = {
      'lcp': 2500, // LCP > 2.5s is poor
      'fid': 100,  // FID > 100ms is poor
      'cls': 0.1,  // CLS > 0.1 is poor
      'long_task': 50, // Tasks > 50ms
      'memory_used': 50, // Memory > 50MB
    };
    
    return Object.entries(thresholds).some(([key, threshold]) => 
      name.includes(key) && value > threshold
    );
  }
  
  /**
   * Get resource type from URL
   */
  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) return 'image';
    if (url.includes('/api/')) return 'api';
    return 'other';
  }
  
  /**
   * Get current metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }
  
  /**
   * Get performance report
   */
  getReport(): PerformanceReport {
    const loadingMetrics = this.metrics.filter(m => m.category === 'loading');
    const memoryMetrics = this.metrics.filter(m => m.category === 'memory');
    const networkMetrics = this.metrics.filter(m => m.category === 'network');
    
    const averageLoadTime = loadingMetrics.length > 0 
      ? loadingMetrics.reduce((sum, m) => sum + m.value, 0) / loadingMetrics.length 
      : 0;
    
    const memoryUsage = memoryMetrics.find(m => m.name === 'memory_used')?.value || 0;
    const networkRequests = networkMetrics.length;
    const errorRate = 0; // TODO: Calculate from error metrics
    
    const recommendations = this.generateRecommendations();
    
    return {
      metrics: this.metrics,
      summary: {
        averageLoadTime,
        memoryUsage,
        networkRequests,
        errorRate
      },
      recommendations
    };
  }
  
  /**
   * Generate performance recommendations
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const report = {
      lcp: this.metrics.find(m => m.name === 'lcp')?.value || 0,
      fid: this.metrics.find(m => m.name === 'fid')?.value || 0,
      cls: this.metrics.find(m => m.name === 'cls')?.value || 0,
      memoryUsed: this.metrics.find(m => m.name === 'memory_used')?.value || 0,
      longTasks: this.metrics.filter(m => m.name === 'long_task').length
    };
    
    if (report.lcp > 2500) {
      recommendations.push('LCP가 느립니다. 이미지 최적화나 코드 스플리팅을 고려하세요.');
    }
    
    if (report.fid > 100) {
      recommendations.push('FID가 높습니다. JavaScript 실행 시간을 줄이세요.');
    }
    
    if (report.cls > 0.1) {
      recommendations.push('CLS가 높습니다. 레이아웃 시프트를 줄이세요.');
    }
    
    if (report.memoryUsed > 50) {
      recommendations.push('메모리 사용량이 높습니다. 메모리 누수를 확인하세요.');
    }
    
    if (report.longTasks > 5) {
      recommendations.push('긴 작업이 많습니다. 작업을 분할하거나 Web Workers를 사용하세요.');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('성능이 양호합니다! 👍');
    }
    
    return recommendations;
  }
  
  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    logger.info('Performance metrics cleared');
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * React hook for component performance monitoring
 */
export function useComponentPerformance(componentName: string) {
  React.useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      performanceMonitor['addMetric'](`component_${componentName}`, duration, 'ms', 'runtime');
    };
  }, [componentName]);
}

/**
 * Decorator for measuring function performance
 */
export function measurePerformance(_target: any, propertyName: string, descriptor: PropertyDescriptor) {
  const method = descriptor.value;
  
  descriptor.value = function (...args: any[]) {
    const startTime = performance.now();
    const result = method.apply(this, args);
    
    if (result instanceof Promise) {
      return result.finally(() => {
        const endTime = performance.now();
        performanceMonitor['addMetric'](`method_${propertyName}`, endTime - startTime, 'ms', 'runtime');
      });
    } else {
      const endTime = performance.now();
      performanceMonitor['addMetric'](`method_${propertyName}`, endTime - startTime, 'ms', 'runtime');
      return result;
    }
  };
  
  return descriptor;
}

/**
 * Initialize performance monitoring
 */
export function initPerformanceMonitoring(): void {
  try {
    performanceMonitor.start();
    logger.info('Performance monitoring initialized');
  } catch (error) {
    logger.error('Failed to initialize performance monitoring', error as Error);
  }
}

// Re-export React for the hook
import React from 'react';