# 헬스 루틴 플래너 - 프로토타입 구현 가이드

## 프로젝트 요청

**React + TypeScript + Tailwind CSS**로 헬스 루틴 플래너 모바일 웹앱을 만들어주세요.

### 목적
시연용 목업 UI. 백엔드 없이 프론트엔드만으로 동작. 모든 데이터는 하드코딩 또는 localStorage 사용.

## 사용 방법

### Bolt.new에서 사용
1. 이 파일의 전체 내용을 복사
2. Bolt.new에 붙여넣기
3. 바로 프로토타입 생성 가능

### 일반 개발환경에서 사용
1. Vite + React + Tailwind 설정
2. 아래 컴포넌트 코드 참고
3. localStorage 연동

---

## 핵심 기능

1. **구글 로그인** (목업 - 버튼만)
2. **프로필 설정** (키, 몸무게, 목적, 체력수준)
3. **AI 루틴 생성** (목업 - 로딩 후 하드코딩 데이터)
4. **루틴 관리** (목록, 활성화/비활성화, 자유 편집)
5. **운동별 근육 그룹** (가슴, 등, 어깨, 팔, 복근, 하체, 전신)
6. **캘린더** (오늘/주간/월간 뷰)
7. **진행 상황** (통계)

---

## 화면 구성

### 라우트
- `/` - 로그인
- `/profile/setup` - 프로필 설정 (첫 사용자)
- `/my` - 마이페이지
- `/routines` - 루틴 목록
- `/routines/new` - 루틴 생성
- `/calendar` - 캘린더 (메인)
- `/progress` - 진행 상황

### 하단 네비게이션 (4개 탭)
```
[마이👤] [루틴📋] [캘린더📅] [진행📊]
```

---

## 유저 플로우

**첫 사용자:** 로그인 → 프로필 설정 → 루틴 생성 → 캘린더
**기존 사용자:** 로그인 → 캘린더

---

## 주요 화면 상세

### 1. 로그인 (`/`)
```
🏋️ 헬스 루틴 플래너
AI가 만드는 맞춤 루틴

[G Google로 계속하기] (큰 버튼)
```

### 2. 프로필 설정 (`/profile/setup`)
```
프로필 설정 1/2

키 (cm): [175] (숫자 입력)
몸무게 (kg): [70] (숫자 입력)

운동 목적: (4개 버튼)
[근력↑] [체중↓] [체력↑] [근육↑]

체력 수준: (4개 버튼)
[입문자] [초급자] [중급자] [상급자]

[다음 →] (버튼)
```

### 3. 루틴 생성 (`/routines/new`)
```
← 새 루틴 만들기

루틴 기간: (5개 버튼)
[2주] [4주] [6주] [8주] [12주]

주당 운동 횟수: (5개 버튼)
[2회] [3회] [4회] [5회] [6회]

분할 방식:
● 전신 (주 1-2회 추천)
○ 상체/하체 ⭐추천 (주 3-4회 추천)
○ 푸쉬/풀/레그 (주 5회+ 추천)

추가 요청 (선택):
[어깨 부상이 있어요] (텍스트 입력)

[🤖 AI 루틴 생성] (메인 버튼)
```

### 4. 루틴 목록 (`/routines`)
```
내 루틴 [+]

┌─────────────────────┐
│ 💪 상체/하체 4주     │
│ 4주 · 주3회 · 상/하  │
│ ✅ 활성화됨         │
│ [편집] [복제] [삭제] │
└─────────────────────┘

┌─────────────────────┐
│ 🏃 전신 2주 루틴     │
│ 2주 · 주2회 · 전신   │
│ [활성화하기]        │
│ [편집] [복제] [삭제] │
└─────────────────────┘
```

### 4-1. 루틴 편집 (`/routines/:id/edit`)
```
← 루틴 편집: 상체/하체 4주

Day 1 - 상체
┌─────────────────────┐
│ 🔴 벤치프레스 3×10   │ (가슴)
│ [수정] [삭제] [↑↓]  │
└─────────────────────┘
┌─────────────────────┐
│ 🔵 덤벨로우 3×12     │ (등)
│ [수정] [삭제] [↑↓]  │
└─────────────────────┘
┌─────────────────────┐
│ 🟠 숄더프레스 3×10   │ (어깨)
│ [수정] [삭제] [↑↓]  │
└─────────────────────┘

[+ 운동 추가]

Day 2 - 하체
...

[저장] [취소]
```

### 4-2. 운동 추가/수정 모달
```
운동 추가

운동명: [벤치프레스        ]
세트수: [3] 반복수: [8-10  ]

근육 그룹:
● 가슴 🔴   ○ 등 🔵
○ 어깨 🟠   ○ 팔 🟢  
○ 복근 🟣   ○ 하체 🟤
○ 전신 ⚫

[저장] [취소]
```

### 5. 캘린더 (`/calendar`) - 메인 화면

