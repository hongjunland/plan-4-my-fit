# Implementation Plan: Google Calendar Integration

## Overview

구글 캘린더 API를 활용하여 운동 루틴을 동기화합니다. OAuth 인증, 이벤트 CRUD, 자동 동기화까지 전체 플로우를 구현합니다.

## Tasks

- [x] 1. Google Cloud Console 설정
  - [x] 1.1 Google Cloud 프로젝트에서 Calendar API 활성화
  - [x] 1.2 OAuth 2.0 클라이언트 ID 생성
    - 승인된 리디렉션 URI 설정
    - 클라이언트 ID/Secret 획득
  - [x] 1.3 환경 변수 설정
    - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
    - Supabase secrets에 저장

- [x] 2. 데이터베이스 스키마 설정
  - [x] 2.1 google_calendar_tokens 테이블 생성
    - user_id, access_token, refresh_token, token_expiry, google_email
    - RLS 정책 설정
    - _Requirements: 1.3_
  - [x] 2.2 calendar_event_mappings 테이블 생성
    - user_id, routine_id, workout_id, google_event_id, event_date
    - RLS 정책 및 인덱스 설정
    - _Requirements: 2.3_
  - [x] 2.3 calendar_sync_status 테이블 생성
    - user_id, last_sync_at, sync_status, error_message
    - _Requirements: 6.1, 6.2_

- [x] 3. Supabase Edge Functions 구현 (OAuth)
  - [x] 3.1 supabase/functions/google-calendar-auth/index.ts 생성
    - GET /auth-url - OAuth URL 생성
    - POST /callback - 토큰 교환 및 저장
    - POST /refresh - 토큰 갱신
    - DELETE /revoke - 연동 해제
    - _Requirements: 1.2, 1.3, 5.3, 5.4_
  - [x] 3.2 Property 3 테스트 작성
    - **Property 3: 토큰 및 매핑 데이터 영속성**
    - 토큰 저장/조회 round-trip 검증
    - **Validates: Requirements 1.3, 2.3, 4.3, 5.4**

- [x] 4. Supabase Edge Functions 구현 (이벤트 관리)
  - [x] 4.1 supabase/functions/google-calendar-events/index.ts 생성
    - POST /events - 이벤트 생성
    - PATCH /events/:id - 이벤트 수정
    - DELETE /events - 이벤트 삭제
    - _Requirements: 2.1, 3.1, 4.1, 4.2_
  - [x] 4.2 이벤트 데이터 변환 로직 구현
    - 루틴/운동 데이터 → CalendarEvent 변환
    - 운동 이름, 목록, 소요 시간 포함
    - _Requirements: 2.2_
  - [x] 4.3 Property 2 테스트 작성
    - **Property 2: 이벤트 데이터 완전성**
    - 필수 필드 포함 검증
    - **Validates: Requirements 2.2**
    - **PBT Status: PASSING** - 10/10 테스트 통과 (타임존 버그 수정 완료)

- [x] 5. Supabase Edge Functions 구현 (동기화)
  - [x] 5.1 supabase/functions/google-calendar-sync/index.ts 생성
    - POST /sync/:routineId - 단일 루틴 동기화
    - POST /sync-all - 전체 루틴 동기화
    - _Requirements: 3.2, 6.4_
  - [x] 5.2 Property 1 테스트 작성
    - **Property 1: 캘린더 동기화 일관성**
    - 루틴 상태와 캘린더 이벤트 일치 검증
    - **Validates: Requirements 2.1, 3.1, 3.2, 4.1, 4.2, 5.3, 6.4**

- [x] 6. 클라이언트 서비스 구현
  - [x] 6.1 src/services/googleCalendar.ts 생성
    - getAuthUrl() - OAuth URL 요청
    - handleCallback() - 콜백 처리
    - getConnectionStatus() - 연동 상태 조회
    - disconnect() - 연동 해제
    - _Requirements: 1.2, 1.4, 5.4, 6.1_
  - [x] 6.2 동기화 함수 구현
    - syncRoutine() - 단일 루틴 동기화
    - syncAllRoutines() - 전체 동기화
    - _Requirements: 6.4_

- [x] 7. Checkpoint - Edge Functions 테스트
  - ✅ OAuth 플로우 테스트 - Property 3 (토큰 및 매핑 데이터 영속성) 6/6 테스트 통과
  - ✅ 이벤트 CRUD 테스트 - Property 2 (이벤트 데이터 완전성) 10/10 테스트 통과
    - 버그 수정 완료: `buildDateTimeRange()` 함수의 타임존 문제 해결
  - ✅ 동기화 테스트 - Property 1 (캘린더 동기화 일관성) 7/7 테스트 통과

- [x] 8. 캘린더 설정 페이지 구현
  - [x] 8.1 src/pages/CalendarSettingsPage.tsx 생성
    - 연동 상태 표시 (연동됨/연동 해제됨)
    - 연동된 구글 계정 이메일 표시
    - _Requirements: 1.4, 6.1_
  - [x] 8.2 연동 버튼 및 OAuth 플로우 구현
    - 연동 버튼 클릭 → OAuth 리다이렉트
    - 콜백 처리 및 상태 업데이트
    - _Requirements: 1.1, 1.2, 1.5_
  - [x] 8.3 동기화 상태 UI 구현
    - 마지막 동기화 시간 표시
    - 수동 동기화 버튼
    - 동기화 중 로딩 상태
    - _Requirements: 6.2, 6.3_
  - [x] 8.4 연동 해제 기능 구현
    - 해제 버튼 및 확인 다이얼로그
    - 이벤트 삭제 및 토큰 삭제
    - _Requirements: 5.1, 5.2, 5.5_

