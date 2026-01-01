# Plan4MyFit

AI가 개인 맞춤형 헬스 루틴을 생성해주는 모바일 웹앱입니다.

## 🚀 기술 스택

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS (토스 스타일)
- **State Management**: Zustand + React Query
- **Testing**: Vitest + Testing Library
- **Code Quality**: ESLint + Prettier
- **Package Manager**: pnpm

## 📦 개발 환경 설정

### 1. 의존성 설치

```bash
pnpm install
```

### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 필요한 환경 변수를 설정하세요:

```bash
cp .env.example .env.local
```

### 3. 개발 서버 실행

```bash
pnpm dev
```

## 🛠️ 개발 명령어

```bash
# 개발 서버 실행
pnpm dev

# 빌드
pnpm build

# 타입 체크
pnpm type-check

# 린트 체크
pnpm lint

# 린트 자동 수정
pnpm lint:fix

# 코드 포맷팅
pnpm format

# 테스트 실행
pnpm test

# 테스트 실행 (단일)
pnpm test:run
```

## 📱 디자인 시스템

### 색상 팔레트 (토스 스타일)

- **Primary**: `#3182f6` (토스 블루)
- **Success**: `#00c896`
- **Warning**: `#ffb800`
- **Error**: `#ff5757`

### 컴포넌트 클래스

- **버튼**: `.btn-primary`, `.btn-secondary`
- **카드**: `.card`
- **입력 필드**: `.input-field`
- **모바일 컨테이너**: `.mobile-container`

## 🏗️ 프로젝트 구조

```
src/
├── components/          # 재사용 가능한 컴포넌트
├── pages/              # 페이지 컴포넌트
├── hooks/              # 커스텀 훅
├── stores/             # Zustand 스토어
├── services/           # API 서비스
├── types/              # TypeScript 타입 정의
├── utils/              # 유틸리티 함수
└── test/               # 테스트 설정
```

## 📋 요구사항

- Node.js 18+
- pnpm 8+

## 🔧 설정 파일

- `vite.config.ts` - Vite 설정
- `tailwind.config.js` - Tailwind CSS 설정
- `tsconfig.json` - TypeScript 설정
- `.eslintrc.cjs` - ESLint 설정
- `.prettierrc` - Prettier 설정
- `vitest.config.ts` - Vitest 테스트 설정