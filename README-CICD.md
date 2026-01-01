# CI/CD Pipeline - Plan 4 My Fit

## 🚀 Overview

This project uses a comprehensive CI/CD pipeline built with GitHub Actions and Vercel for automated testing, security scanning, and deployment.

## 📋 Pipeline Features

### ✅ Automated Testing
- **Unit Tests**: Vitest with React Testing Library
- **E2E Tests**: Playwright for end-to-end testing
- **Type Checking**: TypeScript compilation
- **Linting**: ESLint with custom rules
- **Code Formatting**: Prettier validation

### 🔒 Security & Quality
- **Security Scanning**: Automated detection of API keys and secrets
- **Dependency Auditing**: npm audit for vulnerabilities
- **Performance Monitoring**: Lighthouse CI integration
- **Bundle Analysis**: Automated bundle size tracking

### 🚀 Deployment Strategy
- **Preview Deployments**: Automatic preview for all PRs
- **Production Deployment**: Automatic deployment from main branch
- **Health Monitoring**: Post-deployment health checks
- **Rollback Support**: Easy rollback via Vercel dashboard

## 🔧 Workflow Files

### 1. Main CI/CD Pipeline (`.github/workflows/ci.yml`)
- **Triggers**: Push to main/develop, PRs to main
- **Jobs**: Test → E2E → Security → Deploy
- **Features**: Parallel execution, artifact uploads, deployment monitoring

### 2. Security & Dependencies (`.github/workflows/security.yml`)
- **Triggers**: Daily schedule, manual dispatch
- **Jobs**: Security audit, dependency updates
- **Features**: Automated PR creation for updates

### 3. Performance Monitoring (`.github/workflows/performance.yml`)
- **Triggers**: Push to main, PRs, weekly schedule
- **Jobs**: Lighthouse audit, bundle analysis
- **Features**: Performance regression detection

## 🛠️ Setup Instructions

### 1. GitHub Secrets Configuration

Add these secrets to your GitHub repository:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# OpenAI Configuration
VITE_OPENAI_API_KEY=sk-your-openai-key

# Vercel Configuration
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-org-id
VERCEL_PROJECT_ID=your-project-id

# Optional: Lighthouse CI
LHCI_GITHUB_APP_TOKEN=your-lhci-token
```

### 2. Vercel Setup

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Link Project**:
   ```bash
   vercel link
   ```

3. **Get Project Details**:
   ```bash
   cat .vercel/project.json
   ```

### 3. Local Development

Run the full CI pipeline locally:

```bash
# Pre-deployment checks
pnpm pre-deploy

# Individual checks
pnpm type-check
pnpm lint
pnpm test:run
pnpm build
pnpm test:e2e

# Security checks
pnpm security:check
pnpm audit

# Performance analysis
pnpm perf:analyze
```

## 📊 Quality Gates

### Automated Checks
- ✅ TypeScript compilation
- ✅ ESLint rules compliance
- ✅ Unit test coverage
- ✅ E2E test scenarios
- ✅ Security vulnerability scan
- ✅ Bundle size limits
- ✅ Performance benchmarks

### Performance Thresholds
- **Lighthouse Score**: 90+ (all categories)
- **Bundle Size**: Main JS < 500KB
- **Build Time**: < 3 minutes
- **Response Time**: < 2 seconds

## 🔄 Deployment Process

### Feature Development
```bash
# 1. Create feature branch
git checkout -b feature/new-feature

# 2. Develop and test
pnpm dev
pnpm test

# 3. Push and create PR
git push origin feature/new-feature
# → Triggers preview deployment

# 4. Review and merge
# → Triggers production deployment
```

### Branch Strategy
```
main (production)
├── develop (staging)
├── feature/* (features)
└── hotfix/* (urgent fixes)
```

## 📈 Monitoring & Alerts

### Deployment Monitoring
- **Health Checks**: Automated endpoint testing
- **Performance Tracking**: Response time monitoring
- **Security Headers**: Security configuration validation
- **Error Tracking**: Automatic error detection

### Notification Channels
- **GitHub**: PR comments, status checks
- **Email**: GitHub notifications
- **Slack**: Custom webhook integration (optional)

## 🛠️ Scripts Reference

### Deployment Scripts
```bash
# Safe deployment with pre-checks
pnpm deploy:safe

# Monitor deployment health
pnpm deploy:monitor

# Wait for deployment readiness
pnpm deploy:wait

# Continuous monitoring
pnpm deploy:watch
```

### Development Scripts
```bash
# Development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Run all tests
pnpm test:run

# E2E testing
pnpm test:e2e
```

### Quality Assurance
```bash
# Type checking
pnpm type-check

# Linting
pnpm lint
pnpm lint:fix

# Code formatting
pnpm format
pnpm format:check

# Security scanning
pnpm security:check

# Performance analysis
pnpm perf:analyze
```

## 🔍 Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Clear cache and rebuild
   pnpm clean
   pnpm install
   pnpm build
   ```

2. **Test Failures**
   ```bash
   # Run tests locally
   pnpm test:run
   pnpm test:e2e
   ```

3. **Deployment Issues**
   ```bash
   # Check deployment status
   pnpm deploy:monitor
   
   # View Vercel logs
   vercel logs
   ```

4. **Security Alerts**
   ```bash
   # Audit dependencies
   pnpm audit
   
   # Check for secrets
   pnpm security:check
   ```

### Debug Commands
```bash
# Verbose build output
DEBUG=* pnpm build

# Detailed test output
pnpm test:run --reporter=verbose

# E2E test debugging
pnpm test:e2e --debug
```

## 📚 Best Practices

### Code Quality
- Write comprehensive tests for new features
- Follow TypeScript strict mode
- Use ESLint and Prettier consistently
- Document complex logic

### Security
- Never commit API keys or secrets
- Use environment variables for configuration
- Regularly update dependencies
- Monitor security advisories

### Performance
- Optimize bundle size with code splitting
- Use React.lazy for route-based splitting
- Implement proper caching strategies
- Monitor Core Web Vitals

### Deployment
- Test thoroughly in preview environments
- Use feature flags for gradual rollouts
- Monitor deployment health
- Have rollback procedures ready

## 🆘 Support

### Getting Help
- **GitHub Issues**: Bug reports and feature requests
- **Discussions**: General questions and ideas
- **Wiki**: Detailed documentation and guides

### Emergency Procedures
1. **Production Issues**: Immediate rollback via Vercel
2. **Security Incidents**: Follow SECURITY.md procedures
3. **Performance Problems**: Check monitoring dashboards

---

## 📈 Metrics & Analytics

### Key Performance Indicators
- **Deployment Success Rate**: 99%+
- **Build Time**: < 3 minutes
- **Test Coverage**: 85%+
- **Security Vulnerabilities**: 0 high/critical

### Monitoring Dashboards
- **Vercel Analytics**: Performance and usage
- **GitHub Insights**: Development metrics
- **Lighthouse CI**: Performance trends

---

*For detailed setup instructions, see [docs/ci-cd-setup.md](docs/ci-cd-setup.md)*