// PWA utilities for managing offline functionality and app installation

export interface PWAInstallPrompt {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

class PWAManager {
  private deferredPrompt: PWAInstallPrompt | null = null;
  private isInstalled = false;
  private isOnline = navigator.onLine;

  constructor() {
    this.init();
  }

  private init() {
    // Check if app is installed
    this.checkInstallStatus();

    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', this.handleBeforeInstallPrompt.bind(this));
    
    // Listen for app installed
    window.addEventListener('appinstalled', this.handleAppInstalled.bind(this));

    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
  }

  private checkInstallStatus() {
    // Check if running in standalone mode (installed)
    this.isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                     (window.navigator as any).standalone === true;
  }

  private handleBeforeInstallPrompt(e: Event) {
    e.preventDefault();
    this.deferredPrompt = e as any;
  }

  private handleAppInstalled() {
    this.isInstalled = true;
    this.deferredPrompt = null;
  }

  private handleOnline() {
    this.isOnline = true;
  }

  private handleOffline() {
    this.isOnline = false;
  }

  // Public methods
  public async showInstallPrompt(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }

    try {
      await this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      this.deferredPrompt = null;
      return outcome === 'accepted';
    } catch (error) {
      console.error('Error showing install prompt:', error);
      return false;
    }
  }

  public canInstall(): boolean {
    return !!this.deferredPrompt && !this.isInstalled;
  }

  public getInstallStatus(): boolean {
    return this.isInstalled;
  }

  public getOnlineStatus(): boolean {
    return this.isOnline;
  }

  // Cache management for offline functionality
  public async cacheEssentialData() {
    if ('caches' in window) {
      try {
        const cache = await caches.open('essential-data-v1');
        
        // Cache essential API endpoints
        const essentialUrls = [
          '/api/auth/me',
          '/api/profile',
          '/api/routines',
          '/api/routines/active'
        ];

        await Promise.all(
          essentialUrls.map(url => 
            fetch(url).then(response => {
              if (response.ok) {
                cache.put(url, response.clone());
              }
            }).catch(() => {
              // Ignore errors for offline caching
            })
          )
        );
      } catch (error) {
        console.warn('Failed to cache essential data:', error);
      }
    }
  }

  // Get cached data when offline
  public async getCachedData(url: string): Promise<Response | null> {
    if ('caches' in window) {
      try {
        const cache = await caches.open('essential-data-v1');
        const response = await cache.match(url);
        return response || null;
      } catch (error) {
        console.warn('Failed to get cached data:', error);
        return null;
      }
    }
    return null;
  }

  // Check if feature is available offline
  public isFeatureAvailableOffline(feature: string): boolean {
    const offlineFeatures = [
      'view-routines',
      'view-calendar',
      'view-progress',
      'check-exercises'
    ];

    return offlineFeatures.includes(feature);
  }

  // Show offline message for unavailable features
  public showOfflineMessage(feature: string): string {
    const messages: Record<string, string> = {
      'create-routine': 'AI 루틴 생성은 인터넷 연결이 필요합니다.',
      'sync-data': '데이터 동기화는 인터넷 연결이 필요합니다.',
      'update-profile': '프로필 업데이트는 인터넷 연결이 필요합니다.',
      default: '이 기능은 인터넷 연결이 필요합니다.'
    };

    return messages[feature] || messages.default;
  }
}

// Create singleton instance
export const pwaManager = new PWAManager();

// Utility functions
export const isPWAInstalled = () => pwaManager.getInstallStatus();
export const canInstallPWA = () => pwaManager.canInstall();
export const installPWA = () => pwaManager.showInstallPrompt();
export const isOnline = () => pwaManager.getOnlineStatus();
export const isFeatureAvailableOffline = (feature: string) => 
  pwaManager.isFeatureAvailableOffline(feature);
export const getOfflineMessage = (feature: string) => 
  pwaManager.showOfflineMessage(feature);