/**
 * Performance monitoring utilities for Plan4MyFit
 */

// Performance metrics interface
export interface PerformanceMetrics {
  loadTime: number;
  domContentLoaded: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  cumulativeLayoutShift?: number;
  firstInputDelay?: number;
  timeToInteractive?: number;
}

// Performance observer for Core Web Vitals
export class PerformanceMonitor {
  private metrics: Partial<PerformanceMetrics> = {};
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializeObservers();
    this.measureLoadTimes();
  }

  private initializeObservers() {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          this.metrics.largestContentfulPaint = lastEntry.startTime;
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);
      } catch (e) {
        console.warn('LCP observer not supported');
      }

      // First Contentful Paint (FCP)
      try {
        const fcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
          if (fcpEntry) {
            this.metrics.firstContentfulPaint = fcpEntry.startTime;
          }
        });
        fcpObserver.observe({ entryTypes: ['paint'] });
        this.observers.push(fcpObserver);
      } catch (e) {
        console.warn('FCP observer not supported');
      }

      // Cumulative Layout Shift (CLS)
      try {
        const clsObserver = new PerformanceObserver((entryList) => {
          let clsValue = 0;
          for (const entry of entryList.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          this.metrics.cumulativeLayoutShift = clsValue;
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);
      } catch (e) {
        console.warn('CLS observer not supported');
      }

      // First Input Delay (FID)
      try {
        const fidObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const firstInput = entries[0] as any;
          if (firstInput) {
            this.metrics.firstInputDelay = firstInput.processingStart - firstInput.startTime;
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);
      } catch (e) {
        console.warn('FID observer not supported');
      }
    }
  }

  private measureLoadTimes() {
    // Basic load time measurements
    if (typeof window !== 'undefined' && window.performance) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        this.metrics.loadTime = navigation.loadEventEnd - navigation.fetchStart;
        this.metrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart;
        this.metrics.timeToInteractive = navigation.domInteractive - navigation.fetchStart;
      }
    }
  }

  public getMetrics(): PerformanceMetrics {
    return {
      loadTime: this.metrics.loadTime || 0,
      domContentLoaded: this.metrics.domContentLoaded || 0,
      firstContentfulPaint: this.metrics.firstContentfulPaint,
      largestContentfulPaint: this.metrics.largestContentfulPaint,
      cumulativeLayoutShift: this.metrics.cumulativeLayoutShift,
      firstInputDelay: this.metrics.firstInputDelay,
      timeToInteractive: this.metrics.timeToInteractive,
    };
  }

  public logMetrics() {
    const metrics = this.getMetrics();
    console.group('🚀 Plan4MyFit Performance Metrics');
    console.log('Load Time:', `${metrics.loadTime.toFixed(2)}ms`);
    console.log('DOM Content Loaded:', `${metrics.domContentLoaded.toFixed(2)}ms`);
    
    if (metrics.firstContentfulPaint) {
      console.log('First Contentful Paint:', `${metrics.firstContentfulPaint.toFixed(2)}ms`);
    }
    
    if (metrics.largestContentfulPaint) {
      console.log('Largest Contentful Paint:', `${metrics.largestContentfulPaint.toFixed(2)}ms`);
    }
    
    if (metrics.cumulativeLayoutShift !== undefined) {
      console.log('Cumulative Layout Shift:', metrics.cumulativeLayoutShift.toFixed(4));
    }
    
    if (metrics.firstInputDelay) {
      console.log('First Input Delay:', `${metrics.firstInputDelay.toFixed(2)}ms`);
    }
    
    if (metrics.timeToInteractive) {
      console.log('Time to Interactive:', `${metrics.timeToInteractive.toFixed(2)}ms`);
    }
    
    console.groupEnd();
  }

  public cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Bundle size analyzer
export const analyzeBundleSize = () => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    const jsResources = resources.filter(resource => 
      resource.name.includes('.js') && !resource.name.includes('node_modules')
    );
    
    const cssResources = resources.filter(resource => 
      resource.name.includes('.css')
    );
    
    const totalJSSize = jsResources.reduce((total, resource) => 
      total + (resource.transferSize || 0), 0
    );
    
    const totalCSSSize = cssResources.reduce((total, resource) => 
      total + (resource.transferSize || 0), 0
    );
    
    console.group('📦 Bundle Size Analysis');
    console.log('JavaScript:', `${(totalJSSize / 1024).toFixed(2)} KB`);
    console.log('CSS:', `${(totalCSSSize / 1024).toFixed(2)} KB`);
    console.log('Total:', `${((totalJSSize + totalCSSSize) / 1024).toFixed(2)} KB`);
    console.groupEnd();
    
    return {
      javascript: totalJSSize,
      css: totalCSSSize,
      total: totalJSSize + totalCSSSize,
    };
  }
  
  return null;
};

// Memory usage monitoring
export const getMemoryUsage = () => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit,
    };
  }
  return null;
};

// Performance timing helper
export const measureAsync = async <T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> => {
  const start = performance.now();
  try {
    const result = await fn();
    const end = performance.now();
    console.log(`⏱️ ${name}: ${(end - start).toFixed(2)}ms`);
    return result;
  } catch (error) {
    const end = performance.now();
    console.error(`❌ ${name} failed after ${(end - start).toFixed(2)}ms:`, error);
    throw error;
  }
};

// Initialize performance monitoring in development
export const initPerformanceMonitoring = () => {
  if (process.env.NODE_ENV === 'development') {
    const monitor = new PerformanceMonitor();
    
    // Log metrics after page load
    window.addEventListener('load', () => {
      setTimeout(() => {
        monitor.logMetrics();
        analyzeBundleSize();
        
        const memory = getMemoryUsage();
        if (memory) {
          console.log('💾 Memory Usage:', {
            used: `${(memory.used / 1024 / 1024).toFixed(2)} MB`,
            total: `${(memory.total / 1024 / 1024).toFixed(2)} MB`,
          });
        }
      }, 1000);
    });
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      monitor.cleanup();
    });
    
    return monitor;
  }
  
  return null;
};