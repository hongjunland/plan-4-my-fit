# Implementation Plan: Vercel Deployment

## Overview

Vercel CLI를 사용하여 Plan4MyFit 앱을 프로덕션에 배포합니다.

## Production URL

- **프로덕션 URL**: https://plan-4-my-fit.vercel.app

## Tasks

- [x] 1. Vercel 프로젝트 초기화
  - vercel 명령어로 프로젝트 연결
  - 프로젝트 이름: plan4myfit
  - _Requirements: 1.1, 1.2_

- [x] 2. 환경 변수 설정
  - Supabase URL 및 키 설정
  - OpenAI API 키 설정
  - 앱 URL 설정 (`VITE_APP_URL=https://plan-4-my-fit.vercel.app`)
  - _Requirements: 2.1, 2.2_

- [x] 3. 프로덕션 배포
  - vercel --prod 명령어로 배포
  - 배포 URL 확인
  - _Requirements: 3.1, 3.2_

- [x] 4. 배포 확인
  - 프로덕션 URL 접속 테스트
  - Supabase 연결 확인

- [x] 5. 프로덕션 빌드 오류 수정
  - `jsxDEV is not a function` 오류 해결
  - `@vitejs/plugin-react` → `@vitejs/plugin-react-swc` 변경
  - vite.config.ts TypeScript 오류 수정
  - _Requirements: 3.1_

- [x] 6. 도메인 설정
  - Vercel 도메인 alias 변경: `plan-4-my-fit.vercel.app`
  - 환경 변수 업데이트
  - _Requirements: 2.2_

- [x] 7. Google OAuth 리다이렉트 설정
  - Supabase Dashboard에서 Redirect URL 설정
  - Site URL을 프로덕션 URL로 변경
  - `VITE_APP_URL` 환경 변수 업데이트
  - _Requirements: 1.1, 2.2_

- [x] 8. Vercel Analytics 비활성화
  - 무료 플랜에서 403 에러 발생으로 제거
  - `@vercel/analytics`, `@vercel/speed-insights` 컴포넌트 제거
  - _Requirements: 3.2_

---

## 해결된 이슈 기록

### 1. 프로덕션 빌드 오류 (jsxDEV is not a function)
- **원인**: `@vitejs/plugin-react`의 프로덕션 빌드 호환성 문제
- **해결**: `@vitejs/plugin-react-swc`로 교체

### 2. Google OAuth 리다이렉트 오류
- **원인**: Supabase Site URL이 localhost로 설정됨
- **해결**: 
  - Supabase Dashboard → Authentication → URL Configuration
  - Site URL: `https://plan-4-my-fit.vercel.app`
  - Redirect URLs에 `https://plan-4-my-fit.vercel.app/auth/callback` 추가

### 3. Vercel Analytics 403 에러
- **원인**: Vercel 무료 플랜에서 Analytics 미지원
- **해결**: `<Analytics />`, `<SpeedInsights />` 컴포넌트 제거

### 4. 캘린더 API 과도한 호출
- **원인**: `useEffect` 의존성 배열에 `user` 객체 사용 (매 렌더링마다 새 객체 생성)
- **해결**: `user.id`를 안정적인 의존성으로 사용

---

## 관련 파일

- `vite.config.ts` - 빌드 설정
- `src/main.tsx` - Analytics 컴포넌트 제거
- `src/pages/CalendarPage.tsx` - API 호출 최적화
- `src/services/auth.ts` - OAuth 리다이렉트 설정
