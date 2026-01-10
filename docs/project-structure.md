# 프로젝트 구조

## 📁 전체 디렉토리 구조

```
plan-4-my-fit/
├── .github/                 # GitHub Actions 워크플로우
│   └── workflows/
│       ├── ci.yml          # CI/CD 파이프라인
│       ├── security.yml    # 보안 검사
│       └── performance.yml # 성능 모니터링
├── .husky/                 # Git hooks
├── .kiro/                  # Kiro AI 설정
│   ├── specs/             # 기능 명세서
│   └── steering/          # AI 가이드라인
├── .vscode/               # VS Code 설정
├── docs/                  # 문서
├── e2e/                   # E2E 테스트
├── public/                # 정적 자산
├── scripts/               # 유틸리티 스크립트
├── src/                   # 소스 코드
├── supabase/              # Supabase 설정
└── test-results/          # 테스트 결과
```

---

## 🎯 src/ 디렉토리 상세

### 📦 components/ - 컴포넌트
```
src/components/
├── ui/                    # 기본 UI 컴포넌트
│   ├── Button.tsx         # 버튼 컴포넌트
│   ├── Input.tsx          # 입력 필드
│   ├── Card.tsx           # 카드 레이아웃
│   ├── Modal.tsx          # 모달 다이얼로그
│   ├── ProgressBar.tsx    # 진행률 바
│   ├── Tabs.tsx           # 탭 컴포넌트
│   └── index.ts           # 통합 export
├── forms/                 # 폼 컴포넌트
│   ├── LoginForm.tsx      # 로그인 폼
│   ├── ProfileSetupForm.tsx # 프로필 설정 폼
│   ├── RoutineCreationForm.tsx # 루틴 생성 폼
│   ├── ProgressIndicator.tsx # 단계 진행률
│   └── steps/             # 프로필 설정 단계
│       ├── BasicInfoStep.tsx
│       ├── ExperienceStep.tsx
│       ├── GoalsStep.tsx
│       ├── PhysicalConditionStep.tsx
│       ├── PlanDurationStep.tsx
│       └── WorkoutEnvironmentStep.tsx
├── layout/                # 레이아웃 컴포넌트
│   ├── Header.tsx         # 상단 헤더
│   ├── BottomNavigation.tsx # 하단 네비게이션
│   └── Layout.tsx         # 메인 레이아웃
├── calendar/              # 캘린더 컴포넌트
│   ├── CalendarView.tsx   # 캘린더 메인
│   ├── TodayView.tsx      # 오늘 뷰
│   ├── WeekView.tsx       # 주간 뷰
│   ├── MonthView.tsx      # 월간 뷰
│   └── index.ts
├── routine/               # 루틴 관련 컴포넌트
│   ├── RoutineCard.tsx    # 루틴 카드
│   ├── RoutineList.tsx    # 루틴 목록
│   ├── ExerciseItem.tsx   # 운동 항목
│   └── index.ts
├── progress/              # 진행률 컴포넌트
│   ├── ProgressStats.tsx # 진행률 통계
│   ├── MiniCalendar.tsx   # 미니 캘린더
│   ├── MuscleGroupChart.tsx # 근육 그룹 차트
│   └── index.ts
├── feedback/              # 피드백 시스템
│   ├── FeedbackButton.tsx # 피드백 버튼
│   ├── FeedbackModal.tsx  # 피드백 모달
│   └── index.ts
├── monitoring/            # 모니터링 컴포넌트
│   └── PerformanceDashboard.tsx
└── pwa/                   # PWA 컴포넌트
    ├── InstallPrompt.tsx  # 설치 프롬프트
    ├── OfflineIndicator.tsx # 오프라인 표시
    └── UpdatePrompt.tsx   # 업데이트 알림
```

### 📄 pages/ - 페이지 컴포넌트
```
src/pages/
├── LoginPage.tsx          # 로그인 페이지
├── ProfileSetupPage.tsx   # 프로필 설정
├── ProfileEditPage.tsx    # 프로필 수정
├── MyPage.tsx             # 마이페이지
├── RoutinesPage.tsx       # 루틴 목록
├── RoutineNewPage.tsx     # 루틴 생성
├── RoutineEditPage.tsx    # 루틴 편집
├── CalendarPage.tsx       # 캘린더 (메인)
├── ProgressPage.tsx       # 진행 상황
├── AuthCallbackPage.tsx   # OAuth 콜백
└── index.ts               # 페이지 export
```