**상단 탭:** [오늘●] [주간] [월간]

**오늘 뷰:**
```
📅 12월 24일 (화)
Day 3 - 상체

진행률 ████████░░ 4/6

☑ 🔴 벤치프레스 3×10
☑ 🔵 덤벨로우 3×12
☑ 🟠 숄더프레스 3×10
☑ 🟠 사이드레터럴 3×15
☐ 🟢 바이셉컬 3×12
☐ 🟢 트라이셉 3×12
```

**주간 뷰:**
```
◀ 12월 4주차 ▶

┌───┬───┬───┬───┬───┐
│월 │화 │수 │목 │금 │
│23 │24 │25 │26 │27 │
├───┼───┼───┼───┼───┤
│상체│하체│휴식│상체│휴식│
│ ✅│ · │ - │ · │ - │
└───┴───┴───┴───┴───┘

12/24 (화) - 하체
🟤 스쿼트 4×10
🟤 레그프레스 3×12
🟤 런지 3×10
```

**월간 뷰:**
```
◀ 2024년 12월 ▶

일 월 화 수 목 금 토
 1  2  3  4  5  6  7
    ✅ ✅    ✅
 8  9 10 11 12 13 14
    ✅ ✅    ✅
15 16 17 18 19 20 21
    ✅ ✅    ✅
22 23 24 25 26 27 28
    ✅ ·     ·

이번 달: 10/12일 완료
```

### 6. 진행 상황 (`/progress`)
```
진행 상황

📊 이번 주
████████░░░░ 67%
2/3일 완료

📈 전체 루틴
████░░░░░░░░ 25%
3/12일 완료

🔥 연속 운동
3일 연속 달성!

📅 이번 달 기록
월 화 수 목 금 토 일
✅ ✅ · ✅ · · ·
✅ ✅ · ✅ · · ·
✅ · · · · · ·
```

---

## 토스 스타일 디자인

### 색상 (실제 토스 디자인 시스템 기반)
- **Primary Blue:** #3182f6 (토스 메인 블루)
- **Blue 50:** #f0f7ff
- **Blue 100:** #e0efff  
- **Blue 200:** #baddff
- **Blue 300:** #7cc4ff
- **Blue 400:** #3182f6 (메인)
- **Blue 500:** #1c6ef2
- **Blue 600:** #0f5bd9
- **Blue 700:** #0d47a1
- **Blue 800:** #1e3a8a
- **Blue 900:** #1e293b

### 그레이 스케일
- **Grey 50:** #f9fafb
- **Grey 100:** #f2f4f6
- **Grey 200:** #e5e8eb
- **Grey 300:** #d1d6db
- **Grey 400:** #b0b8c1
- **Grey 500:** #8b95a1
- **Grey 600:** #6b7684
- **Grey 700:** #4e5968
- **Grey 800:** #333d4b
- **Grey 900:** #191f28

### 시맨틱 컬러
- **Success:** #00c896 (토스 그린)
- **Warning:** #ffb800 (토스 옐로우)
- **Error:** #ff5757 (토스 레드)
- **Info:** #3182f6 (토스 블루)

### 스타일 원칙
- **둥근 모서리:** rounded-2xl (16px), rounded-3xl (24px)
- **그림자:** shadow-sm (미묘한 그림자)
- **넉넉한 패딩:** p-4 (16px), p-6 (24px)
- **큰 터치 영역:** min-h-12 (48px) 이상
- **그라데이션:** 진행률 바와 버튼에 사용

### 컴포넌트 예시 (실제 토스 스타일)
```jsx
// 메인 버튼 (토스 스타일)
<button className="bg-[#3182f6] hover:bg-[#1c6ef2] text-white px-6 py-4 rounded-2xl font-semibold text-lg shadow-lg w-full transition-all">
  🤖 AI 루틴 생성
</button>

// 카드 (토스 스타일)
<div className="bg-white rounded-3xl shadow-sm border border-[#e5e8eb] p-6 mb-4">
  <h3 className="text-lg font-bold text-[#191f28]">💪 상체/하체 4주</h3>
  <p className="text-sm text-[#6b7684] mt-1">4주 · 주3회 · 상/하체</p>
</div>

// 체크박스 항목 (토스 스타일)
<div className="flex items-center p-4 bg-white rounded-2xl border border-[#e5e8eb] mb-3">
  <div className="w-6 h-6 rounded-full border-2 border-[#3182f6] bg-[#3182f6] flex items-center justify-center mr-4">
    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  </div>
  <span className="text-lg font-medium text-[#191f28]">벤치프레스 3×10</span>
</div>

// 입력 필드 (토스 스타일)
<input 
  className="w-full px-4 py-4 bg-[#f9fafb] border-0 rounded-2xl text-lg font-medium placeholder-[#8b95a1] focus:bg-white focus:ring-2 focus:ring-[#3182f6] transition-all"
  placeholder="키를 입력해주세요"
/>

// 탭 (토스 스타일)
<div className="flex bg-[#f2f4f6] rounded-2xl p-1">
  <button className="flex-1 py-3 px-4 rounded-xl bg-white text-[#191f28] font-semibold shadow-sm">
    오늘
  </button>
  <button className="flex-1 py-3 px-4 rounded-xl text-[#6b7684] font-medium">
    주간
  </button>
  <button className="flex-1 py-3 px-4 rounded-xl text-[#6b7684] font-medium">
    월간
  </button>
</div>

// 진행률 바 (토스 스타일)
<div className="mb-4">
  <div className="flex justify-between items-center mb-2">
    <span className="text-sm font-medium text-[#4e5968]">진행률</span>
    <span className="text-sm font-bold text-[#3182f6]">4/6 완료</span>
  </div>
  <div className="w-full bg-[#f2f4f6] rounded-full h-3">
    <div className="bg-gradient-to-r from-[#3182f6] to-[#1c6ef2] h-3 rounded-full" style={{width: '67%'}}></div>
  </div>
</div>
```

