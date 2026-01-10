# Design Document

## Overview

Vercel CLI를 사용하여 Plan4MyFit 앱을 배포합니다. GitHub 연동 없이 로컬에서 직접 배포하는 방식을 사용합니다.

## Production Environment

- **프로덕션 URL**: https://plan-4-my-fit.vercel.app
- **Vercel 플랜**: Free (Hobby)
- **빌드 도구**: Vite + React SWC

## Architecture

```
Local Project → Vercel CLI → Vercel Platform → Production URL
                                    ↓
                              Supabase (Auth + DB)
                                    ↓
                              Google OAuth
```

## Components and Interfaces

### Vercel CLI
- 프로젝트 초기화 및 연결
- 환경 변수 관리
- 빌드 및 배포 실행

### vercel.json
- 이미 설정된 빌드 설정 사용
- Vite 프레임워크, pnpm 빌드 명령어

### vite.config.ts
- `@vitejs/plugin-react-swc` 사용 (프로덕션 빌드 호환성)
- Sentry 소스맵 업로드 설정

## Data Models

### 환경 변수
```
VITE_SUPABASE_URL: Supabase 프로젝트 URL
VITE_SUPABASE_ANON_KEY: Supabase 익명 키
VITE_OPENAI_API_KEY: OpenAI API 키
VITE_APP_URL: https://plan-4-my-fit.vercel.app
```

### Supabase 설정 (Authentication)
```
Site URL: https://plan-4-my-fit.vercel.app
Redirect URLs: 
  - https://plan-4-my-fit.vercel.app/auth/callback
```

## Correctness Properties

배포 관련 작업은 외부 서비스 의존성이 높아 property-based testing이 적합하지 않습니다.

## Error Handling

| 오류 | 원인 | 해결 방법 |
|-----|------|----------|
| jsxDEV is not a function | @vitejs/plugin-react 호환성 | @vitejs/plugin-react-swc로 교체 |
| OAuth 리다이렉트 localhost | Supabase Site URL 설정 오류 | Supabase Dashboard에서 프로덕션 URL 설정 |
| 403 Forbidden (Analytics) | Vercel 무료 플랜 제한 | Analytics/SpeedInsights 컴포넌트 제거 |
| 과도한 API 호출 | useEffect 의존성 불안정 | user.id를 안정적인 의존성으로 사용 |

## Testing Strategy

- 배포 후 프로덕션 URL 접속 확인
- Google OAuth 로그인 플로우 테스트
- 환경 변수 정상 로드 확인
- API 호출 정상 동작 확인

## Deployment Checklist

1. ✅ Vercel 프로젝트 연결
2. ✅ 환경 변수 설정 (Vercel Dashboard)
3. ✅ Supabase OAuth 설정 (Site URL, Redirect URLs)
4. ✅ 프로덕션 빌드 테스트
5. ✅ `vercel --prod` 배포
6. ✅ 로그인 플로우 테스트
7. ✅ 주요 기능 동작 확인