### 🎣 hooks/ - 커스텀 훅
```
src/hooks/
├── queries/               # React Query 훅
│   ├── useAuth.ts         # 인증 관련
│   ├── useRoutines.ts     # 루틴 관련
│   ├── useWorkoutLogs.ts  # 운동 기록
│   ├── useProgressStats.ts # 진행률 통계
│   └── index.ts
├── useAuth.ts             # 인증 훅
├── useRoutines.ts         # 루틴 관리 훅
├── useWorkoutLogs.ts      # 운동 기록 훅
├── useProgressStats.ts    # 진행률 훅
└── index.ts
```

### 🏪 stores/ - 상태 관리
```
src/stores/
├── authStore.ts           # 인증 상태
├── routineStore.ts        # 루틴 상태
├── uiStore.ts             # UI 상태
└── index.ts
```

### 🔧 services/ - API 서비스
```
src/services/
├── supabase.ts            # Supabase 클라이언트
├── auth.ts                # 인증 서비스
├── database.ts            # 데이터베이스 서비스
├── routines.ts            # 루틴 API
├── ai.ts                  # AI 루틴 생성
├── progressStats.ts       # 진행률 계산
├── scheduledWorkouts.ts   # 날짜별 운동 일정 관리
├── googleCalendar.ts      # 구글 캘린더 연동
└── index.ts
```

### 📝 types/ - 타입 정의
```
src/types/
├── index.ts               # 메인 타입
├── database.ts            # 데이터베이스 타입
└── api.ts                 # API 타입
```

### 🛠️ utils/ - 유틸리티
```
src/utils/
├── constants.ts           # 상수 정의
├── formatters.ts          # 데이터 포맷팅
├── validators.ts          # 유효성 검사
├── date.ts                # 날짜 유틸리티
├── analytics.ts           # 분석 도구
├── performance.ts         # 성능 모니터링
├── sentry.ts              # 에러 모니터링
├── logger.ts              # 로깅 유틸리티
├── env-validation.ts      # 환경 변수 검증
├── cache.ts               # 캐싱 유틸리티
├── pwa.ts                 # PWA 유틸리티
└── index.ts
```

---

## 📋 설정 파일

### 루트 레벨 설정
```
├── package.json           # 의존성 및 스크립트
├── tsconfig.json          # TypeScript 설정
├── vite.config.ts         # Vite 빌드 설정
├── tailwind.config.js     # Tailwind CSS 설정
├── postcss.config.js      # PostCSS 설정
├── .eslintrc.cjs          # ESLint 설정
├── .prettierrc            # Prettier 설정
├── vitest.config.ts       # Vitest 테스트 설정
├── playwright.config.ts   # Playwright E2E 설정
├── lighthouserc.js        # Lighthouse 성능 설정
└── vercel.json            # Vercel 배포 설정
```

### 환경 변수
```
├── .env.example           # 환경 변수 템플릿
├── .env.local             # 로컬 환경 변수
├── .env.local.template    # 로컬 템플릿
├── .env.local.backup      # 백업 파일
└── .env.production.example # 프로덕션 템플릿
```

---

## 🧪 테스트 구조

### 단위 테스트
```
src/
├── components/
│   └── __tests__/         # 컴포넌트 테스트
├── hooks/
│   └── __tests__/         # 훅 테스트
├── services/
│   └── __tests__/         # 서비스 테스트
├── stores/
│   └── __tests__/         # 스토어 테스트
└── utils/
    └── __tests__/         # 유틸리티 테스트
```

### E2E 테스트
```
e2e/
├── auth.setup.ts          # 인증 설정
├── user-flow.spec.ts      # 사용자 플로우
├── components.spec.ts     # 컴포넌트 통합
└── fixtures/              # 테스트 데이터
```

---

## 📚 문서 구조

```
docs/
├── api-documentation.md   # API 문서
├── user-guide.md          # 사용자 가이드
├── beta-testing-guide.md  # 베타 테스트 가이드
├── testing-checklist.md   # 테스트 체크리스트
├── project-structure.md   # 프로젝트 구조 (이 문서)
├── production-deployment.md # 배포 가이드
├── ci-cd-setup.md         # CI/CD 설정
├── monitoring-setup.md    # 모니터링 설정
└── google-oauth-setup.md  # OAuth 설정
```

---

## 🔧 스크립트 및 도구

