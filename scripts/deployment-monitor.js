#!/usr/bin/env node

/**
 * Deployment monitoring script
 * Monitors deployment status and health checks
 */

import { execSync } from 'child_process';
import https from 'https';
import { readFileSync } from 'fs';

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

class DeploymentMonitor {
  constructor() {
    this.deploymentUrl = process.env.DEPLOYMENT_URL || 'https://plan-4-my-fit.vercel.app';
    this.maxRetries = 10;
    this.retryDelay = 30000; // 30 seconds
  }

  async makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const req = https.request(url, options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => resolve({ 
          statusCode: res.statusCode, 
          headers: res.headers, 
          data 
        }));
      });
      
      req.on('error', reject);
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      
      req.end();
    });
  }

  async checkDeploymentStatus() {
    log.info('Checking deployment status...');
    
    try {
      const response = await this.makeRequest(this.deploymentUrl);
      
      if (response.statusCode === 200) {
        log.success('Deployment is accessible');
        return true;
      } else {
        log.error(`Deployment returned status code: ${response.statusCode}`);
        return false;
      }
    } catch (error) {
      log.error(`Failed to reach deployment: ${error.message}`);
      return false;
    }
  }

  async checkHealthEndpoints() {
    const healthChecks = [
      { name: 'Main Page', path: '/' },
      { name: 'Login Page', path: '/login' },
      { name: 'Static Assets', path: '/assets/index.css' }
    ];

    log.info('Running health checks...');
    
    const results = [];
    
    for (const check of healthChecks) {
      try {
        const url = `${this.deploymentUrl}${check.path}`;
        const response = await this.makeRequest(url);
        
        if (response.statusCode >= 200 && response.statusCode < 400) {
          log.success(`${check.name}: OK (${response.statusCode})`);
          results.push({ ...check, status: 'ok', statusCode: response.statusCode });
        } else {
          log.warning(`${check.name}: Warning (${response.statusCode})`);
          results.push({ ...check, status: 'warning', statusCode: response.statusCode });
        }
      } catch (error) {
        log.error(`${check.name}: Failed - ${error.message}`);
        results.push({ ...check, status: 'error', error: error.message });
      }
    }
    
    return results;
  }

  async checkPerformance() {
    log.info('Checking performance metrics...');
    
    try {
      const startTime = Date.now();
      await this.makeRequest(this.deploymentUrl);
      const responseTime = Date.now() - startTime;
      
      if (responseTime < 2000) {
        log.success(`Response time: ${responseTime}ms (Good)`);
      } else if (responseTime < 5000) {
        log.warning(`Response time: ${responseTime}ms (Acceptable)`);
      } else {
        log.error(`Response time: ${responseTime}ms (Slow)`);
      }
      
      return responseTime;
    } catch (error) {
      log.error(`Performance check failed: ${error.message}`);
      return null;
    }
  }

  async checkSecurityHeaders() {
    log.info('Checking security headers...');
    
    try {
      const response = await this.makeRequest(this.deploymentUrl);
      const headers = response.headers;
      
      const securityHeaders = [
        'x-content-type-options',
        'x-frame-options',
        'x-xss-protection',
        'referrer-policy'
      ];
      
      const results = [];
      
      for (const header of securityHeaders) {
        if (headers[header]) {
          log.success(`${header}: ${headers[header]}`);
          results.push({ header, value: headers[header], status: 'present' });
        } else {
          log.warning(`${header}: Missing`);
          results.push({ header, status: 'missing' });
        }
      }
      
      return results;
    } catch (error) {
      log.error(`Security headers check failed: ${error.message}`);
      return [];
    }
  }

  async waitForDeployment() {
    log.header('Waiting for deployment to be ready...');
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      log.info(`Attempt ${attempt}/${this.maxRetries}`);
      
      const isReady = await this.checkDeploymentStatus();
      
      if (isReady) {
        log.success('Deployment is ready!');
        return true;
      }
      
      if (attempt < this.maxRetries) {
        log.info(`Waiting ${this.retryDelay / 1000} seconds before next attempt...`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      }
    }
    
    log.error('Deployment failed to become ready within timeout period');
    return false;
  }

  async runFullHealthCheck() {
    log.header('Running Full Health Check');
    
    const results = {
      deployment: await this.checkDeploymentStatus(),
      health: await this.checkHealthEndpoints(),
      performance: await this.checkPerformance(),
      security: await this.checkSecurityHeaders(),
      timestamp: new Date().toISOString()
    };
    
    // Summary
    log.header('Health Check Summary');
    
    if (results.deployment) {
      log.success('✅ Deployment is accessible');
    } else {
      log.error('❌ Deployment is not accessible');
    }
    
    const healthOk = results.health.filter(h => h.status === 'ok').length;
    const healthTotal = results.health.length;
    log.info(`🏥 Health checks: ${healthOk}/${healthTotal} passed`);
    
    if (results.performance) {
      const perfStatus = results.performance < 2000 ? '🚀' : results.performance < 5000 ? '⚡' : '🐌';
      log.info(`${perfStatus} Performance: ${results.performance}ms`);
    }
    
    const securityPresent = results.security.filter(s => s.status === 'present').length;
    const securityTotal = results.security.length;
    log.info(`🔒 Security headers: ${securityPresent}/${securityTotal} present`);
    
    return results;
  }

  async monitorContinuous() {
    log.header('Starting Continuous Monitoring');
    log.info('Press Ctrl+C to stop monitoring');
    
    const interval = 60000; // 1 minute
    
    const monitor = async () => {
      try {
        await this.runFullHealthCheck();
      } catch (error) {
        log.error(`Monitoring error: ${error.message}`);
      }
      
      setTimeout(monitor, interval);
    };
    
    await monitor();
  }
}

// CLI interface
const command = process.argv[2];
const monitor = new DeploymentMonitor();

switch (command) {
  case 'wait':
    monitor.waitForDeployment().then(success => {
      process.exit(success ? 0 : 1);
    });
    break;
    
  case 'check':
    monitor.runFullHealthCheck().then(results => {
      const success = results.deployment && 
                     results.health.every(h => h.status !== 'error') &&
                     results.performance < 10000;
      process.exit(success ? 0 : 1);
    });
    break;
    
  case 'monitor':
    monitor.monitorContinuous();
    break;
    
  default:
    console.log(`
Usage: node deployment-monitor.js <command>

Commands:
  wait     - Wait for deployment to become ready
  check    - Run a single health check
  monitor  - Start continuous monitoring

Environment Variables:
  DEPLOYMENT_URL - URL to monitor (default: https://plan-4-my-fit.vercel.app)

Examples:
  node deployment-monitor.js wait
  node deployment-monitor.js check
  DEPLOYMENT_URL=https://my-app.vercel.app node deployment-monitor.js check
    `);
    process.exit(1);
}