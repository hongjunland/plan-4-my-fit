# Technology Stack - MVP 저비용 구성

## 🎯 MVP 목표
- **저비용**: 무료/저렴한 서비스 우선
- **빠른 개발**: 검증된 기술 스택
- **확장 가능**: 나중에 업그레이드 가능한 구조

---

## 📱 Frontend

### Core
- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS** (토스 스타일 디자인)
- **React Router** (클라이언트 라우팅)

### 상태 관리
- **Zustand** (가벼운 상태 관리)
- **React Query** (서버 상태 관리)

### UI/UX
- **Framer Motion** (애니메이션)
- **React Hook Form** (폼 관리)
- **React Hot Toast** (알림)

---

## 🔧 Backend (저비용 옵션)

### Option 1: Serverless (추천 🌟)
- **Vercel Functions** (무료 100GB/월)
- **Supabase** (무료 500MB DB + Auth)
- **OpenAI API** (루틴 생성용)

### Option 2: Full-Stack Framework
- **Next.js 14** (App Router)
- **Vercel** 배포 (무료)
- **Supabase** (DB + Auth)

---

## 🗄️ Database & Storage

### Database
- **Supabase PostgreSQL** 
  - 무료: 500MB, 2개 프로젝트
  - 실시간 구독 지원
  - Row Level Security

### File Storage
- **Supabase Storage** (무료 1GB)
- 프로필 이미지, 운동 사진 등

---

## 🔐 Authentication

### 소셜 로그인
- **Supabase Auth**
  - Google OAuth (무료)
  - 이메일/비밀번호 (무료)
  - JWT 토큰 자동 관리

---

## 🤖 AI/ML Services

### 루틴 생성
- **OpenAI GPT-4o mini** 
  - $0.15/1M input tokens
  - $0.60/1M output tokens
  - 월 $10-20 예상

### 대안 (더 저렴)
- **Google Gemini Flash**
  - 무료 15 requests/min
  - 유료 시 더 저렴

---

## 📊 Analytics & Monitoring

### 무료 도구
- **Vercel Analytics** (무료)
- **Sentry** (무료 5K errors/월)
- **Google Analytics 4** (무료)

---

## 🚀 Deployment & Hosting

### Frontend
- **Vercel** (무료)
  - 100GB 대역폭/월
  - 자동 HTTPS
  - Git 연동 배포

### Backend
- **Vercel Functions** (무료)
  - 100GB 실행시간/월
  - Edge Functions 지원

---

## 💰 예상 비용 (월)

### 무료 티어로 시작
```
Vercel: $0 (무료 플랜)
Supabase: $0 (무료 플랜)
OpenAI: $10-20 (사용량 기반)
Domain: $1-2/월 (.com)
---
총 월 비용: $11-22
```

### 성장 후 (유료 플랜)
```
Vercel Pro: $20/월
Supabase Pro: $25/월  
OpenAI: $30-50/월
---
총 월 비용: $75-95
```

---

## 🛠️ Development Tools

### Package Manager
- **pnpm** (빠르고 효율적)

### Code Quality
- **ESLint** + **Prettier**
- **TypeScript** (타입 안전성)
- **Husky** (Git hooks)

### Testing
- **Vitest** (빠른 테스트)
- **Testing Library** (컴포넌트 테스트)

---

## 📦 Common Commands

```bash
# 개발 서버 실행
pnpm dev

# 빌드
pnpm build

# 테스트
pnpm test

# 린트 체크
pnpm lint

# 타입 체크
pnpm type-check

# 배포 (Vercel)
vercel --prod
```

---

## 🔄 Migration Path (확장 계획)

### Phase 1: MVP (현재)
- Vercel + Supabase
- 기본 기능 구현

### Phase 2: 성장
- Supabase Pro 업그레이드
- 고급 분석 도구 추가

### Phase 3: Scale
- AWS/GCP 이전 고려
- 마이크로서비스 분리

---

## 🎯 추천 이유

### ✅ 장점
- **저비용**: 초기 월 $20 이하
- **빠른 개발**: 검증된 스택
- **확장성**: 쉬운 업그레이드
- **개발자 경험**: 훌륭한 DX

### ⚠️ 주의사항
- Vercel 무료 플랜 제한
- Supabase 무료 플랜 제한
- OpenAI API 비용 모니터링 필요

---

## Development Environment

- **IDE**: VS Code with Kiro
- **Node.js**: 18+ (LTS)
- **Package Manager**: pnpm
