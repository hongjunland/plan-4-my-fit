import { useState, useEffect } from 'react';
import { RefreshCw, X } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';

const UpdatePrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Listen for service worker updates
    const handleSWUpdate = () => {
      setUpdateAvailable(true);
      setShowPrompt(true);
    };

    // Check if there's a waiting service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });

      navigator.serviceWorker.ready.then((registration) => {
        if (registration.waiting) {
          handleSWUpdate();
        }

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                handleSWUpdate();
              }
            });
          }
        });
      });
    }

    // Listen for custom update event from vite-plugin-pwa
    const handleVitePWAUpdate = (event: CustomEvent) => {
      if (event.detail && event.detail.type === 'update-available') {
        handleSWUpdate();
      }
    };

    window.addEventListener('vite-pwa:update-available' as any, handleVitePWAUpdate);

    return () => {
      window.removeEventListener('vite-pwa:update-available' as any, handleVitePWAUpdate);
    };
  }, []);

  const handleUpdate = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      });
    }
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (!showPrompt || !updateAvailable) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 right-4 z-50 max-w-md mx-auto">
      <Card className="bg-blue-50 border-2 border-blue-200 shadow-lg">
        <div className="flex items-start gap-3 p-4">
          <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-blue-600" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-blue-900 mb-1">
              업데이트 사용 가능
            </h3>
            <p className="text-sm text-blue-700 mb-3">
              새로운 버전이 준비되었습니다. 업데이트하시겠습니까?
            </p>
            
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleUpdate}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                업데이트
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDismiss}
                className="px-3 border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default UpdatePrompt;