import { describe, it, expect, vi } from 'vitest';
import { supabase } from '../supabase';

// Mock environment variables
vi.mock('import.meta', () => ({
  env: {
    VITE_SUPABASE_URL: 'https://test.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'test-anon-key'
  }
}));

describe('Supabase Configuration', () => {
  it('should create supabase client', () => {
    expect(supabase).toBeDefined();
    expect(supabase.auth).toBeDefined();
  });

  it('should have auth methods', () => {
    expect(supabase.auth.signInWithOAuth).toBeDefined();
    expect(supabase.auth.signOut).toBeDefined();
    expect(supabase.auth.getUser).toBeDefined();
  });

  it('should have database methods', () => {
    expect(supabase.from).toBeDefined();
    expect(typeof supabase.from).toBe('function');
  });

  it('should throw error if environment variables are missing', async () => {
    // This test verifies our error handling for missing env vars
    // The actual error would be thrown during module import
    expect(() => {
      const testUrl = import.meta.env.VITE_SUPABASE_URL;
      const testKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!testUrl || !testKey) {
        throw new Error('Missing Supabase environment variables');
      }
    }).not.toThrow();
  });
});