# Bolt.new 프로토타입 통합 가이드

## 🚀 통합 프로세스

### 1. Bolt 프로젝트 다운로드
- Bolt.new에서 "Download" 클릭
- ZIP 파일 다운로드 및 압축 해제

### 2. 파일 구조 매핑

#### Bolt 구조 → 우리 구조
```
bolt-project/
├── src/
│   ├── components/     → src/components/
│   ├── pages/         → src/pages/
│   ├── hooks/         → src/hooks/
│   ├── utils/         → src/utils/
│   ├── types/         → src/types/
│   └── styles/        → src/styles/
├── public/            → public/
├── package.json       → package.json
├── vite.config.ts     → vite.config.ts
├── tailwind.config.js → tailwind.config.js
├── tsconfig.json      → tsconfig.json
└── index.html         → index.html
```

### 3. 필수 설정 파일 추가

#### package.json 스크립트 업데이트
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "type-check": "tsc --noEmit",
    "test": "vitest"
  }
}
```

#### 환경 변수 설정 (.env.local)
```bash
# Supabase (나중에 추가)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI (나중에 추가)
VITE_OPENAI_API_KEY=your_openai_api_key

# App Configuration
VITE_APP_URL=http://localhost:5173
VITE_APP_NAME="헬스 루틴 플래너"
```

### 4. 추가 개발 도구 설치

```bash
# ESLint & Prettier
pnpm add -D eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser
pnpm add -D prettier eslint-config-prettier eslint-plugin-prettier

# Testing
pnpm add -D vitest @testing-library/react @testing-library/jest-dom

# Additional utilities
pnpm add zustand react-query framer-motion react-hook-form
```

### 5. 설정 파일 생성

#### .eslintrc.js
```javascript
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'prettier'
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn'
  }
}
```

#### .prettierrc
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

### 6. 폴더 구조 정리

```bash
# 컴포넌트 정리
mkdir -p src/components/ui
mkdir -p src/components/forms
mkdir -p src/components/layout
mkdir -p src/components/routine
mkdir -p src/components/calendar

# 서비스 폴더 생성
mkdir -p src/services
mkdir -p src/stores
mkdir -p src/hooks
mkdir -p src/constants

# 타입 정의 폴더
mkdir -p src/types
```

### 7. 백엔드 통합 준비

#### Supabase 설정 (나중에)
```bash
# Supabase CLI 설치
npm install -g supabase

# 프로젝트 초기화
supabase init

# 로컬 개발 환경 시작
supabase start
```

#### Vercel 배포 설정
```bash
# Vercel CLI 설치
npm install -g vercel

# 프로젝트 배포
vercel

# 환경 변수 설정
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
```

## 🔧 통합 후 체크리스트

### ✅ 기본 설정
- [ ] 프로젝트 파일 복사 완료
- [ ] 의존성 설치 완료 (`pnpm install`)
- [ ] 개발 서버 실행 확인 (`pnpm dev`)
- [ ] 빌드 테스트 (`pnpm build`)

### ✅ 코드 품질
- [ ] ESLint 설정 완료
- [ ] Prettier 설정 완료
- [ ] TypeScript 타입 체크 (`pnpm type-check`)

### ✅ 폴더 구조
- [ ] 컴포넌트 분류 완료
- [ ] 서비스 레이어 준비
- [ ] 타입 정의 정리

### ✅ 배포 준비
- [ ] Vercel 프로젝트 생성
- [ ] 환경 변수 설정
- [ ] 자동 배포 확인

## 🚨 주의사항

### Bolt 코드 수정 필요한 부분
1. **하드코딩된 데이터** → 실제 API 연동
2. **localStorage** → Supabase 연동
3. **Mock 로그인** → 실제 Google OAuth
4. **정적 루틴** → AI 생성 루틴

### 점진적 업그레이드 계획
1. **Phase 1**: Bolt 프로토타입 그대로 사용
2. **Phase 2**: Supabase 연동 (사용자 데이터)
3. **Phase 3**: OpenAI 연동 (AI 루틴 생성)
4. **Phase 4**: 고급 기능 추가

## 📞 도움이 필요할 때

### 일반적인 문제
- **빌드 에러**: `pnpm clean && pnpm install`
- **타입 에러**: `tsconfig.json` 설정 확인
- **스타일 문제**: Tailwind 설정 확인

### 통합 관련 문제
- 파일 경로 문제
- 의존성 충돌
- 환경 변수 설정

언제든지 질문하세요! 🙋‍♂️