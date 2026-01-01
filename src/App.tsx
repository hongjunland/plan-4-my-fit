import { Suspense, useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { cacheUtils } from './utils/cache';
import { InstallPrompt, UpdatePrompt, OfflineIndicator } from './components/pwa';

// Loading component for lazy-loaded pages
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

function App() {
  useEffect(() => {
    // Initialize cache on app start
    cacheUtils.initialize();
  }, []);

  return (
    <>
      <OfflineIndicator />
      <Suspense fallback={<PageLoader />}>
        <RouterProvider router={router} />
      </Suspense>
      <UpdatePrompt />
      <InstallPrompt />
    </>
  );
}

export default App;
