# Supabase Setup Guide

## 📋 Overview

This directory contains the database schema, migrations, and configuration for the Fitness Routine Planner application using Supabase.

## 🗄️ Database Schema

### Tables

1. **users** - User authentication and basic info
2. **profiles** - Extended user profile information
3. **routines** - Workout routines created by users
4. **workout_logs** - Daily workout completion tracking

### Key Features

- **Row Level Security (RLS)** enabled on all tables
- **UUID primary keys** for all tables
- **Comprehensive constraints** for data validation
- **Indexes** for optimal query performance
- **Triggers** for automatic timestamp updates

## 🚀 Setup Instructions

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note down your project URL and anon key

### 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Run Migrations

#### Option A: Using Supabase CLI (Recommended)

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

#### Option B: Manual SQL Execution

1. Open your Supabase dashboard
2. Go to SQL Editor
3. Run the migration files in order:
   - `001_initial_schema.sql`
   - `002_rls_policies.sql`

### 4. Configure Authentication

1. In Supabase dashboard, go to Authentication > Settings
2. Enable Google OAuth:
   - Add your Google OAuth credentials
   - Set redirect URLs:
     - Development: `http://localhost:5173`
     - Production: `https://your-domain.vercel.app`

### 5. Storage Setup (Optional)

If you plan to use profile images:

1. Go to Storage in Supabase dashboard
2. Create buckets:
   - `profile-images` (public)
   - `exercise-images` (public)

## 📊 Database Schema Details

### Users Table
```sql
users (
  id UUID PRIMARY KEY,
  google_id VARCHAR(255) UNIQUE,
  email VARCHAR(255) UNIQUE,
  name VARCHAR(100),
  profile_picture VARCHAR(500),
  is_first_login BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP
)
```

### Profiles Table
```sql
profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  age INTEGER CHECK (age >= 15 AND age <= 80),
  gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
  height INTEGER CHECK (height >= 100 AND height <= 250),
  weight INTEGER CHECK (weight >= 30 AND weight <= 300),
  workout_location VARCHAR(20),
  weekly_workouts INTEGER CHECK (weekly_workouts >= 1 AND weekly_workouts <= 7),
  goal VARCHAR(20),
  focus VARCHAR(20),
  fitness_level VARCHAR(20),
  uncomfortable_areas JSONB DEFAULT '[]',
  experience_level VARCHAR(20),
  exercise_history JSONB DEFAULT '[]',
  plan_duration INTEGER CHECK (plan_duration IN (4, 8, 12, 16)),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### Routines Table
```sql
routines (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  name VARCHAR(100),
  settings JSONB,
  workouts JSONB,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### Workout Logs Table
```sql
workout_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  routine_id UUID REFERENCES routines(id),
  workout_id VARCHAR(50),
  date DATE,
  completed_exercises JSONB DEFAULT '[]',
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP,
  UNIQUE(user_id, routine_id, workout_id, date)
)
```

## 🔒 Security

### Row Level Security Policies

All tables have RLS enabled with policies ensuring:
- Users can only access their own data
- Proper authentication is required for all operations
- Data isolation between users

### Data Validation

- Comprehensive CHECK constraints on all tables
- Foreign key relationships maintain data integrity
- JSON schema validation for complex fields

## 🧪 Testing

### Sample Queries

```sql
-- Get user profile
SELECT * FROM profiles WHERE user_id = auth.uid();

-- Get active routine
SELECT * FROM routines WHERE user_id = auth.uid() AND is_active = true;

-- Get today's workout log
SELECT * FROM workout_logs 
WHERE user_id = auth.uid() AND date = CURRENT_DATE;
```

## 📈 Performance

### Indexes Created

- `idx_users_google_id` - Fast Google ID lookups
- `idx_users_email` - Fast email lookups
- `idx_profiles_user_id` - Fast profile queries
- `idx_routines_user_id` - Fast routine queries
- `idx_routines_is_active` - Fast active routine queries
- `idx_workout_logs_user_id` - Fast workout log queries
- `idx_workout_logs_date` - Fast date-based queries
- `idx_workout_logs_routine_id` - Fast routine-based queries

## 🔄 Migrations

### Adding New Migrations

1. Create a new file: `003_your_migration_name.sql`
2. Add your SQL changes
3. Run `supabase db push` or execute manually

### Migration Best Practices

- Always use transactions for complex changes
- Test migrations on development first
- Include rollback instructions in comments
- Use descriptive migration names

## 🚨 Troubleshooting

### Common Issues

1. **RLS Policies**: Make sure auth.uid() matches user_id
2. **Constraints**: Check data types and constraints match your application
3. **Indexes**: Monitor query performance and add indexes as needed
4. **JSON Fields**: Validate JSON structure in application code

### Useful Commands

```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'your_table';

-- Check constraints
SELECT * FROM information_schema.check_constraints;

-- Check indexes
SELECT * FROM pg_indexes WHERE tablename = 'your_table';
```

## 📚 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)