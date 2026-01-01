# API 문서

## 📋 개요

Plan4MyFit의 API는 Supabase를 기반으로 구축되었으며, RESTful API 패턴을 따릅니다. 모든 API는 JWT 토큰을 통한 인증이 필요합니다.

### Base URL
```
Production: https://your-project.supabase.co/rest/v1
Development: http://localhost:54321/rest/v1
```

### 인증
모든 API 요청에는 다음 헤더가 필요합니다:
```http
Authorization: Bearer <jwt_token>
apikey: <supabase_anon_key>
Content-Type: application/json
```

---

## 🔐 인증 (Authentication)

### Google OAuth 로그인
Supabase Auth를 통한 Google OAuth 인증을 사용합니다.

```typescript
// 로그인
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`
  }
});

// 로그아웃
const { error } = await supabase.auth.signOut();

// 현재 사용자 정보
const { data: { user } } = await supabase.auth.getUser();
```

---

## 👤 프로필 (Profiles)

### 프로필 조회
```http
GET /profiles?user_id=eq.{user_id}
```

**Response:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "age": 30,
  "gender": "male",
  "height": 175,
  "weight": 70,
  "workout_location": "gym",
  "weekly_workouts": 3,
  "goal": "muscle_gain",
  "focus": "full_body",
  "fitness_level": "intermediate",
  "uncomfortable_areas": ["back", "knee"],
  "experience_level": "1year_3years",
  "exercise_history": [
    {
      "exerciseName": "벤치프레스",
      "maxWeight": 60,
      "reps": 8
    }
  ],
  "plan_duration": 12,
  "created_at": "2025-01-02T10:00:00Z",
  "updated_at": "2025-01-02T10:00:00Z"
}
```

### 프로필 생성/수정
```http
POST /profiles
PUT /profiles?user_id=eq.{user_id}
```

**Request Body:**
```json
{
  "user_id": "uuid",
  "age": 30,
  "gender": "male",
  "height": 175,
  "weight": 70,
  "workout_location": "gym",
  "weekly_workouts": 3,
  "goal": "muscle_gain",
  "focus": "full_body",
  "fitness_level": "intermediate",
  "uncomfortable_areas": ["back"],
  "experience_level": "1year_3years",
  "exercise_history": [],
  "plan_duration": 12
}
```

---

## 📋 루틴 (Routines)

### 루틴 목록 조회
```http
GET /routines?user_id=eq.{user_id}&order=created_at.desc
```

**Response:**
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "name": "상체 집중 루틴",
    "settings": {
      "durationWeeks": 8,
      "workoutsPerWeek": 3,
      "splitType": "upper_lower",
      "additionalRequest": "상체 중심으로 구성해주세요"
    },
    "workouts": [
      {
        "id": "workout_1",
        "dayNumber": 1,
        "name": "Day 1 - 상체",
        "exercises": [
          {
            "id": "ex_1",
            "name": "벤치프레스",
            "sets": 3,
            "reps": "8-10",
            "muscleGroup": "chest",
            "description": "가슴 근육 발달을 위한 기본 운동"
          }
        ]
      }
    ],
    "is_active": true,
    "created_at": "2025-01-02T10:00:00Z",
    "updated_at": "2025-01-02T10:00:00Z"
  }
]
```

### 활성 루틴 조회
```http
GET /routines?user_id=eq.{user_id}&is_active=eq.true&limit=1
```

### 루틴 생성
```http
POST /routines
```

**Request Body:**
```json
{
  "user_id": "uuid",
  "name": "새 루틴",
  "settings": {
    "durationWeeks": 8,
    "workoutsPerWeek": 3,
    "splitType": "full_body",
    "additionalRequest": ""
  },
  "workouts": [],
  "is_active": false
}
```

### 루틴 수정
```http
PUT /routines?id=eq.{routine_id}
```

### 루틴 삭제
```http
DELETE /routines?id=eq.{routine_id}
```

### 루틴 활성화
```http
PUT /routines?user_id=eq.{user_id}
```

**Request Body:**
```json
{
  "is_active": false  // 모든 루틴 비활성화
}
```

```http
PUT /routines?id=eq.{routine_id}
```

**Request Body:**
```json
{
  "is_active": true  // 특정 루틴 활성화
}
```

---

## 📅 운동 기록 (Workout Logs)

### 운동 기록 조회
```http
GET /workout_logs?user_id=eq.{user_id}&date=eq.{date}
```

**Response:**
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "routine_id": "uuid",
    "workout_id": "workout_1",
    "date": "2025-01-02",
    "completed_exercises": ["ex_1", "ex_2"],
    "is_completed": false,
    "created_at": "2025-01-02T10:00:00Z"
  }
]
```

### 주간 기록 조회
```http
GET /workout_logs?user_id=eq.{user_id}&date=gte.{start_date}&date=lte.{end_date}
```

