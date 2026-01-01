#!/usr/bin/env node

/**
 * Pre-deployment checklist script
 * Runs comprehensive checks before deployment
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.bold}${colors.blue}🚀 ${msg}${colors.reset}\n`)
};

class PreDeployChecker {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  async runCheck(name, checkFn) {
    try {
      log.info(`Checking ${name}...`);
      await checkFn();
      log.success(`${name} passed`);
    } catch (error) {
      log.error(`${name} failed: ${error.message}`);
      this.errors.push(`${name}: ${error.message}`);
    }
  }

  async runWarningCheck(name, checkFn) {
    try {
      log.info(`Checking ${name}...`);
      await checkFn();
      log.success(`${name} passed`);
    } catch (error) {
      log.warning(`${name} warning: ${error.message}`);
      this.warnings.push(`${name}: ${error.message}`);
    }
  }

  exec(command) {
    try {
      return execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    } catch (error) {
      throw new Error(`Command failed: ${command}\n${error.message}`);
    }
  }

  // Environment checks
  async checkEnvironmentVariables() {
    const requiredEnvVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
      'VITE_OPENAI_API_KEY'
    ];

    const envFile = '.env.local';
    if (!existsSync(envFile)) {
      throw new Error(`Environment file ${envFile} not found`);
    }

    const envContent = readFileSync(envFile, 'utf8');
    const missingVars = requiredEnvVars.filter(varName => 
      !envContent.includes(varName) || envContent.includes(`${varName}=your_`)
    );

    if (missingVars.length > 0) {
      throw new Error(`Missing or placeholder environment variables: ${missingVars.join(', ')}`);
    }
  }

  // Security checks
  async checkForSecrets() {
    const sensitivePatterns = [
      { pattern: 'sk-[a-zA-Z0-9]{20,}', name: 'OpenAI API keys' },
      { pattern: 'https://[a-zA-Z0-9]{8,}\\.supabase\\.co', name: 'Supabase URLs' },
      { pattern: 'eyJ[A-Za-z0-9-_=]{10,}\\.', name: 'JWT tokens' }
    ];

    for (const { pattern, name } of sensitivePatterns) {
      try {
        this.exec(`find src -name "*.ts" -o -name "*.tsx" | xargs grep -l "${pattern}" || true`);
        const result = this.exec(`find src -name "*.ts" -o -name "*.tsx" | xargs grep -l "${pattern}" | wc -l`).trim();
        if (parseInt(result) > 0) {
          throw new Error(`Found ${name} in source code`);
        }
      } catch (error) {
        // If grep fails, it means no matches found, which is good
        if (!error.message.includes('Command failed')) {
          throw error;
        }
      }
    }
  }

  // Code quality checks
  async checkTypeScript() {
    this.exec('pnpm type-check');
  }

  async checkLinting() {
    this.exec('pnpm lint');
  }

  async checkFormatting() {
    try {
      this.exec('pnpm format:check');
    } catch (error) {
      throw new Error('Code formatting issues found. Run "pnpm format" to fix.');
    }
  }

  // Test checks
  async checkUnitTests() {
    this.exec('pnpm test:run');
  }

  async checkE2ETests() {
    // Only run E2E tests if Playwright is properly set up
    try {
      this.exec('pnpm test:e2e --reporter=list');
    } catch (error) {
      throw new Error('E2E tests failed. Check test configuration and browser setup.');
    }
  }

  // Build checks
  async checkBuild() {
    this.exec('pnpm build');
    
    // Check if build artifacts exist
    if (!existsSync('dist/index.html')) {
      throw new Error('Build artifacts not found');
    }
  }

  async checkBundleSize() {
    if (!existsSync('dist')) {
      throw new Error('Build dist folder not found. Run build first.');
    }

    // Check main JS bundle size
    const jsFiles = this.exec('find dist/assets -name "index-*.js" -exec du -k {} \\;').trim();
    if (jsFiles) {
      const sizeKB = parseInt(jsFiles.split('\t')[0]);
      if (sizeKB > 500) {
        throw new Error(`Main JS bundle too large: ${sizeKB}KB (limit: 500KB)`);
      }
    }
  }

  // Dependency checks
  async checkDependencies() {
    try {
      this.exec('pnpm audit --audit-level=high');
    } catch (error) {
      throw new Error('High severity vulnerabilities found in dependencies');
    }
  }

  async checkOutdatedDependencies() {
    const outdated = this.exec('pnpm outdated --format=json || echo "[]"');
    const outdatedPackages = JSON.parse(outdated);
    
    if (Object.keys(outdatedPackages).length > 0) {
      const majorUpdates = Object.entries(outdatedPackages)
        .filter(([, info]) => info.wanted !== info.latest)
        .map(([name]) => name);
      
      if (majorUpdates.length > 0) {
        throw new Error(`Major version updates available: ${majorUpdates.join(', ')}`);
      }
    }
  }

  // Performance checks
  async checkLighthouse() {
    try {
      // Start preview server
      const previewProcess = this.exec('pnpm preview &');
      
      // Wait for server to start
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Run lighthouse
      this.exec('pnpm lighthouse:ci');
      
      // Kill preview server
      this.exec('pkill -f "vite preview" || true');
    } catch (error) {
      throw new Error('Lighthouse performance check failed');
    }
  }

  // Git checks
  async checkGitStatus() {
    const status = this.exec('git status --porcelain').trim();
    if (status) {
      throw new Error('Uncommitted changes found. Commit or stash changes before deployment.');
    }
  }

  async checkGitBranch() {
    const branch = this.exec('git branch --show-current').trim();
    if (branch !== 'main' && branch !== 'develop') {
      throw new Error(`Deployment should be from main or develop branch, currently on: ${branch}`);
    }
  }

  // Main execution
  async run() {
    log.header('Pre-Deployment Checklist');

    // Critical checks (must pass)
    await this.runCheck('Environment Variables', () => this.checkEnvironmentVariables());
    await this.runCheck('Security Scan', () => this.checkForSecrets());
    await this.runCheck('TypeScript', () => this.checkTypeScript());
    await this.runCheck('Linting', () => this.checkLinting());
    await this.runCheck('Unit Tests', () => this.checkUnitTests());
    await this.runCheck('Build', () => this.checkBuild());
    await this.runCheck('Git Status', () => this.checkGitStatus());
    await this.runCheck('Git Branch', () => this.checkGitBranch());

    // Warning checks (should pass but not critical)
    await this.runWarningCheck('Code Formatting', () => this.checkFormatting());
    await this.runWarningCheck('Bundle Size', () => this.checkBundleSize());
    await this.runWarningCheck('Dependencies Security', () => this.checkDependencies());
    await this.runWarningCheck('Outdated Dependencies', () => this.checkOutdatedDependencies());
    
    // Optional checks (may fail in CI environment)
    if (process.env.CI !== 'true') {
      await this.runWarningCheck('E2E Tests', () => this.checkE2ETests());
      await this.runWarningCheck('Lighthouse Performance', () => this.checkLighthouse());
    }

    // Summary
    log.header('Summary');
    
    if (this.errors.length > 0) {
      log.error(`${this.errors.length} critical issues found:`);
      this.errors.forEach(error => console.log(`  - ${error}`));
      console.log('\n❌ Deployment blocked. Fix critical issues before deploying.');
      process.exit(1);
    }

    if (this.warnings.length > 0) {
      log.warning(`${this.warnings.length} warnings found:`);
      this.warnings.forEach(warning => console.log(`  - ${warning}`));
      console.log('\n⚠️  Consider fixing warnings before deployment.');
    }

    log.success('All critical checks passed! Ready for deployment 🚀');
    
    if (this.warnings.length === 0) {
      log.success('No warnings found. Excellent! 🎉');
    }
  }
}

// Run the checker
const checker = new PreDeployChecker();
checker.run().catch(error => {
  log.error(`Pre-deployment check failed: ${error.message}`);
  process.exit(1);
});