// Cache utilities for localStorage and sessionStorage

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresIn?: number; // in milliseconds
}

class CacheManager {
  private storage: Storage;

  constructor(storage: Storage) {
    this.storage = storage;
  }

  // Set item with optional expiration
  set<T>(key: string, data: T, expiresIn?: number): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      expiresIn,
    };

    try {
      this.storage.setItem(key, JSON.stringify(item));
    } catch (error) {
      console.warn('Failed to cache data:', error);
    }
  }

  // Get item with expiration check
  get<T>(key: string): T | null {
    try {
      const itemStr = this.storage.getItem(key);
      if (!itemStr) return null;

      const item: CacheItem<T> = JSON.parse(itemStr);
      
      // Check if expired
      if (item.expiresIn && Date.now() - item.timestamp > item.expiresIn) {
        this.remove(key);
        return null;
      }

      return item.data;
    } catch (error) {
      console.warn('Failed to retrieve cached data:', error);
      return null;
    }
  }

  // Remove item
  remove(key: string): void {
    try {
      this.storage.removeItem(key);
    } catch (error) {
      console.warn('Failed to remove cached data:', error);
    }
  }

  // Clear all items
  clear(): void {
    try {
      this.storage.clear();
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }

  // Get all keys
  keys(): string[] {
    try {
      return Object.keys(this.storage);
    } catch (error) {
      console.warn('Failed to get cache keys:', error);
      return [];
    }
  }

  // Clean expired items
  cleanExpired(): void {
    const keys = this.keys();
    keys.forEach(key => {
      this.get(key); // This will remove expired items
    });
  }
}

// Create cache instances
export const localCache = new CacheManager(localStorage);
export const sessionCache = new CacheManager(sessionStorage);

// Cache keys for consistency
export const CACHE_KEYS = {
  USER_PREFERENCES: 'user_preferences',
  LAST_ACTIVE_ROUTINE: 'last_active_routine',
  FORM_DRAFT: 'form_draft',
  THEME_PREFERENCE: 'theme_preference',
  ONBOARDING_COMPLETED: 'onboarding_completed',
} as const;

// Cache durations (in milliseconds)
export const CACHE_DURATION = {
  SHORT: 5 * 60 * 1000,      // 5 minutes
  MEDIUM: 30 * 60 * 1000,    // 30 minutes
  LONG: 24 * 60 * 60 * 1000, // 24 hours
  WEEK: 7 * 24 * 60 * 60 * 1000, // 1 week
} as const;

// Utility functions for common caching patterns
export const cacheUtils = {
  // Cache user preferences
  setUserPreferences: (preferences: Record<string, any>) => {
    localCache.set(CACHE_KEYS.USER_PREFERENCES, preferences, CACHE_DURATION.WEEK);
  },

  getUserPreferences: () => {
    return localCache.get<Record<string, any>>(CACHE_KEYS.USER_PREFERENCES);
  },

  // Cache form drafts
  setFormDraft: (formId: string, data: Record<string, any>) => {
    sessionCache.set(`${CACHE_KEYS.FORM_DRAFT}_${formId}`, data, CACHE_DURATION.MEDIUM);
  },

  getFormDraft: (formId: string) => {
    return sessionCache.get<Record<string, any>>(`${CACHE_KEYS.FORM_DRAFT}_${formId}`);
  },

  clearFormDraft: (formId: string) => {
    sessionCache.remove(`${CACHE_KEYS.FORM_DRAFT}_${formId}`);
  },

  // Clean up on app start
  initialize: () => {
    localCache.cleanExpired();
    sessionCache.cleanExpired();
  },
};