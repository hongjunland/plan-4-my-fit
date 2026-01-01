import { lazy, Suspense, ComponentType } from 'react';

// Generic loading component
const ComponentLoader = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className="flex items-center justify-center p-4">
      <div className={`animate-spin rounded-full border-b-2 border-blue-600 ${sizeClasses[size]}`}></div>
    </div>
  );
};

// Higher-order component for lazy loading with Suspense
export const withLazyLoading = <T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) => {
  const LazyComponent = lazy(importFunc);
  
  return (props: React.ComponentProps<T>) => (
    <Suspense fallback={fallback || <ComponentLoader />}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

// Specific loaders for different contexts
export const FormLoader = () => (
  <div className="space-y-4 animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
    <div className="space-y-2">
      <div className="h-10 bg-gray-200 rounded"></div>
      <div className="h-10 bg-gray-200 rounded"></div>
    </div>
    <div className="h-10 bg-gray-200 rounded w-1/3"></div>
  </div>
);

export const ChartLoader = () => (
  <div className="space-y-3 animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
    <div className="h-32 bg-gray-200 rounded"></div>
  </div>
);

export const CalendarLoader = () => (
  <div className="space-y-4 animate-pulse">
    <div className="grid grid-cols-7 gap-2">
      {Array.from({ length: 35 }).map((_, i) => (
        <div key={i} className="h-8 bg-gray-200 rounded"></div>
      ))}
    </div>
  </div>
);