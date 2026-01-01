# 모니터링 설정 가이드

이 문서는 Plan4MyFit 앱의 모니터링 시스템 설정 방법을 설명합니다.

## 📊 모니터링 구성 요소

### 1. Sentry (에러 모니터링)
- **실시간 에러 추적**: JavaScript 에러, API 에러, 성능 이슈
- **세션 리플레이**: 에러 발생 시 사용자 행동 재현
- **성능 모니터링**: 트랜잭션 추적, 느린 쿼리 감지
- **알림**: 중요한 에러 발생 시 즉시 알림

### 2. Vercel Analytics
- **페이지 뷰 추적**: 실시간 방문자 통계
- **사용자 행동 분석**: 클릭, 스크롤, 체류 시간
- **전환율 추적**: 회원가입, 루틴 생성 등 주요 액션
- **A/B 테스트**: 기능 개선을 위한 실험

### 3. Vercel Speed Insights
- **Core Web Vitals**: LCP, FID, CLS 자동 측정
- **실제 사용자 성능**: RUM (Real User Monitoring)
- **성능 점수**: Lighthouse 기반 성능 평가
- **최적화 제안**: 성능 개선 권장사항

### 4. 커스텀 성능 대시보드
- **실시간 메트릭**: 메모리 사용량, 네트워크 요청
- **컴포넌트 성능**: React 컴포넌트 렌더링 시간
- **API 응답 시간**: Supabase, OpenAI API 성능
- **사용자 인터랙션**: 버튼 클릭, 폼 제출 시간

## 🔧 설정 방법

### 1. Sentry 설정

#### 1.1 Sentry 프로젝트 생성
```bash
# Sentry 계정 생성 후 새 프로젝트 생성
# Platform: React
# Framework: Vite
```

#### 1.2 환경 변수 설정
```bash
# .env.local
VITE_SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_ORG=your-org-name
SENTRY_PROJECT=your-project-name
SENTRY_AUTH_TOKEN=your-auth-token
```

#### 1.3 Sentry 대시보드 설정
- **알림 규칙**: 에러 발생 시 이메일/Slack 알림
- **릴리즈 추적**: 배포별 에러 추적
- **성능 임계값**: 응답 시간 기준 설정

### 2. Vercel Analytics 설정

#### 2.1 Vercel 프로젝트에서 Analytics 활성화
```bash
# Vercel 대시보드에서
# Project Settings > Analytics > Enable
```

#### 2.2 커스텀 이벤트 추가
```typescript
// 예시: 루틴 생성 추적
import { track } from '@vercel/analytics';

track('routine_created', {
  duration: '4weeks',
  split_type: 'upper_lower',
  user_level: 'beginner'
});
```

### 3. Speed Insights 설정

#### 3.1 자동 활성화
- Vercel 배포 시 자동으로 활성화됨
- 별도 설정 불필요

#### 3.2 커스텀 메트릭 추가
```typescript
// 예시: AI 루틴 생성 시간 측정
import { track } from '@vercel/speed-insights';

const startTime = performance.now();
await generateRoutine();
const duration = performance.now() - startTime;

track('ai_routine_generation', duration);
```

## 📈 모니터링 대시보드

### 개발 환경
- **성능 대시보드**: 우하단 "📊 성능" 버튼 클릭
- **실시간 메트릭**: Core Web Vitals, 메모리 사용량
- **권장사항**: 성능 최적화 제안

### 프로덕션 환경
- **Sentry 대시보드**: https://sentry.io/organizations/your-org/
- **Vercel Analytics**: https://vercel.com/your-team/project/analytics
- **Speed Insights**: https://vercel.com/your-team/project/speed-insights

## 🚨 알림 설정

### Sentry 알림
```yaml
# .sentry/rules.yml
rules:
  - name: "High Error Rate"
    conditions:
      - error_rate: "> 5%"
      - time_window: "1h"
    actions:
      - email: "dev@yourcompany.com"
      - slack: "#alerts"

  - name: "Performance Degradation"
    conditions:
      - transaction_duration: "> 3s"
      - percentile: "p95"
    actions:
      - email: "dev@yourcompany.com"
```

### Vercel 알림
- **배포 실패**: 자동 이메일 알림
- **성능 저하**: Core Web Vitals 임계값 초과 시
- **트래픽 급증**: 비정상적인 트래픽 패턴 감지

## 📊 주요 메트릭

### 성능 메트릭
- **LCP (Largest Contentful Paint)**: < 2.5초
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1
- **메모리 사용량**: < 50MB
- **API 응답 시간**: < 1초

### 비즈니스 메트릭
- **회원가입률**: 방문자 대비 가입률
- **루틴 생성률**: 가입 후 루틴 생성 비율
- **운동 완료율**: 생성된 루틴의 완료 비율
- **재방문율**: 7일/30일 재방문 비율

### 에러 메트릭
- **에러율**: < 1%
- **크래시율**: < 0.1%
- **API 에러율**: < 2%
- **평균 해결 시간**: < 24시간

## 🔍 문제 해결

### 일반적인 문제

#### 1. Sentry DSN 설정 오류
```bash
# 증상: Sentry 이벤트가 전송되지 않음
# 해결: DSN 형식 확인
VITE_SENTRY_DSN=https://key@sentry.io/project-id
```

#### 2. 성능 대시보드가 표시되지 않음
```bash
# 증상: 개발 환경에서 성능 버튼이 보이지 않음
# 해결: 개발 모드 확인
NODE_ENV=development npm run dev
```

#### 3. Analytics 이벤트가 추적되지 않음
```bash
# 증상: Vercel Analytics에 커스텀 이벤트가 나타나지 않음
# 해결: 이벤트 이름과 속성 확인
track('event_name', { property: 'value' });
```

### 성능 최적화

#### 1. 번들 크기 최적화
```bash
# 번들 분석
npm run build
npx vite-bundle-analyzer dist
```

#### 2. 이미지 최적화
```bash
# WebP 변환
npm install -g @squoosh/cli
squoosh-cli --webp auto src/assets/images/*.png
```

#### 3. 코드 스플리팅
```typescript
// 페이지별 lazy loading
const RoutinesPage = lazy(() => import('./pages/RoutinesPage'));
```

## 📋 체크리스트

### 배포 전 확인사항
- [ ] Sentry DSN 설정 완료
- [ ] 환경 변수 프로덕션 설정 완료
- [ ] 성능 임계값 설정 완료
- [ ] 알림 규칙 설정 완료
- [ ] 소스맵 업로드 설정 완료

### 정기 점검사항 (주간)
- [ ] 에러율 확인 (< 1%)
- [ ] 성능 메트릭 확인 (Core Web Vitals)
- [ ] 메모리 사용량 확인 (< 50MB)
- [ ] API 응답 시간 확인 (< 1초)
- [ ] 사용자 피드백 확인

### 월간 리뷰사항
- [ ] 성능 트렌드 분석
- [ ] 에러 패턴 분석
- [ ] 사용자 행동 분석
- [ ] 최적화 기회 식별
- [ ] 모니터링 설정 개선

## 🔗 유용한 링크

- [Sentry React 가이드](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Vercel Analytics 문서](https://vercel.com/docs/analytics)
- [Core Web Vitals 가이드](https://web.dev/vitals/)
- [React 성능 최적화](https://react.dev/learn/render-and-commit)
- [Vite 성능 가이드](https://vitejs.dev/guide/performance.html)