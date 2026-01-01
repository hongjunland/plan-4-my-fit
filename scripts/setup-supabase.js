#!/usr/bin/env node

/**
 * Supabase Setup Script
 * 
 * This script helps set up the Supabase project for Plan4MyFit.
 * It checks environment variables and provides setup instructions.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local');
  const envExamplePath = path.join(__dirname, '..', '.env.example');
  
  if (!fs.existsSync(envPath)) {
    log('❌ .env.local file not found', 'red');
    log('📋 Creating .env.local from .env.example...', 'yellow');
    
    if (fs.existsSync(envExamplePath)) {
      fs.copyFileSync(envExamplePath, envPath);
      log('✅ .env.local created successfully', 'green');
      log('⚠️  Please update the Supabase credentials in .env.local', 'yellow');
      return false;
    } else {
      log('❌ .env.example not found', 'red');
      return false;
    }
  }
  
  return true;
}

function checkSupabaseCredentials() {
  try {
    const envPath = path.join(__dirname, '..', '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    const supabaseUrl = envContent.match(/VITE_SUPABASE_URL=(.+)/)?.[1];
    const supabaseKey = envContent.match(/VITE_SUPABASE_ANON_KEY=(.+)/)?.[1];
    
    if (!supabaseUrl || supabaseUrl.includes('your_supabase')) {
      log('❌ VITE_SUPABASE_URL not configured', 'red');
      return false;
    }
    
    if (!supabaseKey || supabaseKey.includes('your_supabase')) {
      log('❌ VITE_SUPABASE_ANON_KEY not configured', 'red');
      return false;
    }
    
    log('✅ Supabase credentials configured', 'green');
    return true;
  } catch (error) {
    log('❌ Error reading .env.local file', 'red');
    return false;
  }
}

function printSetupInstructions() {
  log('\n🚀 Supabase Setup Instructions', 'cyan');
  log('================================', 'cyan');
  
  log('\n1. Create Supabase Project:', 'bright');
  log('   • Go to https://supabase.com');
  log('   • Create a new project');
  log('   • Note your project URL and anon key');
  
  log('\n2. Update Environment Variables:', 'bright');
  log('   • Open .env.local');
  log('   • Replace VITE_SUPABASE_URL with your project URL');
  log('   • Replace VITE_SUPABASE_ANON_KEY with your anon key');
  
  log('\n3. Run Database Migrations:', 'bright');
  log('   • Option A: Use Supabase CLI');
  log('     - npm install -g supabase');
  log('     - supabase login');
  log('     - supabase link --project-ref YOUR_PROJECT_REF');
  log('     - supabase db push');
  log('   • Option B: Manual SQL execution');
  log('     - Open Supabase dashboard > SQL Editor');
  log('     - Run supabase/migrations/001_initial_schema.sql');
  log('     - Run supabase/migrations/002_rls_policies.sql');
  
  log('\n4. Configure Authentication:', 'bright');
  log('   • Go to Authentication > Settings in Supabase dashboard');
  log('   • Enable Google OAuth');
  log('   • Add redirect URLs:');
  log('     - Development: http://localhost:5173');
  log('     - Production: https://your-domain.vercel.app');
  
  log('\n5. Test Connection:', 'bright');
  log('   • Run: pnpm test src/services/__tests__/supabase.test.ts');
  
  log('\n📚 For detailed instructions, see supabase/README.md', 'blue');
}

function main() {
  log('🔧 Plan4MyFit - Supabase Setup', 'magenta');
  log('==============================', 'magenta');
  
  const envExists = checkEnvFile();
  const credentialsConfigured = envExists && checkSupabaseCredentials();
  
  if (credentialsConfigured) {
    log('\n✅ Supabase setup appears to be complete!', 'green');
    log('🧪 Run tests to verify: pnpm test src/services/__tests__/', 'blue');
  } else {
    printSetupInstructions();
  }
  
  log('\n📖 For more details, check supabase/README.md', 'cyan');
}

main();