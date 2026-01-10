# Requirements Document

## Introduction

Vercel에 Plan4MyFit 앱을 배포하기 위한 요구사항입니다. GitHub 연동 없이 CLI를 통해 직접 배포하며, 환경 변수 설정과 프로덕션 배포를 포함합니다.

## Glossary

- **Vercel_CLI**: Vercel 플랫폼과 상호작용하는 커맨드라인 도구
- **Environment_Variables**: 앱 실행에 필요한 설정값 (API 키, URL 등)
- **Production_Deployment**: 실제 사용자가 접근하는 프로덕션 환경 배포

## Requirements

### Requirement 1: Vercel 프로젝트 초기화

**User Story:** As a developer, I want to initialize a Vercel project, so that I can deploy my app to Vercel platform.

#### Acceptance Criteria

1. WHEN the developer runs vercel init THEN the Vercel_CLI SHALL create a new project linked to the current directory
2. WHEN the project is initialized THEN the Vercel_CLI SHALL generate a `.vercel` directory with project configuration

### Requirement 2: 환경 변수 설정

**User Story:** As a developer, I want to configure environment variables, so that my app can access required API keys and configurations in production.

#### Acceptance Criteria

1. WHEN environment variables are added THEN the Vercel_CLI SHALL store them securely for production use
2. THE Environment_Variables SHALL include VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_OPENAI_API_KEY, and VITE_APP_URL

### Requirement 3: 프로덕션 배포

**User Story:** As a developer, I want to deploy to production, so that users can access the live application.

#### Acceptance Criteria

1. WHEN the developer runs production deploy THEN the Vercel_CLI SHALL build and deploy the app to production
2. WHEN deployment completes THEN the Vercel_CLI SHALL return a production URL
3. WHEN the production build fails THEN the Vercel_CLI SHALL display error logs for debugging

### Requirement 4: OAuth 리다이렉트 설정

**User Story:** As a developer, I want to configure OAuth redirect URLs, so that users can login successfully in production.

#### Acceptance Criteria

1. WHEN configuring Supabase Authentication THEN the Developer SHALL set Site URL to the production URL
2. WHEN configuring Supabase Authentication THEN the Developer SHALL add production callback URL to Redirect URLs
3. WHEN a user logs in THEN the System SHALL redirect to the production URL (not localhost)

### Requirement 5: 성능 최적화

**User Story:** As a developer, I want to optimize the production build, so that users have a fast experience.

#### Acceptance Criteria

1. WHEN the app makes API calls THEN the System SHALL use stable dependencies to prevent excessive calls
2. WHEN using Vercel free plan THEN the System SHALL NOT include Analytics or SpeedInsights components
