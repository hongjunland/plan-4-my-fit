// App constants

// Route paths
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  AUTH_CALLBACK: '/auth/callback',
  PROFILE_SETUP: '/profile/setup',
  PROFILE_SETUP_BASIC: '/profile/setup/basic',
  PROFILE_SETUP_ENVIRONMENT: '/profile/setup/environment',
  PROFILE_SETUP_GOALS: '/profile/setup/goals',
  PROFILE_SETUP_CONDITION: '/profile/setup/condition',
  PROFILE_SETUP_EXPERIENCE: '/profile/setup/experience',
  PROFILE_SETUP_DURATION: '/profile/setup/duration',
  MY: '/app/my',
  MY_PROFILE: '/app/my/profile',
  ROUTINES: '/app/routines',
  ROUTINES_NEW: '/app/routines/new',
  ROUTINES_EDIT: '/app/routines/:id/edit',
  ROUTINES_WORKOUT: '/app/routines/:id/workout/:day',
  CALENDAR: '/app/calendar',
  PROGRESS: '/app/progress',
} as const;

// Muscle group colors (토스 스타일)
export const MUSCLE_GROUP_COLORS = {
  chest: '#ff6b6b',     // 빨강
  back: '#4dabf7',      // 파랑
  shoulders: '#ff922b', // 주황
  arms: '#51cf66',      // 초록
  abs: '#9775fa',       // 보라
  legs: '#8b5a3c',      // 갈색
  full_body: '#868e96', // 회색
} as const;

// App configuration
export const APP_CONFIG = {
  MAX_ROUTINES_PER_USER: 10,
  MIN_AGE: 15,
  MAX_AGE: 80,
  MIN_HEIGHT: 100,
  MAX_HEIGHT: 250,
  MIN_WEIGHT: 30,
  MAX_WEIGHT: 300,
  MIN_WEEKLY_WORKOUTS: 1,
  MAX_WEEKLY_WORKOUTS: 7,
} as const;