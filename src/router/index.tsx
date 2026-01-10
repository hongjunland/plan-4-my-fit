import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from '../components/layout';
import { ROUTES } from '../constants';
import { withLazyLoading, FormLoader, CalendarLoader } from '../utils/lazyLoad';
import useAuth from '../hooks/useAuth';

// Lazy load pages for better performance
import { lazy } from 'react';

const LoginPage = lazy(() => import('../pages/LoginPage'));
const AuthCallbackPage = lazy(() => import('../pages/AuthCallbackPage'));
const ProfileSetupPage = withLazyLoading(
  () => import('../pages/ProfileSetupPage'),
  <FormLoader />
);
const ProfileEditPage = withLazyLoading(
  () => import('../pages/ProfileEditPage'),
  <FormLoader />
);
const MyPage = lazy(() => import('../pages/MyPage'));
const RoutinesPage = lazy(() => import('../pages/RoutinesPage'));
const RoutineNewPage = withLazyLoading(
  () => import('../pages/RoutineNewPage'),
  <FormLoader />
);
const RoutineEditPage = lazy(() => import('../pages/RoutineEditPage'));
const CalendarPage = withLazyLoading(
  () => import('../pages/CalendarPage'),
  <CalendarLoader />
);
const CalendarSettingsPage = lazy(() => import('../pages/CalendarSettingsPage'));
const GoogleCalendarCallbackPage = lazy(() => import('../pages/GoogleCalendarCallbackPage'));
const ProgressPage = lazy(() => import('../pages/ProgressPage'));

// Root component that handles authentication routing
const RootRedirect = () => {
  const { isAuthenticated, isLoading, isFirstLogin } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (isFirstLogin) {
    return <Navigate to={ROUTES.PROFILE_SETUP} replace />;
  }

  return <Navigate to={ROUTES.CALENDAR} replace />;
};

// Protected route wrapper that requires authentication
const ProtectedLayout = () => {
  const { isAuthenticated, isLoading, isFirstLogin } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (isFirstLogin) {
    return <Navigate to={ROUTES.PROFILE_SETUP} replace />;
  }

  return <Layout />;
};

// Protected profile setup page that requires authentication but allows first login
const ProtectedProfileSetup = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return <ProfileSetupPage />;
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootRedirect />,
  },
  {
    path: ROUTES.LOGIN,
    element: <LoginPage />,
  },
  {
    path: ROUTES.AUTH_CALLBACK,
    element: <AuthCallbackPage />,
  },
  {
    path: ROUTES.PROFILE_SETUP,
    element: <ProtectedProfileSetup />,
  },
  {
    path: ROUTES.GOOGLE_CALENDAR_CALLBACK,
    element: <GoogleCalendarCallbackPage />,
  },
  {
    path: '/app',
    element: <ProtectedLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="calendar" replace />,
      },
      {
        path: 'my',
        element: <MyPage />,
      },
      {
        path: 'my/profile',
        element: <ProfileEditPage />,
      },
      {
        path: 'routines',
        element: <RoutinesPage />,
      },
      {
        path: 'routines/new',
        element: <RoutineNewPage />,
      },
      {
        path: 'routines/:id/edit',
        element: <RoutineEditPage />,
      },
      {
        path: 'calendar',
        element: <CalendarPage />,
      },
      {
        path: 'calendar/settings',
        element: <CalendarSettingsPage />,
      },
      {
        path: 'progress',
        element: <ProgressPage />,
      },
    ],
  },
]);