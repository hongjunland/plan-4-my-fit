# Google Calendar Auth Edge Function

OAuth 인증을 처리하는 Supabase Edge Function입니다.

## Endpoints

### GET /auth-url
OAuth URL을 생성합니다.

**Query Parameters:**
- `redirect_uri` (required): OAuth 콜백 후 리다이렉트할 URL

**Response:**
```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

### POST /callback
Authorization code를 토큰으로 교환하고 저장합니다.

**Headers:**
- `Authorization: Bearer <supabase_jwt>`

**Body:**
```json
{
  "code": "authorization_code_from_google",
  "redirect_uri": "https://your-app.com/callback"
}
```

**Response:**
```json
{
  "success": true,
  "googleEmail": "user@gmail.com",
  "message": "Google Calendar connected successfully"
}
```

### POST /refresh
만료된 access token을 갱신합니다.

**Headers:**
- `Authorization: Bearer <supabase_jwt>`

**Response:**
```json
{
  "success": true,
  "accessToken": "new_access_token",
  "expiresAt": "2024-01-01T00:00:00.000Z"
}
```

### DELETE /revoke
Google Calendar 연동을 해제하고 모든 관련 데이터를 삭제합니다.

**Headers:**
- `Authorization: Bearer <supabase_jwt>`

**Response:**
```json
{
  "success": true,
  "message": "Google Calendar disconnected successfully"
}
```

### GET /status
현재 연동 상태를 조회합니다.

**Headers:**
- `Authorization: Bearer <supabase_jwt>`

**Response:**
```json
{
  "isConnected": true,
  "googleEmail": "user@gmail.com",
  "isTokenExpired": false,
  "lastSyncAt": "2024-01-01T00:00:00.000Z",
  "syncStatus": "idle",
  "errorMessage": null
}
```

## Environment Variables

Edge Function에서 필요한 환경 변수:

- `SUPABASE_URL` - Supabase 프로젝트 URL (자동 제공)
- `SUPABASE_ANON_KEY` - Supabase anon key (자동 제공)
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (자동 제공)
- `GOOGLE_CLIENT_ID` - Google OAuth 클라이언트 ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth 클라이언트 시크릿

## Deployment

```bash
# Supabase CLI로 배포
supabase functions deploy google-calendar-auth

# 환경 변수 설정
supabase secrets set GOOGLE_CLIENT_ID=your_client_id
supabase secrets set GOOGLE_CLIENT_SECRET=your_client_secret
```

## Requirements Mapping

- **1.2**: OAuth 인증 플로우 시작 (GET /auth-url)
- **1.3**: 토큰 저장 (POST /callback)
- **5.3**: 캘린더 이벤트 삭제 (DELETE /revoke)
- **5.4**: 토큰 및 매핑 삭제 (DELETE /revoke)