- [x] 9. OAuth 콜백 페이지 구현
  - [x] 9.1 src/pages/GoogleCalendarCallbackPage.tsx 생성
    - URL에서 code 파라미터 추출
    - Edge Function 호출하여 토큰 교환
    - 성공/실패 처리 및 리다이렉트
    - _Requirements: 1.3, 1.5_

- [x] 10. 라우팅 및 네비게이션 연결
  - [x] 10.1 src/constants/routes.ts에 캘린더 설정 라우트 추가
  - [x] 10.2 src/router/index.tsx에 라우트 등록
    - CalendarSettingsPage
    - GoogleCalendarCallbackPage
  - [x] 10.3 src/pages/MyPage.tsx에서 캘린더 연동 메뉴 활성화

- [x] 11. 루틴 서비스 확장 (자동 동기화)
  - [x] 11.1 src/services/routines.ts 수정
    - activateRoutine() - 캘린더 이벤트 생성 추가
    - deactivateRoutine() - 캘린더 이벤트 삭제 추가
    - _Requirements: 2.1, 4.1_
  - [x] 11.2 루틴 수정 시 동기화
    - updateRoutine() - 이벤트 업데이트 추가
    - deleteRoutine() - 이벤트 삭제 추가
    - _Requirements: 3.1, 4.2_

- [x] 12. Final Checkpoint
  - ✅ 전체 OAuth 플로우 테스트 - Property 3 (토큰 및 매핑 데이터 영속성) 6/6 테스트 통과
  - ✅ 루틴 활성화/비활성화 시 캘린더 동기화 - Property 1 (캘린더 동기화 일관성) 7/7 테스트 통과
  - ✅ 연동 해제 시 데이터 정리 확인 - Property 3에서 검증 완료
  - ✅ 모든 Property-Based 테스트 통과 확인 (23/23 테스트 통과)
    - Property 1: 캘린더 동기화 일관성 - 7/7 통과
    - Property 2: 이벤트 데이터 완전성 - 10/10 통과
    - Property 3: 토큰 및 매핑 데이터 영속성 - 6/6 통과

- [x] 13. 운동 완료 상태 동기화 - Edge Function 구현
  - [x] 13.1 supabase/functions/google-calendar-events/index.ts 확장
    - PATCH /events/:id/complete - 이벤트 완료 표시 (✅ + 녹색)
    - PATCH /events/:id/incomplete - 이벤트 완료 해제
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  - [x] 13.2 완료 표시 로직 구현
    - 제목 앞에 ✅ 추가/제거
    - colorId를 10(녹색)으로 변경/복원
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 14. 운동 완료 상태 동기화 - 클라이언트 서비스 구현
  - [x] 14.1 src/services/googleCalendar.ts 확장
    - markEventCompleted(eventId) - 완료 표시 API 호출
    - markEventIncomplete(eventId) - 완료 해제 API 호출
    - _Requirements: 7.1, 7.3_
  - [x] 14.2 이벤트 매핑 조회 함수 구현
    - getEventMapping(routineId, workoutId, date) - 매핑 조회
    - _Requirements: 7.5_

- [x] 15. 운동 완료 체크 시 캘린더 동기화 연동
  - [x] 15.1 src/hooks/useWorkoutLogs.ts 수정
    - toggleExerciseCompletion() 확장 - 캘린더 동기화 추가
    - 완료 체크 시 markEventCompleted() 호출
    - 완료 해제 시 markEventIncomplete() 호출
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  - [x] 15.2 에러 처리 구현
    - 캘린더 동기화 실패 시 로컬 상태 유지
    - 에러 로깅 및 사용자 알림 (선택적)
    - _Requirements: 7.6_

- [x] 16. Property 4 테스트 작성
  - [x] 16.1 완료 상태 동기화 일관성 테스트
    - **Property 4: 완료 상태 동기화 일관성**
    - 완료 체크 → 이벤트에 ✅ + 녹색 반영 검증
    - 완료 해제 → 이벤트 원래 상태 복원 검증
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4**
    - **PBT Status: PASSING** - 10/10 테스트 통과

- [x] 17. 완료 동기화 Checkpoint
  - [x] 17.1 완료 체크 → 캘린더 이벤트 업데이트 테스트
  - [x] 17.2 완료 해제 → 캘린더 이벤트 복원 테스트
  - [x] 17.3 오프라인/에러 시 로컬 상태 유지 테스트
  - ✅ 모든 완료 동기화 테스트 통과 확인 (22/22 테스트 통과)
    - Property 4: 완료 상태 동기화 일관성 - 10/10 통과
    - Integration Tests: 완료 동기화 체크포인트 - 12/12 통과

## Notes

- Tasks marked with `*` are optional property-based tests
- Google Calendar API 할당량: 1,000,000 queries/day (충분)
- OAuth 토큰은 암호화하여 저장 권장
- 토큰 만료 시 자동 갱신 로직 필수
- 연동 해제 시 구글 캘린더의 이벤트도 삭제됨을 사용자에게 안내
