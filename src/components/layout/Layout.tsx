import { Outlet } from 'react-router-dom';
import { Suspense } from 'react';
import { clsx } from 'clsx';
import Header from './Header';
import BottomNavigation from './BottomNavigation';

interface LayoutProps {
  showHeader?: boolean;
  showBottomNav?: boolean;
  headerProps?: {
    title?: string;
    showBackButton?: boolean;
    showMenuButton?: boolean;
    onBackClick?: () => void;
    onMenuClick?: () => void;
    rightElement?: React.ReactNode;
  };
  className?: string;
  contentClassName?: string;
}

const Layout = ({ 
  showHeader = true,
  showBottomNav = true,
  headerProps,
  className,
  contentClassName
}: LayoutProps) => {
  return (
    <div className={clsx(
      'min-h-screen bg-gray-50',
      // Ensure full viewport height on mobile
      'min-h-[100dvh]',
      className
    )}>
      {/* Mobile container with Toss design system */}
      <div className={clsx(
        // Mobile-first container
        'mx-auto max-w-mobile bg-white min-h-screen relative',
        // Toss-style subtle shadow
        'shadow-sm',
        // Responsive behavior
        'w-full',
        // Safe area support for notched devices
        'safe-area-inset'
      )}>
        {/* Header */}
        {showHeader && <Header {...headerProps} />}
        
        {/* Main content */}
        <main className={clsx(
          // Padding for header and bottom nav
          showHeader && 'pt-[72px]', // Header height + safe area
          showBottomNav && 'pb-[80px]', // Bottom nav height + safe area
          // Content padding
          'px-4',
          // Minimum content height
          'min-h-[calc(100vh-152px)]', // Full height minus header and nav
          contentClassName
        )}>
          <Suspense 
            fallback={
              <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-3">
                  {/* Toss-style loading spinner */}
                  <div className="w-8 h-8 border-3 border-primary-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-gray-600 font-medium">로딩 중...</span>
                </div>
              </div>
            }
          >
            <div className="py-4">
              <Outlet />
            </div>
          </Suspense>
        </main>
        
        {/* Bottom Navigation */}
        {showBottomNav && <BottomNavigation />}
      </div>
    </div>
  );
};

// Mobile Container Component for pages that need custom layout
export const MobileContainer = ({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) => {
  return (
    <div className={clsx(
      'mx-auto max-w-mobile bg-white min-h-screen',
      'shadow-sm w-full safe-area-inset',
      className
    )}>
      {children}
    </div>
  );
};

// Content wrapper for consistent padding
export const ContentWrapper = ({ 
  children, 
  className,
  noPadding = false
}: { 
  children: React.ReactNode; 
  className?: string;
  noPadding?: boolean;
}) => {
  return (
    <div className={clsx(
      !noPadding && 'px-4 py-4',
      className
    )}>
      {children}
    </div>
  );
};

export default Layout;