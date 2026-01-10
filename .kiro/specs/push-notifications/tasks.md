# Implementation Plan: Push Notifications

## Overview

PWA 기반 웹 푸시 알림 시스템을 구현합니다. 브라우저 지원 확인, 권한 요청, 구독 관리, 설정 UI, 서버 사이드 푸시 전송까지 전체 플로우를 구현합니다.

## Tasks

- [ ] 1. 데이터베이스 스키마 설정
  - [ ] 1.1 Supabase에 push_subscriptions 테이블 생성
    - user_id, endpoint, p256dh, auth 컬럼
    - RLS 정책 설정
    - _Requirements: 1.2_
  - [ ] 1.2 Supabase에 notification_settings 테이블 생성
    - user_id, workout_reminder, reminder_time, weekly_summary 컬럼
    - RLS 정책 설정
    - _Requirements: 2.1, 2.2, 2.3_

- [ ] 2. 푸시 알림 서비스 구현
  - [ ] 2.1 src/services/pushNotification.ts 생성
    - isSupported() - 브라우저 지원 여부 확인
    - isIOSBrowser() - iOS Safari 감지
    - requestPermission() - 권한 요청
    - _Requirements: 1.1, 1.4, 1.5_
  - [ ] 2.2 구독 관리 함수 구현
    - subscribe() - 푸시 구독 생성
    - unsubscribe() - 구독 해제
    - saveSubscription() - Supabase에 저장
    - deleteSubscription() - Supabase에서 삭제
    - _Requirements: 1.2, 5.2_
  - [ ] 2.3 설정 관리 함수 구현
    - getSettings() - 설정 조회
    - updateSettings() - 설정 저장
    - _Requirements: 2.4_
  - [ ]* 2.4 Property 1 테스트 작성
    - **Property 1: 구독 데이터 영속성**
    - 구독 저장/조회 round-trip 검증
    - **Validates: Requirements 1.2, 2.4, 5.2**

- [ ] 3. Service Worker 푸시 핸들러 구현
  - [ ] 3.1 vite.config.ts에 커스텀 Service Worker 설정 추가
    - vite-plugin-pwa의 injectManifest 모드 사용
    - _Requirements: 3.2_
  - [ ] 3.2 public/sw-custom.js 생성
    - push 이벤트 핸들러 구현
    - notificationclick 이벤트 핸들러 구현 (캘린더 페이지로 이동)
    - _Requirements: 3.1, 3.2_

- [ ] 4. 알림 설정 페이지 구현
  - [ ] 4.1 src/pages/NotificationSettingsPage.tsx 생성
    - 브라우저 지원 여부 표시
    - iOS Safari 안내 메시지
    - 권한 상태 표시
    - _Requirements: 1.3, 1.4, 1.5_
  - [ ] 4.2 알림 설정 UI 구현
    - 운동 리마인더 ON/OFF 토글
    - 알림 시간 선택 (30분/1시간/2시간 전)
    - 주간 요약 ON/OFF 토글
    - _Requirements: 2.1, 2.2, 2.3_
  - [ ] 4.3 전체 알림 해제 기능 구현
    - 해제 버튼 및 확인 다이얼로그
    - 구독 해제 및 상태 업데이트
    - _Requirements: 5.1, 5.3_

- [ ] 5. 라우팅 및 네비게이션 연결
  - [ ] 5.1 src/constants/routes.ts에 알림 설정 라우트 추가
  - [ ] 5.2 src/router/index.tsx에 NotificationSettingsPage 라우트 등록
  - [ ] 5.3 src/pages/MyPage.tsx에서 알림 설정 메뉴 활성화
    - available: true로 변경
    - onClick에서 navigate 연결

- [ ] 6. Checkpoint - 클라이언트 사이드 테스트
  - 브라우저에서 알림 권한 요청 확인
  - 설정 저장/조회 확인
  - 모든 테스트 통과 확인

- [ ] 7. Supabase Edge Function 구현
  - [ ] 7.1 VAPID 키 생성 및 환경 변수 설정
    - web-push generate-vapid-keys 실행
    - Supabase secrets에 저장
  - [ ] 7.2 supabase/functions/send-push/index.ts 생성
    - web-push 라이브러리 사용
    - 푸시 페이로드 생성 및 전송
    - _Requirements: 3.1_
  - [ ]* 7.3 Property 2, 3 테스트 작성
    - **Property 2: 비활성화 시 알림 미전송**
    - **Property 3: 알림 생성 정확성**
    - **Validates: Requirements 3.1, 3.3, 4.2**

- [ ] 8. 스케줄러 설정 (운동 리마인더)
  - [ ] 8.1 supabase/functions/workout-reminder/index.ts 생성
    - 오늘 운동이 있는 사용자 조회
    - 설정된 시간에 맞춰 푸시 전송
    - _Requirements: 3.1, 3.3_
  - [ ] 8.2 Supabase Cron Job 설정
    - 매 시간 실행하여 알림 대상 확인

- [ ] 9. 스케줄러 설정 (주간 요약)
  - [ ] 9.1 supabase/functions/weekly-summary/index.ts 생성
    - 주간 운동 완료율 계산
    - 주간 요약 알림 전송
    - _Requirements: 4.1, 4.2_
  - [ ] 9.2 Supabase Cron Job 설정
    - 매주 일요일 오전 10시 실행

- [ ] 10. Final Checkpoint
  - 전체 플로우 테스트
  - 에러 핸들링 확인
  - 모든 테스트 통과 확인

## Notes

- Tasks marked with `*` are optional property-based tests
- VAPID 키는 한 번 생성 후 변경하지 않음 (구독 무효화 방지)
- iOS Safari 사용자에게는 PWA 설치 안내 필수
- Supabase Edge Functions는 Deno 런타임 사용
