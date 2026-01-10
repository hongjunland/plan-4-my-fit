# Requirements Document

## Introduction

구글 캘린더와 연동하여 운동 일정을 자동으로 동기화하는 기능입니다. 사용자가 루틴을 활성화하면 해당 운동 일정이 구글 캘린더에 자동으로 등록되고, 루틴 변경 시 캘린더도 함께 업데이트됩니다.

## Glossary

- **Google_Calendar_Service**: 구글 캘린더 API와 통신하는 서비스
- **Calendar_Settings_Page**: 캘린더 연동 설정을 관리하는 페이지 컴포넌트
- **Calendar_Event**: 구글 캘린더에 등록되는 운동 일정 이벤트
- **OAuth_Token**: 구글 API 접근을 위한 인증 토큰
- **Sync_Status**: 캘린더 동기화 상태 (연동됨, 연동 해제됨, 동기화 중)

## Requirements

### Requirement 1: 구글 계정 연동

**User Story:** As a 사용자, I want to 구글 계정을 연동하고 싶다, so that 운동 일정을 구글 캘린더에서 볼 수 있다.

#### Acceptance Criteria

1. THE Calendar_Settings_Page SHALL 구글 캘린더 연동 버튼을 제공한다
2. WHEN 사용자가 연동 버튼을 클릭하면 THE Google_Calendar_Service SHALL 구글 OAuth 인증 플로우를 시작한다
3. WHEN 사용자가 구글 인증을 완료하면 THE Google_Calendar_Service SHALL OAuth 토큰을 Supabase에 안전하게 저장한다
4. WHEN 연동이 완료되면 THE Calendar_Settings_Page SHALL 연동된 구글 계정 정보를 표시한다
5. IF OAuth 인증이 실패하면 THEN THE Calendar_Settings_Page SHALL 에러 메시지를 표시하고 재시도 옵션을 제공한다

### Requirement 2: 운동 일정 자동 등록

**User Story:** As a 사용자, I want to 활성화된 루틴의 운동 일정이 자동으로 캘린더에 등록되길 원한다, so that 다른 일정과 함께 운동 일정을 관리할 수 있다.

#### Acceptance Criteria

1. WHEN 사용자가 루틴을 활성화하면 THE Google_Calendar_Service SHALL 해당 루틴의 모든 운동 일정을 구글 캘린더에 등록한다
2. THE Calendar_Event SHALL 운동 이름, 운동 목록, 예상 소요 시간을 포함한다
3. WHEN 일정 등록이 완료되면 THE Google_Calendar_Service SHALL 등록된 이벤트 ID를 Supabase에 저장한다
4. IF 캘린더 등록이 실패하면 THEN THE Google_Calendar_Service SHALL 에러를 로깅하고 사용자에게 알린다

### Requirement 3: 운동 일정 수정

**User Story:** As a 사용자, I want to 루틴을 수정하면 캘린더 일정도 함께 수정되길 원한다, so that 캘린더가 항상 최신 상태를 유지한다.

#### Acceptance Criteria

1. WHEN 사용자가 활성화된 루틴의 운동을 수정하면 THE Google_Calendar_Service SHALL 해당 캘린더 이벤트를 업데이트한다
2. WHEN 사용자가 루틴의 운동 요일을 변경하면 THE Google_Calendar_Service SHALL 기존 이벤트를 삭제하고 새 일정을 등록한다
3. WHEN 수정이 완료되면 THE Calendar_Settings_Page SHALL 마지막 동기화 시간을 업데이트한다

### Requirement 4: 운동 일정 삭제

**User Story:** As a 사용자, I want to 루틴을 비활성화하면 캘린더 일정도 삭제되길 원한다, so that 불필요한 일정이 캘린더에 남지 않는다.

#### Acceptance Criteria

1. WHEN 사용자가 루틴을 비활성화하면 THE Google_Calendar_Service SHALL 해당 루틴의 모든 캘린더 이벤트를 삭제한다
2. WHEN 사용자가 루틴을 삭제하면 THE Google_Calendar_Service SHALL 해당 루틴의 모든 캘린더 이벤트를 삭제한다
3. WHEN 삭제가 완료되면 THE Google_Calendar_Service SHALL Supabase에서 이벤트 ID 매핑을 제거한다

### Requirement 5: 캘린더 연동 해제

**User Story:** As a 사용자, I want to 구글 캘린더 연동을 해제하고 싶다, so that 더 이상 일정이 동기화되지 않는다.

#### Acceptance Criteria

1. THE Calendar_Settings_Page SHALL 연동 해제 버튼을 제공한다
2. WHEN 사용자가 연동 해제를 요청하면 THE Calendar_Settings_Page SHALL 확인 다이얼로그를 표시한다
3. WHEN 사용자가 연동 해제를 확인하면 THE Google_Calendar_Service SHALL 모든 등록된 캘린더 이벤트를 삭제한다
4. WHEN 연동 해제가 완료되면 THE Google_Calendar_Service SHALL Supabase에서 OAuth 토큰과 이벤트 매핑을 삭제한다
5. WHEN 연동 해제가 완료되면 THE Calendar_Settings_Page SHALL 연동 해제 상태를 표시한다

### Requirement 6: 동기화 상태 표시

**User Story:** As a 사용자, I want to 캘린더 동기화 상태를 확인하고 싶다, so that 일정이 제대로 동기화되고 있는지 알 수 있다.

#### Acceptance Criteria

1. THE Calendar_Settings_Page SHALL 현재 동기화 상태를 표시한다 (연동됨, 연동 해제됨, 동기화 중, 오류)
2. THE Calendar_Settings_Page SHALL 마지막 동기화 시간을 표시한다
3. THE Calendar_Settings_Page SHALL 수동 동기화 버튼을 제공한다
4. WHEN 사용자가 수동 동기화를 요청하면 THE Google_Calendar_Service SHALL 모든 활성 루틴의 일정을 다시 동기화한다
