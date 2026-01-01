# Project Structure - MVP 구성

## 📁 Directory Structure

```
fitness-routine-planner/
├── .kiro/                  # Kiro AI assistant configuration
│   ├── specs/             # Feature specifications
│   └── steering/          # AI steering rules and guidelines
├── .vscode/               # VS Code settings
├── src/                   # Source code
│   ├── components/        # Reusable UI components
│   │   ├── ui/           # Base UI components (Button, Input, etc.)
│   │   ├── forms/        # Form components
│   │   └── layout/       # Layout components (Header, Nav, etc.)
│   ├── pages/            # Page components
│   │   ├── auth/         # Authentication pages
│   │   ├── profile/      # Profile setup pages
│   │   ├── routines/     # Routine management pages
│   │   ├── calendar/     # Calendar pages
│   │   └── progress/     # Progress tracking pages
│   ├── hooks/            # Custom React hooks
│   ├── stores/           # Zustand stores
│   ├── services/         # API services
│   │   ├── auth.ts       # Authentication service
│   │   ├── routines.ts   # Routine management
│   │   ├── ai.ts         # AI routine generation
│   │   └── supabase.ts   # Supabase client
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   ├── styles/           # Global styles
│   └── constants/        # App constants
├── public/               # Static assets
├── supabase/            # Supabase configuration
│   ├── migrations/      # Database migrations
│   └── seed.sql         # Initial data
├── vercel/              # Vercel configuration
└── docs/                # Documentation
```

## 📋 File Naming Conventions

### Components
- **PascalCase**: `UserProfile.tsx`, `RoutineCard.tsx`
- **Folders**: kebab-case (`user-profile/`, `routine-card/`)

### Pages
- **kebab-case**: `profile-setup.tsx`, `routine-list.tsx`

### Utilities & Services
- **camelCase**: `formatDate.ts`, `apiClient.ts`

### Constants
- **UPPER_SNAKE_CASE**: `API_ENDPOINTS.ts`, `ROUTE_PATHS.ts`

## 🗂️ Component Organization

### UI Components (`src/components/ui/`)
```
ui/
├── Button.tsx           # Base button component
├── Input.tsx            # Base input component
├── Card.tsx             # Base card component
├── Modal.tsx            # Base modal component
├── ProgressBar.tsx      # Progress bar component
├── Tabs.tsx             # Tab component
└── index.ts             # Export all UI components
```

### Feature Components (`src/components/`)
```
components/
├── forms/
│   ├── ProfileSetupForm.tsx
│   ├── RoutineCreationForm.tsx
│   └── LoginForm.tsx
├── layout/
│   ├── Header.tsx
│   ├── BottomNavigation.tsx
│   └── Layout.tsx
├── routine/
│   ├── RoutineCard.tsx
│   ├── ExerciseItem.tsx
│   └── RoutineList.tsx
└── calendar/
    ├── CalendarView.tsx
    ├── DayView.tsx
    ├── WeekView.tsx
    └── MonthView.tsx
```

## 🔧 Configuration Files

### Root Level
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `vite.config.ts` - Vite build configuration
- `vercel.json` - Vercel deployment configuration
- `.env.local` - Environment variables (local)
- `.env.example` - Environment variables template

### Development
- `.eslintrc.js` - ESLint configuration
- `.prettierrc` - Prettier configuration
- `vitest.config.ts` - Test configuration

## 🌍 Environment Variables

```bash
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI
VITE_OPENAI_API_KEY=your_openai_api_key

# App Configuration
VITE_APP_URL=http://localhost:5173
VITE_APP_NAME="헬스 루틴 플래너"
```

## 📱 Responsive Design Structure

### Breakpoints (Tailwind)
- `sm`: 640px+ (Mobile landscape)
- `md`: 768px+ (Tablet)
- `lg`: 1024px+ (Desktop)
- `xl`: 1280px+ (Large desktop)

### Mobile-First Approach
- Default styles for mobile (320px+)
- Progressive enhancement for larger screens
- Max width container: `max-w-md` (448px)

## 🗄️ Database Schema (Supabase)

### Tables
```sql
-- Users (handled by Supabase Auth)
-- Additional user profile data
profiles (
  id uuid references auth.users,
  height integer,
  weight integer,
  goal text,
  fitness_level text,
  created_at timestamp,
  updated_at timestamp
)

-- Routines
routines (
  id uuid primary key,
  user_id uuid references auth.users,
  name text,
  is_active boolean,
  duration_weeks integer,
  workouts_per_week integer,
  split_type text,
  created_at timestamp,
  updated_at timestamp
)

-- Workouts
workouts (
  id uuid primary key,
  routine_id uuid references routines,
  day_number integer,
  name text,
  created_at timestamp
)

-- Exercises
exercises (
  id uuid primary key,
  workout_id uuid references workouts,
  name text,
  sets integer,
  reps text,
  completed boolean default false,
  completed_at timestamp
)
```

## 🚀 Deployment Structure

### Vercel
- **Frontend**: Automatic deployment from Git
- **API Routes**: Serverless functions in `/api`
- **Environment**: Production variables in Vercel dashboard

### Supabase
- **Database**: PostgreSQL with Row Level Security
- **Auth**: Built-in authentication
- **Storage**: File uploads (profile images)

## 📊 Monitoring & Analytics

### File Structure
```
src/
├── analytics/
│   ├── events.ts        # Analytics event definitions
│   ├── tracking.ts      # Tracking utilities
│   └── providers.ts     # Analytics providers
└── monitoring/
    ├── sentry.ts        # Error monitoring
    └── performance.ts   # Performance monitoring
```