### 월간 기록 조회
```http
GET /workout_logs?user_id=eq.{user_id}&date=gte.{month_start}&date=lte.{month_end}
```

### 운동 기록 저장/업데이트
```http
POST /workout_logs
```

**Request Body:**
```json
{
  "user_id": "uuid",
  "routine_id": "uuid",
  "workout_id": "workout_1",
  "date": "2025-01-02",
  "completed_exercises": ["ex_1"],
  "is_completed": false
}
```

---

## 🤖 AI 루틴 생성

### OpenAI API 호출
AI 루틴 생성은 클라이언트에서 직접 OpenAI API를 호출합니다.

```typescript
const generateRoutine = async (profile: Profile, settings: RoutineSettings) => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7
    })
  });

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
};
```

---

## 📊 통계 및 분석

### 진행률 통계
클라이언트에서 계산되는 통계들:

```typescript
// 주간 완료율
const getWeeklyCompletionRate = (logs: WorkoutLog[]) => {
  const thisWeek = getThisWeekLogs(logs);
  const completed = thisWeek.filter(log => log.is_completed).length;
  return (completed / thisWeek.length) * 100;
};

// 연속 운동 일수
const getStreakDays = (logs: WorkoutLog[]) => {
  const sortedLogs = logs.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  let streak = 0;
  for (const log of sortedLogs) {
    if (log.is_completed) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
};
```

---

## 🔒 보안 및 권한

### Row Level Security (RLS)
모든 테이블에 RLS가 적용되어 있습니다:

```sql
-- Profiles 테이블
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Routines 테이블
CREATE POLICY "Users can manage own routines" ON routines
  FOR ALL USING (auth.uid() = user_id);

-- Workout Logs 테이블
CREATE POLICY "Users can manage own workout logs" ON workout_logs
  FOR ALL USING (auth.uid() = user_id);
```

### API 키 보안
- 환경 변수를 통한 API 키 관리
- 클라이언트에서는 Supabase anon key만 노출
- OpenAI API 키는 서버 환경에서만 사용

---

## 🚨 에러 처리

### 공통 에러 코드
```json
{
  "error": {
    "code": "PGRST116",
    "message": "The result contains 0 rows",
    "details": null,
    "hint": null
  }
}
```

### 에러 타입
- `400 Bad Request`: 잘못된 요청 데이터
- `401 Unauthorized`: 인증 실패
- `403 Forbidden`: 권한 없음
- `404 Not Found`: 리소스 없음
- `409 Conflict`: 데이터 충돌
- `500 Internal Server Error`: 서버 오류

### 클라이언트 에러 처리
```typescript
const handleApiError = (error: any) => {
  if (error.code === 'PGRST116') {
    // 데이터 없음
    return null;
  } else if (error.code === '23505') {
    // 중복 데이터
    throw new Error('이미 존재하는 데이터입니다.');
  } else {
    // 기타 에러
    throw new Error('서버 오류가 발생했습니다.');
  }
};
```

---

## 📈 성능 최적화

### 쿼리 최적화
```typescript
// 필요한 컬럼만 선택
const { data } = await supabase
  .from('routines')
  .select('id, name, is_active, created_at')
  .eq('user_id', userId);

// 인덱스 활용
const { data } = await supabase
  .from('workout_logs')
  .select('*')
  .eq('user_id', userId)
  .gte('date', startDate)
  .lte('date', endDate)
  .order('date', { ascending: false });
```

### 캐싱 전략
```typescript
// React Query를 통한 캐싱
const useRoutines = (userId: string) => {
  return useQuery({
    queryKey: ['routines', userId],
    queryFn: () => fetchRoutines(userId),
    staleTime: 5 * 60 * 1000, // 5분
    cacheTime: 10 * 60 * 1000, // 10분
  });
};
```

---

## 🧪 테스트

### API 테스트 예시
```typescript
describe('Routines API', () => {
  test('should fetch user routines', async () => {
    const routines = await fetchRoutines(userId);
    expect(routines).toBeInstanceOf(Array);
    expect(routines[0]).toHaveProperty('id');
    expect(routines[0]).toHaveProperty('name');
  });

  test('should create new routine', async () => {
    const newRoutine = {
      name: 'Test Routine',
      settings: { durationWeeks: 4, workoutsPerWeek: 3 }
    };
    
    const created = await createRoutine(newRoutine);
    expect(created).toHaveProperty('id');
    expect(created.name).toBe('Test Routine');
  });
});
```

---

## 📝 변경 로그

### v1.0.0 (2025-01-02)
- 초기 API 구조 설계
- 인증, 프로필, 루틴, 운동 기록 API 구현
- RLS 보안 정책 적용

---

**API 문서는 지속적으로 업데이트됩니다. 최신 정보는 코드를 참조해주세요.**