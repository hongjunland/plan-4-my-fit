# Requirements Document

## Introduction

모바일 웹앱에서 푸시 알림을 통해 사용자에게 운동 리마인더를 제공하는 기능입니다. PWA(Progressive Web App) 기반으로 Web Push API를 활용하여 브라우저 푸시 알림을 구현합니다.

## Glossary

- **Push_Notification_Service**: 푸시 알림을 관리하고 전송하는 서비스
- **Notification_Settings_Page**: 알림 설정을 관리하는 페이지 컴포넌트
- **Service_Worker**: 백그라운드에서 푸시 알림을 수신하는 워커
- **Subscription**: 사용자의 푸시 알림 구독 정보
- **Reminder**: 운동 시작 전 알림

## Requirements

### Requirement 1: 알림 권한 요청

**User Story:** As a 사용자, I want to 앱에서 알림 권한을 요청받고 싶다, so that 운동 리마인더를 받을 수 있다.

#### Acceptance Criteria

1. WHEN 사용자가 알림 설정 페이지에 처음 접근하면 THE Push_Notification_Service SHALL 브라우저 알림 권한을 요청한다
2. WHEN 사용자가 알림 권한을 허용하면 THE Push_Notification_Service SHALL 구독 정보를 Supabase에 저장한다
3. WHEN 사용자가 알림 권한을 거부하면 THE Notification_Settings_Page SHALL 권한 거부 상태를 표시하고 브라우저 설정 안내를 제공한다
4. IF 브라우저가 푸시 알림을 지원하지 않으면 THEN THE Notification_Settings_Page SHALL 지원하지 않는 브라우저임을 안내한다
5. IF iOS 기기에서 일반 브라우저로 접속한 경우 THEN THE Notification_Settings_Page SHALL "홈 화면에 추가" 안내를 표시한다

### Requirement 2: 알림 설정 관리

**User Story:** As a 사용자, I want to 알림 종류와 시간을 설정하고 싶다, so that 원하는 시간에 원하는 알림만 받을 수 있다.

#### Acceptance Criteria

1. THE Notification_Settings_Page SHALL 운동 리마인더 알림 ON/OFF 토글을 제공한다
2. WHEN 운동 리마인더가 활성화되면 THE Notification_Settings_Page SHALL 알림 시간 설정 옵션을 표시한다 (운동 30분 전, 1시간 전, 2시간 전)
3. THE Notification_Settings_Page SHALL 주간 요약 알림 ON/OFF 토글을 제공한다
4. WHEN 사용자가 설정을 변경하면 THE Push_Notification_Service SHALL 변경사항을 즉시 Supabase에 저장한다

### Requirement 3: 운동 리마인더 알림

**User Story:** As a 사용자, I want to 오늘 예정된 운동 전에 알림을 받고 싶다, so that 운동을 잊지 않고 할 수 있다.

#### Acceptance Criteria

1. WHEN 설정된 알림 시간이 되면 THE Push_Notification_Service SHALL 오늘의 운동 정보가 포함된 푸시 알림을 전송한다
2. WHEN 사용자가 알림을 클릭하면 THE Service_Worker SHALL 앱의 캘린더 페이지로 이동시킨다
3. WHILE 사용자가 운동 리마인더를 비활성화한 상태에서 THE Push_Notification_Service SHALL 운동 리마인더 알림을 전송하지 않는다

### Requirement 4: 주간 요약 알림

**User Story:** As a 사용자, I want to 주간 운동 요약을 알림으로 받고 싶다, so that 한 주간의 운동 성과를 확인할 수 있다.

#### Acceptance Criteria

1. WHEN 매주 일요일 오전 10시가 되면 THE Push_Notification_Service SHALL 주간 운동 완료율이 포함된 알림을 전송한다
2. WHILE 사용자가 주간 요약 알림을 비활성화한 상태에서 THE Push_Notification_Service SHALL 주간 요약 알림을 전송하지 않는다

### Requirement 5: 알림 구독 관리

**User Story:** As a 사용자, I want to 알림 구독을 해제하고 싶다, so that 더 이상 알림을 받지 않을 수 있다.

#### Acceptance Criteria

1. THE Notification_Settings_Page SHALL 전체 알림 해제 버튼을 제공한다
2. WHEN 사용자가 전체 알림을 해제하면 THE Push_Notification_Service SHALL Supabase에서 구독 정보를 삭제한다
3. WHEN 구독이 해제되면 THE Notification_Settings_Page SHALL 알림이 비활성화되었음을 표시한다
