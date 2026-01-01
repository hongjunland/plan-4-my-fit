import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  PerformanceMonitor, 
  analyzeBundleSize, 
  getMemoryUsage, 
  measureAsync,
  initPerformanceMonitoring 
} from '../performance';

// Mock performance API
const mockPerformance = {
  now: vi.fn(() => Date.now()),
  getEntriesByType: vi.fn(),
  memory: {
    usedJSHeapSize: 1024 * 1024 * 10, // 10MB
    totalJSHeapSize: 1024 * 1024 * 20, // 20MB
    jsHeapSizeLimit: 1024 * 1024 * 100, // 100MB
  },
};

// Mock PerformanceObserver
const mockPerformanceObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
}));

Object.defineProperty(global, 'performance', {
  value: mockPerformance,
  writable: true,
});

Object.defineProperty(global, 'PerformanceObserver', {
  value: mockPerformanceObserver,
  writable: true,
});

Object.defineProperty(global, 'window', {
  value: {
    performance: mockPerformance,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
  writable: true,
});

describe('Performance Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('PerformanceMonitor', () => {
    it('should initialize performance observers', () => {
      const monitor = new PerformanceMonitor();
      
      // Should create observers for different metrics
      expect(mockPerformanceObserver).toHaveBeenCalled();
      
      const metrics = monitor.getMetrics();
      expect(metrics).toHaveProperty('loadTime');
      expect(metrics).toHaveProperty('domContentLoaded');
    });

    it('should measure basic load times', () => {
      // Mock navigation timing
      mockPerformance.getEntriesByType.mockReturnValue([{
        fetchStart: 0,
        loadEventEnd: 1000,
        domContentLoadedEventEnd: 800,
        domInteractive: 600,
      }]);

      const monitor = new PerformanceMonitor();
      const metrics = monitor.getMetrics();

      expect(metrics.loadTime).toBe(1000);
      expect(metrics.domContentLoaded).toBe(800);
      expect(metrics.timeToInteractive).toBe(600);
    });

    it('should handle missing performance API gracefully', () => {
      const originalPerformance = global.performance;
      // @ts-ignore
      global.performance = undefined;

      expect(() => {
        new PerformanceMonitor();
      }).not.toThrow();

      global.performance = originalPerformance;
    });

    it('should cleanup observers', () => {
      const monitor = new PerformanceMonitor();
      const disconnectSpy = vi.fn();
      
      // Mock observer with disconnect method
      monitor['observers'] = [{ disconnect: disconnectSpy } as any];
      
      monitor.cleanup();
      expect(disconnectSpy).toHaveBeenCalled();
    });

    it('should log metrics to console', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const consoleGroupSpy = vi.spyOn(console, 'group').mockImplementation(() => {});
      const consoleGroupEndSpy = vi.spyOn(console, 'groupEnd').mockImplementation(() => {});

      const monitor = new PerformanceMonitor();
      monitor.logMetrics();

      expect(consoleGroupSpy).toHaveBeenCalledWith('🚀 Plan4MyFit Performance Metrics');
      expect(consoleSpy).toHaveBeenCalled();
      expect(consoleGroupEndSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
      consoleGroupSpy.mockRestore();
      consoleGroupEndSpy.mockRestore();
    });
  });

  describe('analyzeBundleSize', () => {
    it('should analyze JavaScript and CSS bundle sizes', () => {
      const mockResources = [
        { name: 'app.js', transferSize: 1024 * 50 }, // 50KB
        { name: 'vendor.js', transferSize: 1024 * 100 }, // 100KB
        { name: 'styles.css', transferSize: 1024 * 20 }, // 20KB
        { name: 'node_modules/lib.js', transferSize: 1024 * 200 }, // Should be ignored
      ];

      mockPerformance.getEntriesByType.mockReturnValue(mockResources);

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const consoleGroupSpy = vi.spyOn(console, 'group').mockImplementation(() => {});
      const consoleGroupEndSpy = vi.spyOn(console, 'groupEnd').mockImplementation(() => {});

      const result = analyzeBundleSize();

      expect(result).toEqual({
        javascript: 1024 * 150, // 50KB + 100KB (node_modules excluded)
        css: 1024 * 20,
        total: 1024 * 170,
      });

      expect(consoleGroupSpy).toHaveBeenCalledWith('📦 Bundle Size Analysis');
      expect(consoleSpy).toHaveBeenCalledWith('JavaScript:', '150.00 KB');
      expect(consoleSpy).toHaveBeenCalledWith('CSS:', '20.00 KB');
      expect(consoleSpy).toHaveBeenCalledWith('Total:', '170.00 KB');

      consoleSpy.mockRestore();
      consoleGroupSpy.mockRestore();
      consoleGroupEndSpy.mockRestore();
    });

    it('should return null when performance API is not available', () => {
      const originalPerformance = global.performance;
      // @ts-ignore
      global.performance = undefined;

      const result = analyzeBundleSize();
      expect(result).toBeNull();

      global.performance = originalPerformance;
    });
  });

  describe('getMemoryUsage', () => {
    it('should return memory usage information', () => {
      const result = getMemoryUsage();

      expect(result).toEqual({
        used: 1024 * 1024 * 10,
        total: 1024 * 1024 * 20,
        limit: 1024 * 1024 * 100,
      });
    });

    it('should return null when memory API is not available', () => {
      const originalMemory = mockPerformance.memory;
      delete mockPerformance.memory;

      const result = getMemoryUsage();
      expect(result).toBeNull();

      mockPerformance.memory = originalMemory;
    });
  });

  describe('measureAsync', () => {
    it('should measure execution time of async functions', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      let callCount = 0;
      mockPerformance.now.mockImplementation(() => {
        callCount++;
        return callCount === 1 ? 0 : 100; // 100ms execution time
      });

      const asyncFn = vi.fn().mockResolvedValue('result');
      
      const result = await measureAsync('test operation', asyncFn);

      expect(result).toBe('result');
      expect(asyncFn).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('⏱️ test operation: 100.00ms');

      consoleSpy.mockRestore();
    });

    it('should handle async function errors', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      let callCount = 0;
      mockPerformance.now.mockImplementation(() => {
        callCount++;
        return callCount === 1 ? 0 : 50; // 50ms before error
      });

      const error = new Error('Test error');
      const asyncFn = vi.fn().mockRejectedValue(error);

      await expect(measureAsync('failing operation', asyncFn)).rejects.toThrow('Test error');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '❌ failing operation failed after 50.00ms:',
        error
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('initPerformanceMonitoring', () => {
    it('should initialize monitoring in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      
      const monitor = initPerformanceMonitoring();

      expect(monitor).toBeInstanceOf(PerformanceMonitor);
      expect(addEventListenerSpy).toHaveBeenCalledWith('load', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));

      process.env.NODE_ENV = originalEnv;
      addEventListenerSpy.mockRestore();
    });

    it('should not initialize monitoring in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const monitor = initPerformanceMonitoring();

      expect(monitor).toBeNull();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Performance Thresholds', () => {
    it('should validate Core Web Vitals thresholds', () => {
      const monitor = new PerformanceMonitor();
      
      // Simulate good performance metrics
      monitor['metrics'] = {
        loadTime: 1500, // < 2000ms (good)
        firstContentfulPaint: 1200, // < 1800ms (good)
        largestContentfulPaint: 2000, // < 2500ms (good)
        cumulativeLayoutShift: 0.05, // < 0.1 (good)
        firstInputDelay: 80, // < 100ms (good)
      };

      const metrics = monitor.getMetrics();

      // Validate against Core Web Vitals thresholds
      expect(metrics.loadTime).toBeLessThan(2000);
      expect(metrics.firstContentfulPaint!).toBeLessThan(1800);
      expect(metrics.largestContentfulPaint!).toBeLessThan(2500);
      expect(metrics.cumulativeLayoutShift!).toBeLessThan(0.1);
      expect(metrics.firstInputDelay!).toBeLessThan(100);
    });

    it('should identify performance issues', () => {
      const monitor = new PerformanceMonitor();
      
      // Simulate poor performance metrics
      monitor['metrics'] = {
        loadTime: 5000, // > 3000ms (poor)
        firstContentfulPaint: 3000, // > 1800ms (poor)
        largestContentfulPaint: 4000, // > 2500ms (poor)
        cumulativeLayoutShift: 0.25, // > 0.1 (poor)
        firstInputDelay: 200, // > 100ms (poor)
      };

      const metrics = monitor.getMetrics();

      // These should fail performance thresholds
      expect(metrics.loadTime).toBeGreaterThan(3000);
      expect(metrics.firstContentfulPaint!).toBeGreaterThan(1800);
      expect(metrics.largestContentfulPaint!).toBeGreaterThan(2500);
      expect(metrics.cumulativeLayoutShift!).toBeGreaterThan(0.1);
      expect(metrics.firstInputDelay!).toBeGreaterThan(100);
    });
  });
});