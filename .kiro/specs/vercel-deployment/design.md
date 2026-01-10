# Design Document

## Overview

Vercel CLI를 사용하여 Plan4MyFit 앱을 배포합니다. GitHub 연동 없이 로컬에서 직접 배포하는 방식을 사용합니다.

## Architecture

```
Local Project → Vercel CLI → Vercel Platform → Production URL
```

## Components and Interfaces

### Vercel CLI
- 프로젝트 초기화 및 연결
- 환경 변수 관리
- 빌드 및 배포 실행

### vercel.json
- 이미 설정된 빌드 설정 사용
- Vite 프레임워크, pnpm 빌드 명령어

## Data Models

### 환경 변수
```
VITE_SUPABASE_URL: Supabase 프로젝트 URL
VITE_SUPABASE_ANON_KEY: Supabase 익명 키
VITE_OPENAI_API_KEY: OpenAI API 키
VITE_APP_URL: 프로덕션 앱 URL
```

## Correctness Properties

배포 관련 작업은 외부 서비스 의존성이 높아 property-based testing이 적합하지 않습니다.

## Error Handling

- 빌드 실패 시 에러 로그 확인
- 환경 변수 누락 시 경고 메시지

## Testing Strategy

- 배포 후 프로덕션 URL 접속 확인
- 환경 변수 정상 로드 확인