```
scripts/
├── analyze-feedback.js    # 피드백 분석
├── deployment-monitor.js  # 배포 모니터링
├── pre-deploy-check.js    # 배포 전 검사
└── setup-supabase.js      # Supabase 설정
```

---

## 🗄️ 데이터베이스 구조

```
supabase/
├── config.toml            # Supabase 설정
├── migrations/            # 데이터베이스 마이그레이션
│   ├── 001_initial_setup.sql
│   ├── 002_add_workouts_exercises_tables.sql
│   ├── 003_normalize_routine_structure.sql
│   ├── 004_google_calendar_integration.sql
│   └── 005_scheduled_workouts.sql  # 날짜별 운동 일정
├── functions/             # Edge Functions
│   └── google-calendar-events/  # 구글 캘린더 이벤트 API
├── seed.sql               # 초기 데이터
└── debug_rls.sql          # RLS 디버깅
```

### 주요 테이블
- **profiles**: 사용자 프로필 정보
- **routines**: 운동 루틴 정보
- **workouts**: 워크아웃 (Day 1, Day 2 등)
- **exercises**: 개별 운동 항목
- **workout_logs**: 운동 완료 기록
- **scheduled_workouts**: 날짜별 운동 일정 (NEW)
- **google_calendar_tokens**: 구글 캘린더 연동 토큰
- **calendar_event_mappings**: 캘린더 이벤트 매핑

---

## 🎨 스타일 구조

### Tailwind CSS 설정
```
src/
├── index.css              # 글로벌 스타일
└── components/
    └── ui/                # 컴포넌트별 스타일
```

### 디자인 토큰
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          400: '#3182f6',  // 토스 블루
          500: '#2563eb',
          600: '#1d4ed8'
        }
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px'
      }
    }
  }
}
```

---

## 📱 PWA 구조

```
public/
├── pwa-192x192.png        # PWA 아이콘 (192x192)
├── pwa-512x512.png        # PWA 아이콘 (512x512)
├── manifest.json          # PWA 매니페스트
└── sw.js                  # 서비스 워커
```

---

## 🔄 CI/CD 구조

```
.github/
└── workflows/
    ├── ci.yml             # 메인 CI/CD
    ├── security.yml       # 보안 검사
    └── performance.yml    # 성능 모니터링
```

---

## 📊 모니터링 구조

### 성능 모니터링
- **Vercel Analytics**: 사용자 분석
- **Lighthouse CI**: 성능 지표
- **Sentry**: 에러 모니터링

### 로깅 구조
```
src/utils/
├── logger.ts              # 로깅 유틸리티
├── analytics.ts           # 분석 이벤트
└── sentry.ts              # 에러 리포팅
```

---

## 🚀 배포 구조

### Vercel 배포
- **자동 배포**: Git push 시 자동 배포
- **프리뷰 배포**: PR 생성 시 프리뷰 환경
- **프로덕션 배포**: main 브랜치 머지 시

### 환경별 설정
- **Development**: 로컬 개발 환경
- **Preview**: 프리뷰 배포 환경
- **Production**: 프로덕션 환경

---

## 📝 네이밍 컨벤션

### 파일 네이밍
- **컴포넌트**: PascalCase (`UserProfile.tsx`)
- **페이지**: PascalCase + Page (`LoginPage.tsx`)
- **훅**: camelCase + use 접두사 (`useAuth.ts`)
- **유틸리티**: camelCase (`formatDate.ts`)
- **상수**: UPPER_SNAKE_CASE (`API_ENDPOINTS.ts`)

### 폴더 네이밍
- **kebab-case**: `user-profile/`
- **camelCase**: `userProfile/` (선택적)

### 변수 네이밍
- **camelCase**: `userName`, `isLoading`
- **PascalCase**: 컴포넌트, 타입, 인터페이스
- **UPPER_SNAKE_CASE**: 상수

---

## 🔗 의존성 관리

### 주요 의존성
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "typescript": "^5.2.2",
    "@supabase/supabase-js": "^2.89.0",
    "zustand": "^4.4.7",
    "@tanstack/react-query": "^5.8.4",
    "tailwindcss": "^3.3.5"
  }
}
```

### 개발 의존성
```json
{
  "devDependencies": {
    "vitest": "^0.34.6",
    "@playwright/test": "^1.57.0",
    "eslint": "^8.53.0",
    "prettier": "^3.1.0"
  }
}
```

---

**이 구조는 확장 가능하고 유지보수하기 쉬운 코드베이스를 위해 설계되었습니다. 🏗️**