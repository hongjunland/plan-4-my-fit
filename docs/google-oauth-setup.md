# Google OAuth 설정 가이드 - Plan4MyFit

## ⚠️ 보안 주의사항
이 문서는 설정 가이드용입니다. 실제 API 키나 민감한 정보는 절대 문서에 포함하지 마세요.

## 1. Google Cloud Console 설정

### 1.1 프로젝트 생성
1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. **새 프로젝트 생성**: 프로젝트 이름을 `plan-4-my-fit`로 설정
3. 프로젝트 선택 후 계속 진행

### 1.2 OAuth 동의 화면 설정
1. "API 및 서비스" > "OAuth 동의 화면" 이동
2. 사용자 유형: **외부** 선택
3. 앱 정보 입력:
   - **앱 이름**: `Plan4MyFit`
   - **사용자 지원 이메일**: 본인 이메일
   - **개발자 연락처 정보**: 본인 이메일
4. 범위 설정: 기본값 유지 (email, profile, openid)
5. 테스트 사용자 추가 (개발 중에는 본인 이메일 추가)

### 1.3 OAuth 2.0 클라이언트 ID 생성
1. "API 및 서비스" > "사용자 인증 정보" 이동
2. "사용자 인증 정보 만들기" > "OAuth 2.0 클라이언트 ID" 선택
3. 애플리케이션 유형: **웹 애플리케이션** 선택
4. 이름: `Plan4MyFit Web Client`
5. **승인된 JavaScript 원본** 추가:
   - `http://localhost:5173` (개발용)
   - `https://YOUR-PROJECT-ID.supabase.co` (Supabase용)
6. **승인된 리디렉션 URI** 추가:
   - `https://YOUR-PROJECT-ID.supabase.co/auth/v1/callback`

## 2. Supabase 설정

### 2.1 Google Provider 활성화
1. Supabase 대시보드 > Authentication > Providers
2. **Google** 찾아서 활성화
3. Google Cloud Console에서 생성한 정보 입력:
   - **Client ID**: Google OAuth 클라이언트 ID (Google Cloud Console에서 복사)
   - **Client Secret**: Google OAuth 클라이언트 시크릿 (Google Cloud Console에서 복사)
4. **Site URL**: `http://localhost:5173` (개발용)
5. **Redirect URLs**: `http://localhost:5173/**` (개발용)

### 2.2 확인사항
- Redirect URL이 정확한지 확인: `https://YOUR-PROJECT-ID.supabase.co/auth/v1/callback`
- 이 URL이 Google Cloud Console의 승인된 리디렉션 URI와 일치해야 함

## 3. 환경 변수 설정

`.env.local` 파일에 다음 설정을 추가하세요:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://YOUR-PROJECT-ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-SUPABASE-ANON-KEY

# App Configuration
VITE_APP_NAME="Plan4MyFit"
VITE_APP_URL=http://localhost:5173
```

**중요**: 
- `YOUR-PROJECT-ID`를 실제 Supabase 프로젝트 ID로 교체
- `YOUR-SUPABASE-ANON-KEY`를 실제 Supabase anon key로 교체
- 이 정보는 Supabase 대시보드 > Settings > API에서 확인 가능

## 4. 테스트 방법

### 4.1 개발 서버 실행
```bash
pnpm dev
```

### 4.2 Google 로그인 테스트
1. 브라우저에서 `http://localhost:5173` 접속
2. 로그인 페이지에서 "Google로 로그인" 버튼 클릭
3. Google 계정 선택 및 권한 승인
4. 성공 시 애플리케이션으로 리디렉션

### 4.3 인증 상태 확인
브라우저 개발자 도구 콘솔에서:
```javascript
// Supabase 인증 상태 확인
console.log(await supabase.auth.getSession())
```

## 5. 문제 해결

### 5.1 일반적인 오류
- **redirect_uri_mismatch**: Google Cloud Console의 리디렉션 URI 확인
- **unauthorized_client**: OAuth 동의 화면 설정 확인
- **access_denied**: 테스트 사용자 추가 확인

### 5.2 디버깅 팁
1. 브라우저 네트워크 탭에서 인증 요청 확인
2. Supabase 대시보드 > Authentication > Users에서 사용자 생성 확인
3. 콘솔 로그에서 오류 메시지 확인

## 6. 프로덕션 배포 시 주의사항

### 6.1 도메인 업데이트
프로덕션 배포 시 다음 설정을 실제 도메인으로 변경:
- Google Cloud Console: 승인된 JavaScript 원본 및 리디렉션 URI
- Supabase: Site URL 및 Redirect URLs

### 6.2 OAuth 동의 화면 검토
- Google OAuth 동의 화면을 "프로덕션" 모드로 변경
- 개인정보처리방침 및 서비스 약관 URL 추가
- Google 검토 프로세스 진행 (필요시)

## 7. 보안 체크리스트

### 7.1 개발 환경
- [ ] `.env.local` 파일이 `.gitignore`에 포함되어 있는지 확인
- [ ] 실제 API 키가 코드나 문서에 하드코딩되지 않았는지 확인
- [ ] 테스트 사용자만 OAuth 접근 가능하도록 설정

### 7.2 프로덕션 환경
- [ ] 프로덕션 도메인으로 OAuth 설정 업데이트
- [ ] 환경 변수가 Vercel 대시보드에서만 설정되어 있는지 확인
- [ ] Google OAuth 동의 화면이 프로덕션 모드로 설정되어 있는지 확인

## 8. 다음 단계

Google OAuth 설정 완료 후:
1. 사용자 프로필 설정 페이지 구현
2. 인증 상태에 따른 라우팅 설정
3. 로그아웃 기능 구현
4. 사용자 데이터 동기화 테스트