---

## 하드코딩 데이터

### 샘플 루틴
```javascript
const sampleRoutines = [
  {
    id: "1",
    name: "상체/하체 4주 루틴",
    isActive: true,
    settings: { durationWeeks: 4, workoutsPerWeek: 3, splitType: "upper_lower" },
    workouts: [
      {
        id: "w1", dayNumber: 1, name: "Day 1 - 상체",
        exercises: [
          { id: "e1", name: "벤치프레스", sets: 3, reps: "8-10", muscleGroup: "chest", completed: false },
          { id: "e2", name: "덤벨로우", sets: 3, reps: "10-12", muscleGroup: "back", completed: false },
          { id: "e3", name: "숄더프레스", sets: 3, reps: "10", muscleGroup: "shoulders", completed: false },
          { id: "e4", name: "사이드레터럴", sets: 3, reps: "15", muscleGroup: "shoulders", completed: false },
          { id: "e5", name: "바이셉컬", sets: 3, reps: "12", muscleGroup: "arms", completed: false },
          { id: "e6", name: "트라이셉 푸시다운", sets: 3, reps: "12", muscleGroup: "arms", completed: false }
        ]
      },
      {
        id: "w2", dayNumber: 2, name: "Day 2 - 하체",
        exercises: [
          { id: "e7", name: "스쿼트", sets: 4, reps: "8-10", muscleGroup: "legs", completed: false },
          { id: "e8", name: "레그프레스", sets: 3, reps: "12", muscleGroup: "legs", completed: false },
          { id: "e9", name: "런지", sets: 3, reps: "10 (각)", muscleGroup: "legs", completed: false },
          { id: "e10", name: "레그컬", sets: 3, reps: "12", muscleGroup: "legs", completed: false },
          { id: "e11", name: "카프레이즈", sets: 4, reps: "15", muscleGroup: "legs", completed: false }
        ]
      }
    ]
  }
];

// 근육 그룹 색상 매핑
const muscleGroupColors = {
  chest: '#ef4444',     // 빨강
  back: '#3b82f6',      // 파랑
  shoulders: '#f97316', // 주황
  arms: '#22c55e',      // 초록
  abs: '#a855f7',       // 보라
  legs: '#a3a3a3',      // 갈색
  full_body: '#6b7280'  // 회색
};

// 근육 그룹 한글명
const muscleGroupNames = {
  chest: '가슴',
  back: '등',
  shoulders: '어깨',
  arms: '팔',
  abs: '복근',
  legs: '하체',
  full_body: '전신'
};
```

---

## 주요 기능

1. **React Router** 사용해서 페이지 이동
2. **localStorage**로 데이터 저장
3. **루틴 활성화** - 1개만 활성화 가능
4. **자유 루틴 편집** - 운동 추가/수정/삭제/순서변경
5. **근육 그룹 표시** - 색상 코딩으로 근육 부위 구분
6. **체크박스 토글** - 운동 완료 표시
7. **진행률 계산** - 완료/전체 비율
8. **AI 생성 시뮬레이션** - 2초 로딩 후 샘플 데이터
9. **반응형** - 모바일 최적화 (max-w-md)

---

## 요청사항

- 모바일 우선 디자인 (max-width: 448px)
- 토스 스타일 UI (둥근 모서리, 깔끔한 색상)
- 하단 네비게이션 고정
- localStorage로 데이터 관리
- 자유로운 루틴 편집 기능 (운동 추가/수정/삭제/순서변경)
- 근육 그룹별 색상 코딩 및 필터링
- 체크박스 토글 기능
- 루틴 활성화/비활성화 기능
- 캘린더 3가지 뷰 (오늘/주간/월간)
- 로딩 애니메이션 (AI 생성 시)
- 드래그 앤 드롭으로 운동 순서 변경

이 프롬프트로 Bolt.new에서 완전한 프로토타입을 만들 수 있을 거예요!