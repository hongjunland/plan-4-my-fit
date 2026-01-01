/**
 * Environment variables validation utility
 * Ensures all required environment variables are present and valid
 */

interface EnvConfig {
  // Supabase
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  
  // OpenAI
  VITE_OPENAI_API_KEY: string;
  
  // App
  VITE_APP_URL: string;
  VITE_APP_NAME: string;
  VITE_APP_VERSION: string;
  
  // Optional
  VITE_SENTRY_DSN?: string;
  VITE_GA_TRACKING_ID?: string;
  VITE_ENABLE_PWA?: string;
  VITE_ENABLE_ANALYTICS?: string;
  VITE_ENABLE_PERFORMANCE_MONITORING?: string;
}

class EnvironmentValidator {
  private env: ImportMetaEnv;
  
  constructor(env: ImportMetaEnv) {
    this.env = env;
  }

  /**
   * Validate all required environment variables
   */
  validate(): EnvConfig {
    const errors: string[] = [];
    
    // Required variables
    const requiredVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY', 
      'VITE_OPENAI_API_KEY',
      'VITE_APP_URL',
      'VITE_APP_NAME',
      'VITE_APP_VERSION'
    ] as const;

    // Check required variables
    for (const varName of requiredVars) {
      const value = this.env[varName];
      if (!value || value.trim() === '') {
        errors.push(`Missing required environment variable: ${varName}`);
      }
    }

    // Validate URL formats
    if (this.env.VITE_SUPABASE_URL && !this.isValidUrl(this.env.VITE_SUPABASE_URL)) {
      errors.push('VITE_SUPABASE_URL must be a valid URL');
    }

    if (this.env.VITE_APP_URL && !this.isValidUrl(this.env.VITE_APP_URL)) {
      errors.push('VITE_APP_URL must be a valid URL');
    }

    // Validate OpenAI API key format
    if (this.env.VITE_OPENAI_API_KEY && !this.isValidOpenAIKey(this.env.VITE_OPENAI_API_KEY)) {
      errors.push('VITE_OPENAI_API_KEY must be a valid OpenAI API key format');
    }

    // Validate Supabase URL format
    if (this.env.VITE_SUPABASE_URL && !this.isValidSupabaseUrl(this.env.VITE_SUPABASE_URL)) {
      errors.push('VITE_SUPABASE_URL must be a valid Supabase URL format');
    }

    // If there are errors, throw them
    if (errors.length > 0) {
      const errorMessage = `Environment validation failed:\n${errors.join('\n')}`;
      
      if (this.env.DEV) {
        console.error('🚨 Environment Validation Errors:');
        errors.forEach(error => console.error(`  - ${error}`));
        console.error('\n💡 Please check your .env.local file');
      }
      
      throw new Error(errorMessage);
    }

    // Return validated config
    return {
      VITE_SUPABASE_URL: this.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: this.env.VITE_SUPABASE_ANON_KEY,
      VITE_OPENAI_API_KEY: this.env.VITE_OPENAI_API_KEY,
      VITE_APP_URL: this.env.VITE_APP_URL,
      VITE_APP_NAME: this.env.VITE_APP_NAME,
      VITE_APP_VERSION: this.env.VITE_APP_VERSION,
      VITE_SENTRY_DSN: this.env.VITE_SENTRY_DSN,
      VITE_GA_TRACKING_ID: this.env.VITE_GA_TRACKING_ID,
      VITE_ENABLE_PWA: this.env.VITE_ENABLE_PWA,
      VITE_ENABLE_ANALYTICS: this.env.VITE_ENABLE_ANALYTICS,
      VITE_ENABLE_PERFORMANCE_MONITORING: this.env.VITE_ENABLE_PERFORMANCE_MONITORING,
    };
  }

  /**
   * Check if a string is a valid URL
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if a string is a valid OpenAI API key format
   */
  private isValidOpenAIKey(key: string): boolean {
    // OpenAI API keys start with 'sk-' and have specific length
    return key.startsWith('sk-') && key.length > 20;
  }

  /**
   * Check if a string is a valid Supabase URL format
   */
  private isValidSupabaseUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.includes('supabase.co') || urlObj.hostname.includes('supabase.in');
    } catch {
      return false;
    }
  }

  /**
   * Get environment info for debugging (safe for production)
   */
  getEnvironmentInfo(): Record<string, any> {
    return {
      mode: this.env.MODE,
      dev: this.env.DEV,
      prod: this.env.PROD,
      // Only show non-sensitive info
      hasSupabaseUrl: !!this.env.VITE_SUPABASE_URL,
      hasSupabaseKey: !!this.env.VITE_SUPABASE_ANON_KEY,
      hasOpenAIKey: !!this.env.VITE_OPENAI_API_KEY,
      appName: this.env.VITE_APP_NAME,
      appVersion: this.env.VITE_APP_VERSION,
      // Feature flags
      pwaEnabled: this.env.VITE_ENABLE_PWA === 'true',
      analyticsEnabled: this.env.VITE_ENABLE_ANALYTICS === 'true',
      performanceMonitoringEnabled: this.env.VITE_ENABLE_PERFORMANCE_MONITORING === 'true',
    };
  }
}

// Create and export validator instance
const envValidator = new EnvironmentValidator(import.meta.env);

// Validate environment on module load (only in development)
let validatedEnv: EnvConfig;

try {
  validatedEnv = envValidator.validate();
  
  if (import.meta.env.DEV) {
    console.log('✅ Environment validation passed');
    console.log('🔧 Environment info:', envValidator.getEnvironmentInfo());
  }
} catch (error) {
  if (import.meta.env.DEV) {
    console.error('❌ Environment validation failed:', error);
  }
  throw error;
}

export { envValidator, validatedEnv };
export type { EnvConfig };