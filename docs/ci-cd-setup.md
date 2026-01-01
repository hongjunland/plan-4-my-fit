# CI/CD 파이프라인 설정 가이드

## 📋 개요

이 문서는 Plan 4 My Fit 프로젝트의 CI/CD 파이프라인 설정 방법을 설명합니다.

## 🔧 GitHub Actions 워크플로우

### 1. 메인 CI/CD 파이프라인 (`.github/workflows/ci.yml`)

**트리거:**
- `main`, `develop` 브랜치에 push
- `main` 브랜치로의 Pull Request

**작업 단계:**
1. **Test**: 타입 체크, 린팅, 유닛 테스트, 빌드
2. **E2E**: Playwright를 사용한 End-to-End 테스트
3. **Security**: 보안 감사 및 시크릿 스캔
4. **Deploy Preview**: PR에 대한 프리뷰 배포
5. **Deploy Production**: main 브랜치 프로덕션 배포

### 2. 보안 및 의존성 관리 (`.github/workflows/security.yml`)

**트리거:**
- 매일 오전 2시 (UTC) 자동 실행
- 수동 실행 가능

**작업:**
- 보안 감사 실행
- 의존성 업데이트 확인
- 소스 코드 내 시크릿 스캔
- 자동 의존성 업데이트 PR 생성

### 3. 성능 모니터링 (`.github/workflows/performance.yml`)

**트리거:**
- `main` 브랜치 push 및 PR
- 매주 일요일 오전 3시 (UTC)

**작업:**
- Lighthouse 성능 감사
- 번들 크기 분석
- 성능 회귀 테스트

## 🔐 필수 GitHub Secrets 설정

### Repository Secrets

다음 시크릿들을 GitHub 저장소 설정에서 추가해야 합니다:

```bash
# Supabase 설정
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# OpenAI 설정  
VITE_OPENAI_API_KEY=sk-your-openai-key

# Vercel 배포 설정
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-org-id
VERCEL_PROJECT_ID=your-project-id

# Lighthouse CI (선택사항)
LHCI_GITHUB_APP_TOKEN=your-lhci-token
```

### Vercel 설정 방법

1. **Vercel 토큰 생성:**
   ```bash
   # Vercel CLI 설치
   npm i -g vercel
   
   # 로그인 및 토큰 생성
   vercel login
   vercel --token
   ```

2. **프로젝트 ID 확인:**
   ```bash
   # 프로젝트 루트에서 실행
   vercel link
   cat .vercel/project.json
   ```

3. **조직 ID 확인:**
   - Vercel 대시보드 → Settings → General에서 확인

## 🚀 배포 전략

### 브랜치 전략

```
main (프로덕션)
├── develop (개발)
├── feature/* (기능 개발)
└── hotfix/* (긴급 수정)
```

### 배포 플로우

1. **Feature 개발:**
   ```bash
   git checkout -b feature/new-feature
   # 개발 작업
   git push origin feature/new-feature
   # PR 생성 → 프리뷰 배포 자동 생성
   ```

2. **개발 환경 배포:**
   ```bash
   git checkout develop
   git merge feature/new-feature
   git push origin develop
   # 개발 환경 자동 배포
   ```

3. **프로덕션 배포:**
   ```bash
   git checkout main
   git merge develop
   git push origin main
   # 프로덕션 자동 배포
   ```

## 📊 품질 게이트

### 자동 체크 항목

- ✅ **타입 체크**: TypeScript 컴파일 오류 없음
- ✅ **린팅**: ESLint 규칙 준수
- ✅ **유닛 테스트**: 모든 테스트 통과
- ✅ **E2E 테스트**: 주요 사용자 플로우 검증
- ✅ **보안 스캔**: 시크릿 및 취약점 없음
- ✅ **빌드 성공**: 프로덕션 빌드 완료

### 성능 기준

- **Lighthouse 점수**: 90+ (Performance, Accessibility, Best Practices, SEO)
- **번들 크기**: Main JS < 500KB
- **빌드 시간**: < 3분

## 🔍 모니터링 및 알림

### 실패 시 대응

1. **테스트 실패:**
   - PR 머지 차단
   - 실패 로그 확인 후 수정

2. **보안 이슈:**
   - 즉시 배포 중단
   - 시크릿 로테이션
   - 보안 패치 적용

3. **성능 회귀:**
   - 성능 분석 리포트 확인
   - 번들 크기 최적화
   - 코드 스플리팅 검토

### 알림 설정

GitHub Actions 실패 시 자동으로 다음 알림이 발송됩니다:
- 이메일 알림 (GitHub 설정)
- PR 코멘트 (성능 리포트)
- Slack 알림 (설정 시)

## 🛠️ 로컬 개발 환경에서 CI 테스트

### 전체 CI 파이프라인 로컬 실행

```bash
# 타입 체크
pnpm type-check

# 린팅
pnpm lint

# 유닛 테스트
pnpm test:run

# 빌드
pnpm build

# E2E 테스트
pnpm test:e2e

# 성능 테스트
pnpm perf:analyze
```

### 보안 체크

```bash
# 시크릿 스캔
pnpm security:check

# 의존성 감사
pnpm audit
```

## 📈 성능 최적화 팁

### 번들 크기 최적화

1. **코드 스플리팅:**
   ```typescript
   // 페이지별 lazy loading
   const HomePage = lazy(() => import('./pages/HomePage'));
   ```

2. **의존성 최적화:**
   ```bash
   # 번들 분석
   pnpm build
   npx vite-bundle-analyzer dist
   ```

3. **트리 쉐이킹:**
   ```typescript
   // 필요한 것만 import
   import { Button } from './components/ui/Button';
   // 전체 import 지양
   import * as UI from './components/ui';
   ```

## 🔄 업데이트 및 유지보수

### 정기 작업

- **주간**: 의존성 업데이트 검토
- **월간**: 보안 감사 리포트 검토
- **분기별**: CI/CD 파이프라인 성능 검토

### 워크플로우 업데이트

```bash
# 워크플로우 파일 수정 후
git add .github/workflows/
git commit -m "ci: update workflow configuration"
git push origin main
```

## 🆘 트러블슈팅

### 일반적인 문제들

1. **빌드 실패:**
   ```bash
   # 로컬에서 빌드 테스트
   pnpm clean
   pnpm install
   pnpm build
   ```

2. **E2E 테스트 실패:**
   ```bash
   # 로컬에서 E2E 테스트
   pnpm build
   pnpm preview &
   pnpm test:e2e
   ```

3. **Vercel 배포 실패:**
   - 환경 변수 확인
   - 빌드 로그 검토
   - Vercel 대시보드에서 상세 로그 확인

### 지원 및 문의

- GitHub Issues: 버그 리포트 및 기능 요청
- 개발팀 Slack: 긴급 이슈 및 질문
- 문서 업데이트: PR을 통한 문서 개선

---

## 📚 참고 자료

- [GitHub Actions 문서](https://docs.github.com/en/actions)
- [Vercel 배포 가이드](https://vercel.com/docs)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [Playwright 테스팅](https://playwright.dev/)