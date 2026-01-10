# Google Calendar API 설정 가이드

## 개요

이 문서는 Google Calendar API를 활용하여 운동 루틴을 구글 캘린더와 동기화하기 위한 설정 가이드입니다.

## ⚠️ 보안 주의사항

- 실제 API 키나 민감한 정보는 절대 코드나 문서에 포함하지 마세요
- 모든 시크릿은 환경 변수 또는 Supabase Secrets에 저장하세요

---

## 1. Google Cloud Console 설정

### 1.1 Calendar API 활성화

1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. 기존 프로젝트 `plan-4-my-fit` 선택 (또는 새 프로젝트 생성)
3. 좌측 메뉴에서 **"API 및 서비스"** > **"라이브러리"** 클릭
4. 검색창에 **"Google Calendar API"** 입력
5. **Google Calendar API** 선택 후 **"사용"** 버튼 클릭
6. API가 활성화되면 "API 사용 설정됨" 메시지 확인

### 1.2 OAuth 2.0 클라이언트 ID 생성

#### OAuth 동의 화면 업데이트 (필요시)

1. **"API 및 서비스"** > **"OAuth 동의 화면"** 이동
2. **"범위 추가 또는 삭제"** 클릭
3. 다음 범위 추가:
   - `https://www.googleapis.com/auth/calendar.events` (캘린더 이벤트 관리)
4. **"저장 후 계속"** 클릭

#### 클라이언트 ID 생성

1. **"API 및 서비스"** > **"사용자 인증 정보"** 이동
2. **"사용자 인증 정보 만들기"** > **"OAuth 2.0 클라이언트 ID"** 선택
3. 애플리케이션 유형: **웹 애플리케이션** 선택
4. 이름: `Plan4MyFit Calendar Integration`
5. **승인된 JavaScript 원본** 추가:
   ```
   http://localhost:5173
   https://your-production-domain.com
   ```
6. **승인된 리디렉션 URI** 추가:
   ```
   http://localhost:5173/auth/google-calendar/callback
   https://your-production-domain.com/auth/google-calendar/callback
   https://YOUR-PROJECT-ID.supabase.co/functions/v1/google-calendar-auth/callback
   ```
7. **"만들기"** 클릭
8. 생성된 **클라이언트 ID**와 **클라이언트 시크릿** 안전하게 저장

---

## 2. 환경 변수 설정

### 2.1 로컬 개발 환경

`.env.local` 파일에 다음 변수 추가:

```bash
# Google Calendar API Configuration
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
VITE_GOOGLE_CALENDAR_REDIRECT_URI=http://localhost:5173/auth/google-calendar/callback
```

### 2.2 Supabase Edge Functions 환경 변수

Supabase CLI를 사용하여 시크릿 설정:

```bash
# Google Calendar API 시크릿 설정
supabase secrets set GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
supabase secrets set GOOGLE_CLIENT_SECRET=your-google-client-secret
supabase secrets set GOOGLE_CALENDAR_REDIRECT_URI=https://your-domain.com/auth/google-calendar/callback
```

또는 Supabase 대시보드에서 설정:

1. Supabase 대시보드 > **Settings** > **Edge Functions**
2. **Secrets** 섹션에서 다음 시크릿 추가:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_CALENDAR_REDIRECT_URI`

### 2.3 Vercel 프로덕션 환경

Vercel 대시보드에서 환경 변수 설정:

1. Vercel 프로젝트 > **Settings** > **Environment Variables**
2. 다음 변수 추가:
   - `VITE_GOOGLE_CLIENT_ID`
   - `VITE_GOOGLE_CALENDAR_REDIRECT_URI`

---

## 3. OAuth 스코프

Google Calendar 연동에 필요한 OAuth 스코프:

```
https://www.googleapis.com/auth/calendar.events
```

이 스코프는 사용자의 캘린더 이벤트를 생성, 수정, 삭제할 수 있는 권한을 부여합니다.

---

## 4. API 할당량

Google Calendar API 기본 할당량:
- **일일 쿼리 수**: 1,000,000 queries/day
- **사용자당 쿼리 수**: 10,000 queries/100 seconds/user

MVP 단계에서는 충분한 할당량입니다.

---

## 5. 테스트 방법

### 5.1 OAuth 플로우 테스트

1. 개발 서버 실행: `pnpm dev`
2. 마이페이지 > 캘린더 설정으로 이동
3. "구글 캘린더 연동" 버튼 클릭
4. Google 계정 선택 및 권한 승인
5. 콜백 처리 후 연동 상태 확인

### 5.2 이벤트 생성 테스트

1. 루틴 활성화
2. 구글 캘린더에서 이벤트 생성 확인
3. 이벤트 내용 (운동 이름, 목록, 시간) 확인

---

## 6. 문제 해결

### 6.1 일반적인 오류

| 오류 | 원인 | 해결 방법 |
|------|------|----------|
| `redirect_uri_mismatch` | 리디렉션 URI 불일치 | Google Cloud Console에서 URI 확인 |
| `access_denied` | 사용자가 권한 거부 | 사용자에게 권한 필요성 안내 |
| `invalid_grant` | 토큰 만료 또는 무효 | 토큰 갱신 또는 재인증 |
| `insufficient_permission` | 스코프 부족 | OAuth 동의 화면에서 스코프 추가 |

### 6.2 디버깅 팁

1. 브라우저 개발자 도구 > Network 탭에서 OAuth 요청 확인
2. Supabase 대시보드 > Edge Functions > Logs에서 서버 로그 확인
3. Google Cloud Console > API 및 서비스 > 대시보드에서 API 호출 모니터링

---

## 7. 프로덕션 배포 체크리스트

### 7.1 Google Cloud Console

- [ ] 프로덕션 도메인을 승인된 JavaScript 원본에 추가
- [ ] 프로덕션 콜백 URL을 승인된 리디렉션 URI에 추가
- [ ] OAuth 동의 화면을 "프로덕션" 모드로 변경 (필요시)
- [ ] 개인정보처리방침 URL 추가
- [ ] 서비스 약관 URL 추가

### 7.2 Supabase

- [ ] 프로덕션 시크릿 설정 완료
- [ ] Edge Functions 배포 완료
- [ ] RLS 정책 활성화 확인

### 7.3 Vercel

- [ ] 프로덕션 환경 변수 설정 완료
- [ ] 프로덕션 도메인 설정 완료

---

## 8. 보안 고려사항

### 8.1 토큰 관리

- Access Token은 1시간 후 만료
- Refresh Token을 사용하여 자동 갱신
- 토큰은 Supabase에 암호화하여 저장 권장

### 8.2 데이터 보호

- 사용자별 RLS 정책으로 데이터 격리
- 연동 해제 시 모든 토큰 및 매핑 데이터 삭제
- 민감한 정보는 클라이언트에 노출하지 않음

---

## 9. 다음 단계

Google Calendar API 설정 완료 후:

1. 데이터베이스 스키마 설정 (Task 2)
2. Supabase Edge Functions 구현 (Task 3-5)
3. 클라이언트 서비스 구현 (Task 6)
4. UI 컴포넌트 구현 (Task 8-10)
