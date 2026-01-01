import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { aiService, AIServiceError } from '../ai';
import type { Profile, RoutineSettings } from '../../types';

// OpenAI 모킹
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: vi.fn()
        }
      }
    }))
  };
});

// 환경 변수 모킹
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_OPENAI_API_KEY: 'test-api-key'
  },
  writable: true
});

describe('AI Service', () => {
  let mockProfile: Profile;
  let mockSettings: RoutineSettings;
  let mockOpenAI: any;

  beforeEach(async () => {
    // 테스트용 프로필 데이터
    mockProfile = {
      userId: 'test-user-id',
      age: 30,
      gender: 'male',
      height: 175,
      weight: 70,
      workoutLocation: 'gym',
      weeklyWorkouts: 3,
      goal: 'muscle_gain',
      focus: 'full_body',
      fitnessLevel: 'intermediate',
      uncomfortableAreas: ['knee'],
      experienceLevel: '1year_3years',
      exerciseHistory: [
        { exerciseName: '벤치프레스', maxWeight: 60, reps: 8 },
        { exerciseName: '스쿼트', maxWeight: 80, reps: 10 }
      ],
      planDuration: 12,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // 테스트용 루틴 설정
    mockSettings = {
      durationWeeks: 4,
      workoutsPerWeek: 3,
      splitType: 'upper_lower',
      additionalRequest: '코어 운동을 더 포함해주세요'
    };

    // OpenAI 모킹 설정
    const OpenAI = vi.mocked(await import('openai')).default;
    mockOpenAI = new OpenAI();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createSystemPrompt', () => {
    it('시스템 프롬프트를 올바르게 생성해야 함', () => {
      const prompt = aiService.createSystemPrompt();
      
      expect(prompt).toContain('전문 피트니스 트레이너');
      expect(prompt).toContain('근육 그룹 할당 규칙');
      expect(prompt).toContain('운동 장소별 장비');
      expect(prompt).toContain('JSON');
    });
  });

  describe('createUserPrompt', () => {
    it('사용자 프롬프트를 올바르게 생성해야 함', () => {
      const prompt = aiService.createUserPrompt(mockProfile, mockSettings);
      
      expect(prompt).toContain('30세');
      expect(prompt).toContain('남성');
      expect(prompt).toContain('175cm');
      expect(prompt).toContain('70kg');
      expect(prompt).toContain('gym');
      expect(prompt).toContain('muscle_gain');
      expect(prompt).toContain('intermediate');
      expect(prompt).toContain('knee');
      expect(prompt).toContain('벤치프레스');
      expect(prompt).toContain('코어 운동을 더 포함해주세요');
    });

    it('불편한 부위가 없을 때 "없음"을 표시해야 함', () => {
      const profileWithoutDiscomfort = { ...mockProfile, uncomfortableAreas: [] };
      const prompt = aiService.createUserPrompt(profileWithoutDiscomfort, mockSettings);
      
      expect(prompt).toContain('불편한 부위: 없음');
    });

    it('운동 경력이 없을 때 "없음"을 표시해야 함', () => {
      const profileWithoutHistory = { ...mockProfile, exerciseHistory: [] };
      const prompt = aiService.createUserPrompt(profileWithoutHistory, mockSettings);
      
      expect(prompt).toContain('기존 운동 기록: 없음');
    });
  });

  describe('validateAIResponse', () => {
    it('유효한 AI 응답을 검증해야 함', () => {
      const validResponse = {
        name: '테스트 루틴',
        workouts: [
          {
            dayNumber: 1,
            name: 'Day 1 - 상체',
            exercises: [
              {
                name: '벤치프레스',
                sets: 3,
                reps: '8-10',
                muscleGroup: 'chest',
                description: '가슴 운동'
              }
            ]
          }
        ]
      };

      expect(() => aiService.validateAIResponse(validResponse)).not.toThrow();
    });

    it('루틴 이름이 없으면 에러를 발생시켜야 함', () => {
      const invalidResponse = {
        workouts: []
      };

      expect(() => aiService.validateAIResponse(invalidResponse))
        .toThrow(AIServiceError);
    });

    it('운동 계획이 없으면 에러를 발생시켜야 함', () => {
      const invalidResponse = {
        name: '테스트 루틴',
        workouts: []
      };

      expect(() => aiService.validateAIResponse(invalidResponse))
        .toThrow(AIServiceError);
    });

    it('유효하지 않은 근육 그룹이면 에러를 발생시켜야 함', () => {
      const invalidResponse = {
        name: '테스트 루틴',
        workouts: [
          {
            dayNumber: 1,
            name: 'Day 1',
            exercises: [
              {
                name: '테스트 운동',
                sets: 3,
                reps: '8-10',
                muscleGroup: 'invalid_muscle_group'
              }
            ]
          }
        ]
      };

      expect(() => aiService.validateAIResponse(invalidResponse))
        .toThrow(AIServiceError);
    });
  });

  describe('generateRoutine', () => {
    it('성공적으로 루틴을 생성해야 함', async () => {
      // OpenAI API 응답 모킹
      const mockAIResponse = {
        name: 'AI 생성 루틴',
        workouts: [
          {
            dayNumber: 1,
            name: 'Day 1 - 상체',
            exercises: [
              {
                name: '벤치프레스',
                sets: 3,
                reps: '8-10',
                muscleGroup: 'chest',
                description: '가슴 근육 발달'
              },
              {
                name: '풀업',
                sets: 3,
                reps: '6-8',
                muscleGroup: 'back',
                description: '등 근육 강화'
              }
            ]
          },
          {
            dayNumber: 2,
            name: 'Day 2 - 하체',
            exercises: [
              {
                name: '스쿼트',
                sets: 4,
                reps: '10-12',
                muscleGroup: 'legs',
                description: '하체 전체 운동'
              }
            ]
          }
        ]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(mockAIResponse)
            }
          }
        ]
      });

      const routine = await aiService.generateRoutine(mockProfile, mockSettings);

      expect(routine).toBeDefined();
      expect(routine.name).toBe('AI 생성 루틴');
      expect(routine.userId).toBe('test-user-id');
      expect(routine.settings).toEqual(mockSettings);
      expect(routine.workouts).toHaveLength(2);
      expect(routine.workouts[0].exercises).toHaveLength(2);
      expect(routine.workouts[1].exercises).toHaveLength(1);
      expect(routine.isActive).toBe(false);
    });

    it('API 키가 없으면 에러를 발생시켜야 함', async () => {
      // 환경 변수 모킹 제거
      Object.defineProperty(import.meta, 'env', {
        value: {
          VITE_OPENAI_API_KEY: ''
        },
        writable: true
      });

      await expect(aiService.generateRoutine(mockProfile, mockSettings))
        .rejects.toThrow(AIServiceError);
    });

    it('OpenAI API 401 에러를 처리해야 함', async () => {
      const apiError = new Error('API Error');
      (apiError as any).status = 401;
      
      mockOpenAI.chat.completions.create.mockRejectedValue(apiError);

      await expect(aiService.generateRoutine(mockProfile, mockSettings))
        .rejects.toThrow('OpenAI API 키가 올바르지 않습니다');
    });

    it('OpenAI API 429 에러를 처리해야 함', async () => {
      const apiError = new Error('Rate limit exceeded');
      (apiError as any).status = 429;
      
      mockOpenAI.chat.completions.create.mockRejectedValue(apiError);

      await expect(aiService.generateRoutine(mockProfile, mockSettings))
        .rejects.toThrow('API 사용량이 초과되었습니다');
    });

    it('네트워크 에러를 처리해야 함', async () => {
      const networkError = new Error('fetch failed');
      
      mockOpenAI.chat.completions.create.mockRejectedValue(networkError);

      await expect(aiService.generateRoutine(mockProfile, mockSettings))
        .rejects.toThrow('네트워크 연결을 확인해주세요');
    });

    it('빈 응답을 처리해야 함', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: null
            }
          }
        ]
      });

      await expect(aiService.generateRoutine(mockProfile, mockSettings))
        .rejects.toThrow(AIServiceError);
    });

    it('잘못된 JSON 응답을 처리해야 함', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: 'invalid json'
            }
          }
        ]
      });

      await expect(aiService.generateRoutine(mockProfile, mockSettings))
        .rejects.toThrow(AIServiceError);
    });
  });

  describe('AIServiceError', () => {
    it('커스텀 에러 클래스가 올바르게 작동해야 함', () => {
      const error = new AIServiceError('테스트 에러', 'TEST_ERROR', true);
      
      expect(error.message).toBe('테스트 에러');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.retryable).toBe(true);
      expect(error.name).toBe('AIServiceError');
      expect(error instanceof Error).toBe(true);
    });
  });
});