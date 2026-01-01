/**
 * Monitoring configuration
 * Centralized configuration for all monitoring services
 */

export interface MonitoringConfig {
  sentry: {
    enabled: boolean;
    dsn?: string;
    environment: string;
    release?: string;
    sampleRate: number;
    tracesSampleRate: number;
    replaysSessionSampleRate: number;
    replaysOnErrorSampleRate: number;
  };
  analytics: {
    enabled: boolean;
    vercelAnalytics: boolean;
    speedInsights: boolean;
  };
  performance: {
    enabled: boolean;
    trackWebVitals: boolean;
    trackUserInteractions: boolean;
    trackNetworkRequests: boolean;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    enableConsole: boolean;
    enableRemote: boolean;
  };
}

/**
 * Get monitoring configuration based on environment
 */
export function getMonitoringConfig(): MonitoringConfig {
  const isDevelopment = import.meta.env.DEV;
  const isProduction = import.meta.env.PROD;
  const environment = import.meta.env.MODE || 'development';

  return {
    sentry: {
      enabled: !!import.meta.env.VITE_SENTRY_DSN,
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment,
      release: import.meta.env.VITE_APP_VERSION || '1.0.0',
      sampleRate: isProduction ? 0.1 : 1.0,
      tracesSampleRate: isProduction ? 0.1 : 1.0,
      replaysSessionSampleRate: isProduction ? 0.1 : 0.5,
      replaysOnErrorSampleRate: 1.0,
    },
    analytics: {
      enabled: true,
      vercelAnalytics: true,
      speedInsights: true,
    },
    performance: {
      enabled: true,
      trackWebVitals: true,
      trackUserInteractions: isDevelopment || isProduction,
      trackNetworkRequests: isDevelopment,
    },
    logging: {
      level: isDevelopment ? 'debug' : 'warn',
      enableConsole: isDevelopment,
      enableRemote: isProduction,
    },
  };
}

/**
 * Feature flags for monitoring
 */
export const MONITORING_FEATURES = {
  ERROR_BOUNDARY: true,
  PERFORMANCE_DASHBOARD: import.meta.env.DEV,
  USER_FEEDBACK: import.meta.env.PROD,
  SESSION_REPLAY: import.meta.env.PROD,
  BREADCRUMBS: true,
  PERFORMANCE_TRACKING: true,
  ANALYTICS_TRACKING: true,
} as const;

/**
 * Monitoring thresholds
 */
export const PERFORMANCE_THRESHOLDS = {
  // Core Web Vitals
  LCP_GOOD: 2500, // ms
  FID_GOOD: 100,  // ms
  CLS_GOOD: 0.1,  // score
  
  // Custom metrics
  LONG_TASK: 50,     // ms
  MEMORY_WARNING: 50, // MB
  NETWORK_SLOW: 3000, // ms
  
  // Error rates
  ERROR_RATE_WARNING: 0.05, // 5%
  ERROR_RATE_CRITICAL: 0.1,  // 10%
} as const;

/**
 * Sampling rates for different environments
 */
export const SAMPLING_RATES = {
  development: {
    errors: 1.0,
    performance: 1.0,
    replays: 1.0,
  },
  staging: {
    errors: 0.5,
    performance: 0.5,
    replays: 0.5,
  },
  production: {
    errors: 0.1,
    performance: 0.1,
    replays: 0.1,
  },
} as const;

/**
 * Get sampling rate for current environment
 */
export function getSamplingRate(type: keyof typeof SAMPLING_RATES.development) {
  const environment = import.meta.env.MODE as keyof typeof SAMPLING_RATES;
  return SAMPLING_RATES[environment]?.[type] || SAMPLING_RATES.development[type];
}