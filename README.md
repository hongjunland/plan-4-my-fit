# Plan4MyFit - 헬스 루틴 플래너 🏋️‍♂️

> AI가 개인 맞춤형 헬스 루틴을 생성해주는 모바일 웹앱

[![CI/CD](https://github.com/hongjunland/plan-4-my-fit/workflows/CI/badge.svg)](https://github.com/hongjunland/plan-4-my-fit/actions)
[![Lighthouse](https://img.shields.io/badge/Lighthouse-90+-green.svg)](https://developers.google.com/web/tools/lighthouse)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 📱 앱 소개

Plan4MyFit은 사용자의 체력 수준, 운동 목표, 신체 조건을 분석하여 AI가 최적화된 개인 맞춤형 헬스 루틴을 생성해주는 모바일 웹 애플리케이션입니다.

### 🎯 핵심 가치
- **개인화**: AI가 분석한 나만의 맞춤 루틴
- **간편함**: 3분만에 완성되는 운동 계획
- **동기부여**: 시각적 진행률로 지속적인 동기 제공

---

## ✨ 주요 기능

### 🤖 AI 맞춤 루틴 생성
- GPT-4 기반 개인화된 운동 계획
- 체력 수준, 목표, 운동 환경 고려
- 불편한 부위 피하는 안전한 루틴

### 📅 스마트 캘린더
- **오늘 뷰**: 오늘의 운동 체크리스트
- **주간 뷰**: 5일 운동 계획 한눈에
- **월간 뷰**: 월간 완료 통계 및 기록

### 📊 진행률 추적
- 실시간 운동 완료 상태
- 주간/월간 완료율 통계
- 연속 운동 일수 추적

### 🔧 루틴 관리
- 다중 루틴 저장 (최대 10개)
- 자유로운 운동 편집
- 루틴 복제 및 활성화

---

## 🛠️ 기술 스택

### Frontend
- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS** (토스 스타일 디자인)
- **Zustand** (상태 관리)
- **React Query** (서버 상태)
- **Framer Motion** (애니메이션)

### Backend & Services
- **Supabase** (PostgreSQL + Auth + Storage)
- **OpenAI GPT-4** (AI 루틴 생성)
- **Vercel** (배포 및 호스팅)

### Development & Testing
- **Vitest** (단위 테스트)
- **Playwright** (E2E 테스트)
- **ESLint** + **Prettier** (코드 품질)
- **Husky** (Git hooks)

---

## 🚀 빠른 시작

### 필수 요구사항
- Node.js 18+ (LTS)
- pnpm 8+
- Git

### 1. 저장소 클론
```bash
git clone https://github.com/hongjunland/plan-4-my-fit.git
cd plan-4-my-fit
```

### 2. 의존성 설치
```bash
pnpm install
```

### 3. 환경 변수 설정
```bash
cp .env.example .env.local
```

`.env.local` 파일을 편집하여 다음 환경 변수를 설정하세요:

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI
VITE_OPENAI_API_KEY=your_openai_api_key

# App Configuration
VITE_APP_URL=http://localhost:5173
VITE_APP_NAME="Plan4MyFit"
```

### 4. 개발 서버 실행
```bash
pnpm dev
```

앱이 [http://localhost:5173](http://localhost:5173)에서 실행됩니다.

---

## 📚 문서

### 설정 가이드
- [🚀 프로덕션 배포](docs/production-deployment.md)
- [⚙️ CI/CD 설정](docs/ci-cd-setup.md)
- [📊 모니터링 설정](docs/monitoring-setup.md)
- [🔐 Google OAuth 설정](docs/google-oauth-setup.md)

### 개발 가이드
- [🧪 베타 테스트 가이드](docs/beta-testing-guide.md)
- [✅ 테스트 체크리스트](docs/testing-checklist.md)
- [🏗️ 프로젝트 구조](docs/project-structure.md)

---

## 🧪 테스트

### 단위 테스트
```bash
pnpm test          # 테스트 실행
pnpm test:ui       # UI 모드로 테스트
pnpm test:run      # 단일 실행
```

### E2E 테스트
```bash
pnpm test:e2e      # E2E 테스트 실행
pnpm test:e2e:ui   # UI 모드로 E2E 테스트
```

### 성능 테스트
```bash
pnpm lighthouse    # Lighthouse 성능 측정
pnpm perf:analyze  # 성능 분석
```

### 코드 품질
```bash
pnpm lint          # ESLint 검사
pnpm lint:fix      # ESLint 자동 수정
pnpm type-check    # TypeScript 타입 검사
pnpm format        # Prettier 포맷팅
```

---

## 📱 지원 환경

### 모바일 브라우저
- **iOS**: Safari 15+, Chrome
- **Android**: Chrome 90+, Samsung Internet

### 데스크톱 브라우저
- Chrome 90+
- Safari 15+
- Firefox 90+
- Edge 90+

### 화면 크기
- **모바일**: 320px~448px (최적화)
- **태블릿**: 768px+ (호환)
- **데스크톱**: 1024px+ (호환)

---

## 🏗️ 프로젝트 구조

```
src/
├── components/          # 재사용 가능한 컴포넌트
│   ├── ui/             # 기본 UI 컴포넌트
│   ├── forms/          # 폼 컴포넌트
│   ├── layout/         # 레이아웃 컴포넌트
│   ├── calendar/       # 캘린더 컴포넌트
│   ├── routine/        # 루틴 관련 컴포넌트
│   ├── progress/       # 진행률 컴포넌트
│   └── feedback/       # 피드백 컴포넌트
├── pages/              # 페이지 컴포넌트
├── hooks/              # 커스텀 훅
├── stores/             # Zustand 스토어
├── services/           # API 서비스
├── types/              # TypeScript 타입
├── utils/              # 유틸리티 함수
└── constants/          # 상수 정의
```

---

## 🚀 배포

### Vercel 배포 (권장)
```bash
# 프로덕션 빌드
pnpm build:prod

# Vercel 배포
pnpm deploy:vercel
```

### 수동 배포
```bash
# 빌드
pnpm build

# 미리보기
pnpm preview
```

---

## 📊 성능 지표

### Core Web Vitals
- **LCP**: < 2.5초
- **FID**: < 100ms
- **CLS**: < 0.1

### Lighthouse 점수
- **Performance**: 90+
- **Accessibility**: 95+
- **Best Practices**: 95+
- **SEO**: 90+

---

## 🤝 기여하기

### 기여 방법
1. 이 저장소를 Fork 합니다
2. 기능 브랜치를 생성합니다 (`git checkout -b feature/AmazingFeature`)
3. 변경사항을 커밋합니다 (`git commit -m 'Add some AmazingFeature'`)
4. 브랜치에 Push 합니다 (`git push origin feature/AmazingFeature`)
5. Pull Request를 생성합니다

### 개발 가이드라인
- TypeScript 사용 필수
- ESLint + Prettier 규칙 준수
- 테스트 코드 작성
- 커밋 메시지 컨벤션 준수

---

## 🐛 버그 리포트 & 기능 제안

이슈가 있거나 새로운 기능을 제안하고 싶으시면:

1. [GitHub Issues](https://github.com/hongjunland/plan-4-my-fit/issues)에서 기존 이슈를 확인해주세요
2. 새로운 이슈를 생성할 때는 템플릿을 사용해주세요
3. 앱 내 피드백 버튼을 통해서도 의견을 보내실 수 있습니다

---

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

---

## 👥 팀

- **개발자**: [Your Name](https://github.com/hongjunland)
- **디자인**: 토스 디자인 시스템 기반
- **AI**: OpenAI GPT-4

---

## 🙏 감사의 말

- [Supabase](https://supabase.com/) - 백엔드 서비스
- [OpenAI](https://openai.com/) - AI 루틴 생성
- [Vercel](https://vercel.com/) - 배포 플랫폼
- [Tailwind CSS](https://tailwindcss.com/) - CSS 프레임워크

---

**건강한 운동 습관을 만들어가세요! 💪**