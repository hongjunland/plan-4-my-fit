import OpenAI from 'openai';
import type { Profile, RoutineSettings, Routine, MuscleGroup } from '../types';

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // 클라이언트 사이드에서 사용
});

// AI 응답 타입 정의
interface AIRoutineResponse {
  name: string;
  workouts: {
    dayNumber: number;
    name: string;
    exercises: {
      name: string;
      sets: number;
      reps: string;
      muscleGroup: MuscleGroup;
      description?: string;
      weight?: string;
    }[];
  }[];
}

// 에러 타입 정의
export class AIServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'AIServiceError';
  }
}

// 재시도 설정
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1초
  maxDelay: 10000, // 10초
};

// 재시도 가능한 에러인지 확인
function isRetryableError(error: any): boolean {
  if (error instanceof AIServiceError) {
    return error.retryable;
  }
  
  // 네트워크 에러는 재시도 가능
  if (error.message?.includes('network') || error.message?.includes('fetch')) {
    return true;
  }
  
  // OpenAI API 에러 코드 확인
  if (error.status) {
    // 429 (Rate limit), 500, 502, 503, 504는 재시도 가능
    return [429, 500, 502, 503, 504].includes(error.status);
  }
  
  return false;
}

// 지수 백오프로 재시도
async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number = RETRY_CONFIG.maxRetries
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0 && isRetryableError(error)) {
      const delay = Math.min(
        RETRY_CONFIG.baseDelay * Math.pow(2, RETRY_CONFIG.maxRetries - retries),
        RETRY_CONFIG.maxDelay
      );
      
      console.warn(`API 호출 실패, ${delay}ms 후 재시도... (남은 시도: ${retries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return withRetry(fn, retries - 1);
    }
    
    throw error;
  }
}

// 근육 그룹 한국어 매핑
const muscleGroupKorean: Record<MuscleGroup, string> = {
  chest: '가슴',
  back: '등',
  shoulders: '어깨',
  arms: '팔 (이두/삼두)',
  abs: '복근',
  legs: '하체 (대퇴/둔근/종아리)',
  full_body: '전신'
};

// 운동 장소별 장비 설명
const equipmentByLocation = {
  gym: '모든 헬스장 장비 사용 가능 (바벨, 덤벨, 머신, 케이블 등)',
  home: '홈트레이닝 장비 위주 (덤벨, 맨몸운동, 저항밴드, 요가매트)',
  outdoor: '야외 운동 위주 (맨몸운동, 공원 시설, 러닝, 계단 등)',
  mixed: '상황에 맞게 헬스장과 홈트레이닝 조합'
};

// 목표별 설명
const goalDescriptions = {
  strength: '근력 증가 - 무거운 중량으로 적은 반복',
  weight_loss: '체중 감량 - 유산소와 근력운동 조합, 높은 강도',
  endurance: '체력 향상 - 지구력 중심의 운동, 많은 반복',
  muscle_gain: '근육량 증가 - 중간 중량으로 적당한 반복',
  body_correction: '체형 교정 - 균형잡힌 전신 운동과 자세 교정'
};

// 체력 수준별 설명
const fitnessLevelDescriptions = {
  beginner: '운동 초보자 - 기본 동작 위주, 낮은 강도',
  novice: '초급자 - 기본기 다지기, 점진적 강도 증가',
  intermediate: '중급자 - 다양한 운동, 중간 강도',
  advanced: '상급자 - 고강도 운동, 복합 동작'
};

// 시스템 프롬프트 생성
function createSystemPrompt(): string {
  return `당신은 전문 피트니스 트레이너입니다.
사용자의 상세한 정보를 바탕으로 맞춤형 운동 루틴을 생성하세요.

사용자 정보 분석 원칙:
1. 연령/성별에 따른 운동 강도 조절
2. 운동 장소에 맞는 운동 선택 및 장비 활용
3. 체력 수준과 운동 경력에 맞는 난이도 설정
4. 운동 목표와 초점 부위 우선 반영
5. 불편한 부위는 절대 무리하지 않는 운동 구성
6. 기존 운동 경력 기반 중량/강도 설정
7. 주간 운동 횟수에 맞는 효율적인 분할 방식

안전 규칙 (필수 준수):
- 불편한 부위가 있으면 해당 부위에 부담을 주는 운동은 절대 포함하지 않음
- 운동 장소에 없는 장비를 사용하는 운동은 제외
- 체력 수준에 맞지 않는 고난도 운동은 피함
- 부상 위험이 높은 운동은 초보자에게 권하지 않음

운동 경력 활용:
- 운동 경력이 있으면 기존 중량을 기준으로 점진적 증가 제안
- 경력이 없으면 맨몸운동이나 가벼운 중량부터 시작
- 상세 기록이 있으면 해당 운동을 루틴에 포함하여 연속성 유지

근육 그룹 할당 규칙:
${Object.entries(muscleGroupKorean).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

운동 장소별 장비:
${Object.entries(equipmentByLocation).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

응답 형식 (JSON만):
{
  "name": "개인 맞춤 루틴 이름",
  "workouts": [
    {
      "dayNumber": 1,
      "name": "Day 1 - 상체 집중",
      "exercises": [
        {
          "name": "벤치프레스",
          "sets": 3,
          "reps": "8-10",
          "muscleGroup": "chest",
          "description": "가슴 근육 발달을 위한 기본 운동",
          "weight": "60kg (기존 경력 기준)" // 운동 경력이 있는 경우만
        }
      ]
    }
  ]
}`;
}

// 사용자 프롬프트 생성
function createUserPrompt(profile: Profile, settings: RoutineSettings): string {
  const uncomfortableAreasText = profile.uncomfortableAreas.length > 0 
    ? profile.uncomfortableAreas.join(', ') 
    : '없음';
  
  const exerciseHistoryText = profile.exerciseHistory && profile.exerciseHistory.length > 0
    ? profile.exerciseHistory.map(ex => `${ex.exerciseName}: ${ex.maxWeight}kg x ${ex.reps}회`).join(', ')
    : '없음';

  return `
사용자 기본 정보:
- 연령: ${profile.age}세
- 성별: ${profile.gender === 'male' ? '남성' : profile.gender === 'female' ? '여성' : '기타'}
- 신체: 키 ${profile.height}cm, 몸무게 ${profile.weight}kg

운동 환경:
- 운동 장소: ${profile.workoutLocation} (${equipmentByLocation[profile.workoutLocation]})
- 주간 운동 횟수: ${profile.weeklyWorkouts}회

목표 및 초점:
- 운동 목표: ${profile.goal} (${goalDescriptions[profile.goal]})
- 초점 부위: ${profile.focus}

신체 조건:
- 체력 수준: ${profile.fitnessLevel} (${fitnessLevelDescriptions[profile.fitnessLevel]})
- 불편한 부위: ${uncomfortableAreasText}
- 운동 경력: ${profile.experienceLevel}
- 기존 운동 기록: ${exerciseHistoryText}

플랜 설정:
- 전체 플랜 기간: ${profile.planDuration}주

루틴 생성 요청:
- 루틴 기간: ${settings.durationWeeks}주
- 주당 운동 횟수: ${settings.workoutsPerWeek}회
- 분할 방식: ${settings.splitType}
- 추가 요청사항: ${settings.additionalRequest || '없음'}

위 정보를 바탕으로 안전하고 효과적인 맞춤형 운동 루틴을 생성해주세요.
특히 불편한 부위(${uncomfortableAreasText})는 절대 무리하지 않도록 주의해주세요.
  `;
}

// AI 응답 검증
function validateAIResponse(response: any): AIRoutineResponse {
  if (!response || typeof response !== 'object') {
    throw new AIServiceError(
      'AI 응답 형식이 올바르지 않습니다.',
      'INVALID_RESPONSE_FORMAT'
    );
  }

  if (!response.name || typeof response.name !== 'string') {
    throw new AIServiceError(
      '루틴 이름이 누락되었습니다.',
      'MISSING_ROUTINE_NAME'
    );
  }

  if (!Array.isArray(response.workouts) || response.workouts.length === 0) {
    throw new AIServiceError(
      '운동 계획이 누락되었습니다.',
      'MISSING_WORKOUTS'
    );
  }

  // 각 운동일 검증
  for (const workout of response.workouts) {
    if (!workout.name || !Array.isArray(workout.exercises)) {
      throw new AIServiceError(
        '운동 계획 형식이 올바르지 않습니다.',
        'INVALID_WORKOUT_FORMAT'
      );
    }

    // 각 운동 검증
    for (const exercise of workout.exercises) {
      if (!exercise.name || !exercise.sets || !exercise.reps || !exercise.muscleGroup) {
        throw new AIServiceError(
          '운동 정보가 불완전합니다.',
          'INCOMPLETE_EXERCISE_INFO'
        );
      }

      // 근육 그룹 유효성 검사
      if (!Object.keys(muscleGroupKorean).includes(exercise.muscleGroup)) {
        throw new AIServiceError(
          `유효하지 않은 근육 그룹입니다: ${exercise.muscleGroup}`,
          'INVALID_MUSCLE_GROUP'
        );
      }
    }
  }

  return response as AIRoutineResponse;
}

// 루틴 생성 함수
async function generateRoutine(profile: Profile, settings: RoutineSettings): Promise<Routine> {
  // API 키 확인
  if (!import.meta.env.VITE_OPENAI_API_KEY) {
    throw new AIServiceError(
      'OpenAI API 키가 설정되지 않았습니다. 관리자에게 문의하세요.',
      'MISSING_API_KEY'
    );
  }

  try {
    const systemPrompt = createSystemPrompt();
    const userPrompt = createUserPrompt(profile, settings);

    const routine = await withRetry(async () => {
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini", // 비용 효율적인 모델 사용
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          response_format: { type: "json_object" },
          temperature: 0.7,
          max_tokens: 2000,
        });

        const content = response.choices[0].message.content;
        if (!content) {
          throw new AIServiceError(
            'AI 응답이 비어있습니다.',
            'EMPTY_RESPONSE',
            true // 재시도 가능
          );
        }

        let aiResponse: AIRoutineResponse;
        try {
          aiResponse = JSON.parse(content);
        } catch (parseError) {
          throw new AIServiceError(
            'AI 응답을 파싱할 수 없습니다.',
            'PARSE_ERROR',
            true // 재시도 가능
          );
        }

        // 응답 검증
        const validatedResponse = validateAIResponse(aiResponse);
        
        // AI 응답을 Routine 형태로 변환
        const routine: Routine = {
          id: crypto.randomUUID(),
          userId: profile.userId,
          name: validatedResponse.name,
          settings,
          workouts: validatedResponse.workouts.map(workout => ({
            id: crypto.randomUUID(),
            dayNumber: workout.dayNumber,
            name: workout.name,
            exercises: workout.exercises.map(exercise => ({
              id: crypto.randomUUID(),
              name: exercise.name,
              sets: exercise.sets,
              reps: exercise.reps,
              muscleGroup: exercise.muscleGroup,
              description: exercise.description
            }))
          })),
          isActive: false,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        return routine;
      } catch (error: any) {
        // OpenAI API 에러 처리
        if (error.status) {
          switch (error.status) {
            case 401:
              throw new AIServiceError(
                'OpenAI API 키가 올바르지 않습니다.',
                'INVALID_API_KEY'
              );
            case 429:
              throw new AIServiceError(
                'API 사용량이 초과되었습니다. 잠시 후 다시 시도해주세요.',
                'RATE_LIMIT_EXCEEDED',
                true
              );
            case 500:
            case 502:
            case 503:
            case 504:
              throw new AIServiceError(
                'OpenAI 서버에 일시적인 문제가 발생했습니다.',
                'SERVER_ERROR',
                true
              );
            default:
              throw new AIServiceError(
                `OpenAI API 오류 (${error.status}): ${error.message}`,
                'API_ERROR',
                error.status >= 500
              );
          }
        }

        // 네트워크 에러
        if (error.message?.includes('fetch') || error.message?.includes('network')) {
          throw new AIServiceError(
            '네트워크 연결을 확인해주세요.',
            'NETWORK_ERROR',
            true
          );
        }

        // 이미 AIServiceError인 경우 그대로 전파
        if (error instanceof AIServiceError) {
          throw error;
        }

        // 기타 에러
        throw new AIServiceError(
          'AI 루틴 생성 중 예상치 못한 오류가 발생했습니다.',
          'UNKNOWN_ERROR'
        );
      }
    });

    return routine;
  } catch (error) {
    console.error('AI 루틴 생성 오류:', error);
    
    // AIServiceError는 그대로 전파
    if (error instanceof AIServiceError) {
      throw error;
    }
    
    // 기타 에러는 일반적인 메시지로 변환
    throw new AIServiceError(
      'AI 루틴 생성 중 오류가 발생했습니다. 다시 시도해주세요.',
      'GENERATION_FAILED'
    );
  }
}

// AI 서비스 객체
export const aiService = {
  generateRoutine,
  
  // 테스트용 함수들
  createSystemPrompt,
  createUserPrompt,
  validateAIResponse,
  
  // 에러 클래스 export
  AIServiceError,
};