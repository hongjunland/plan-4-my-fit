# Production Deployment Guide

## 🚀 Vercel 배포 가이드

### 1. 환경 변수 설정

Vercel 대시보드에서 다음 환경 변수를 설정하세요:

#### Production Environment Variables
```bash
# Supabase (Production)
VITE_SUPABASE_URL=https://your-production-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key

# OpenAI (Production)
VITE_OPENAI_API_KEY=your-production-openai-key

# App Configuration
VITE_APP_URL=https://your-domain.com
VITE_APP_NAME="Plan4MyFit"
VITE_APP_VERSION=1.0.0
NODE_ENV=production

# Optional: Analytics & Monitoring
VITE_SENTRY_DSN=your-sentry-dsn
VITE_GA_TRACKING_ID=your-ga-id

# Feature Flags
VITE_ENABLE_PWA=true
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_PERFORMANCE_MONITORING=true
```

### 2. Vercel 프로젝트 설정

1. **GitHub 연동**
   ```bash
   # GitHub 리포지토리와 연동
   vercel --prod
   ```

2. **빌드 설정**
   - Build Command: `pnpm build:prod`
   - Output Directory: `dist`
   - Install Command: `pnpm install --frozen-lockfile`
   - Node.js Version: `18.x`

3. **도메인 설정**
   - Vercel 대시보드에서 커스텀 도메인 연결
   - DNS 설정 (A 레코드 또는 CNAME)

### 3. 보안 설정

#### 환경 변수 보안
- ✅ 모든 API 키는 Vercel 환경 변수에서만 설정
- ✅ `.env.local` 파일은 절대 커밋하지 않음
- ✅ 프로덕션 환경에서 console.log 자동 제거
- ✅ 민감한 데이터 로깅 방지

#### 헤더 보안
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options", 
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### 4. 성능 최적화

#### 빌드 최적화
- ✅ 코드 스플리팅 (vendor, ui, utils 청크)
- ✅ 이미지 최적화 (WebP, 압축)
- ✅ CSS 최적화 (Tailwind purge)
- ✅ JavaScript 압축 (Terser)

#### 캐싱 전략
- ✅ 정적 자산 캐싱 (1년)
- ✅ API 응답 캐싱 (적절한 TTL)
- ✅ PWA 캐싱 (오프라인 지원)

### 5. 모니터링 설정

#### 에러 모니터링
```typescript
// Sentry 설정 (선택사항)
import * as Sentry from "@sentry/react";

if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: "production"
  });
}
```

#### 성능 모니터링
- Vercel Analytics 활성화
- Lighthouse CI 설정
- Core Web Vitals 추적

### 6. 배포 체크리스트

#### 배포 전 확인사항
- [ ] 모든 테스트 통과 (`pnpm test:run`)
- [ ] 타입 체크 통과 (`pnpm type-check`)
- [ ] 린트 체크 통과 (`pnpm lint`)
- [ ] 빌드 성공 (`pnpm build:prod`)
- [ ] 환경 변수 설정 완료
- [ ] 도메인 설정 완료

#### 배포 후 확인사항
- [ ] 사이트 정상 접속
- [ ] Google OAuth 로그인 테스트
- [ ] AI 루틴 생성 테스트
- [ ] 모바일 반응형 확인
- [ ] PWA 설치 테스트
- [ ] 성능 점수 확인 (Lighthouse)

### 7. 롤백 계획

#### 문제 발생 시 대응
1. **즉시 롤백**
   ```bash
   # 이전 배포로 롤백
   vercel rollback
   ```

2. **핫픽스 배포**
   ```bash
   # 긴급 수정 후 배포
   git checkout -b hotfix/critical-fix
   # 수정 작업
   git commit -m "hotfix: critical issue"
   git push origin hotfix/critical-fix
   # Vercel에서 자동 배포
   ```

### 8. 비용 최적화

#### Vercel 사용량 모니터링
- 대역폭 사용량 확인
- 함수 실행 시간 모니터링
- 빌드 시간 최적화

#### 외부 서비스 비용
- OpenAI API 사용량 모니터링
- Supabase 데이터베이스 사용량 확인
- 필요시 캐싱으로 API 호출 최적화

## 🔧 트러블슈팅

### 일반적인 문제들

#### 1. 빌드 실패
```bash
# 의존성 문제
pnpm install --frozen-lockfile

# 타입 에러
pnpm type-check

# 메모리 부족
NODE_OPTIONS="--max-old-space-size=4096" pnpm build
```

#### 2. 환경 변수 문제
- Vercel 대시보드에서 환경 변수 재확인
- 변수명 오타 확인 (`VITE_` 접두사 필수)
- 재배포 필요 (환경 변수 변경 후)

#### 3. OAuth 문제
- Supabase 리다이렉트 URL 확인
- Google OAuth 설정 확인
- CORS 설정 확인

#### 4. 성능 문제
- 번들 크기 분석 (`pnpm build && pnpm preview`)
- 이미지 최적화 확인
- 불필요한 의존성 제거

## 📞 지원

문제가 발생하면 다음을 확인하세요:
1. Vercel 배포 로그
2. 브라우저 개발자 도구 콘솔
3. Supabase 대시보드 로그
4. 이 가이드의 체크리스트

---

**중요**: 프로덕션 배포 전에 반드시 스테이징 환경에서 테스트하세요!