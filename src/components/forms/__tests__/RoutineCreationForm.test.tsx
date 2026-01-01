import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import RoutineCreationForm from '../RoutineCreationForm';

// 모킹
vi.mock('../../../stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
    profile: {
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
      uncomfortableAreas: [],
      experienceLevel: '1year_3years',
      exerciseHistory: [],
      planDuration: 12,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }))
}));

vi.mock('../../../stores/routineStore', () => ({
  useRoutineStore: vi.fn(() => ({
    addRoutine: vi.fn()
  }))
}));

vi.mock('../../../services/ai', () => ({
  aiService: {
    generateRoutine: vi.fn()
  },
  AIServiceError: class AIServiceError extends Error {
    constructor(message: string, public code: string, public retryable: boolean = false) {
      super(message);
      this.name = 'AIServiceError';
    }
  }
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn()
  };
});

// 테스트 래퍼 컴포넌트
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('RoutineCreationForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('폼 렌더링', () => {
    it('모든 필수 요소가 렌더링되어야 함', () => {
      render(
        <TestWrapper>
          <RoutineCreationForm />
        </TestWrapper>
      );

      expect(screen.getByText('루틴 기간')).toBeInTheDocument();
      expect(screen.getByText('주당 운동 횟수')).toBeInTheDocument();
      expect(screen.getByText('분할 방식')).toBeInTheDocument();
      expect(screen.getByText('추가 요청사항')).toBeInTheDocument();
      expect(screen.getByText('AI 루틴 생성하기')).toBeInTheDocument();
    });

    it('기본값이 올바르게 설정되어야 함', () => {
      render(
        <TestWrapper>
          <RoutineCreationForm />
        </TestWrapper>
      );

      // 4주가 기본 선택되어야 함
      const fourWeeksOption = screen.getByDisplayValue('4');
      expect(fourWeeksOption).toBeChecked();

      // 3회가 기본 선택되어야 함
      const threeTimesOption = screen.getByDisplayValue('3');
      expect(threeTimesOption).toBeChecked();

      // 상체/하체가 기본 선택되어야 함
      const upperLowerOption = screen.getByDisplayValue('upper_lower');
      expect(upperLowerOption).toBeChecked();
    });
  });

  describe('분할 방식 추천', () => {
    it('주 2회 운동 시 전신을 추천해야 함', () => {
      render(
        <TestWrapper>
          <RoutineCreationForm />
        </TestWrapper>
      );

      // 주 2회 선택
      const twoTimesOption = screen.getByDisplayValue('2');
      fireEvent.click(twoTimesOption);

      // 전신에 추천 표시가 있어야 함
      expect(screen.getByText('추천')).toBeInTheDocument();
    });

    it('주 3-4회 운동 시 상체/하체를 추천해야 함', () => {
      render(
        <TestWrapper>
          <RoutineCreationForm />
        </TestWrapper>
      );

      // 기본값이 3회이므로 상체/하체가 추천되어야 함
      const recommendationText = screen.getByText(/상체\/하체.*을 추천합니다/);
      expect(recommendationText).toBeInTheDocument();
    });

    it('주 5회 이상 운동 시 푸쉬/풀/레그를 추천해야 함', () => {
      render(
        <TestWrapper>
          <RoutineCreationForm />
        </TestWrapper>
      );

      // 주 5회 선택
      const fiveTimesOption = screen.getByDisplayValue('5');
      fireEvent.click(fiveTimesOption);

      // 추천 텍스트가 업데이트되어야 함
      const recommendationText = screen.getByText(/푸쉬\/풀\/레그.*을 추천합니다/);
      expect(recommendationText).toBeInTheDocument();
    });
  });

  describe('사용자 인터랙션', () => {
    it('추가 요청사항을 입력할 수 있어야 함', () => {
      render(
        <TestWrapper>
          <RoutineCreationForm />
        </TestWrapper>
      );

      const additionalRequestInput = screen.getByPlaceholderText(/코어 운동을 더 많이/);
      fireEvent.change(additionalRequestInput, { target: { value: '코어 운동 추가' } });
      
      expect(additionalRequestInput).toHaveValue('코어 운동 추가');
    });

    it('루틴 기간을 선택할 수 있어야 함', () => {
      render(
        <TestWrapper>
          <RoutineCreationForm />
        </TestWrapper>
      );

      const eightWeeksOption = screen.getByDisplayValue('8');
      fireEvent.click(eightWeeksOption);
      
      expect(eightWeeksOption).toBeChecked();
    });

    it('주당 운동 횟수를 선택할 수 있어야 함', () => {
      render(
        <TestWrapper>
          <RoutineCreationForm />
        </TestWrapper>
      );

      const fiveTimesOption = screen.getByDisplayValue('5');
      fireEvent.click(fiveTimesOption);
      
      expect(fiveTimesOption).toBeChecked();
    });

    it('분할 방식을 선택할 수 있어야 함', () => {
      render(
        <TestWrapper>
          <RoutineCreationForm />
        </TestWrapper>
      );

      const fullBodyOption = screen.getByDisplayValue('full_body');
      fireEvent.click(fullBodyOption);
      
      expect(fullBodyOption).toBeChecked();
    });
  });

  describe('UI 상태', () => {
    it('제출 버튼이 활성화되어 있어야 함', () => {
      render(
        <TestWrapper>
          <RoutineCreationForm />
        </TestWrapper>
      );

      const submitButton = screen.getByText('AI 루틴 생성하기');
      expect(submitButton).not.toBeDisabled();
    });

    it('모든 옵션이 표시되어야 함', () => {
      render(
        <TestWrapper>
          <RoutineCreationForm />
        </TestWrapper>
      );

      // 루틴 기간 옵션들
      expect(screen.getByText('2주')).toBeInTheDocument();
      expect(screen.getByText('4주')).toBeInTheDocument();
      expect(screen.getByText('6주')).toBeInTheDocument();
      expect(screen.getByText('8주')).toBeInTheDocument();
      expect(screen.getByText('12주')).toBeInTheDocument();

      // 주당 운동 횟수 옵션들
      expect(screen.getByText('2회')).toBeInTheDocument();
      expect(screen.getByText('3회')).toBeInTheDocument();
      expect(screen.getByText('4회')).toBeInTheDocument();
      expect(screen.getByText('5회')).toBeInTheDocument();
      expect(screen.getByText('6회')).toBeInTheDocument();

      // 분할 방식 옵션들
      expect(screen.getByText('전신')).toBeInTheDocument();
      expect(screen.getByText('상체/하체')).toBeInTheDocument();
      expect(screen.getByText('푸쉬/풀/레그')).toBeInTheDocument();
    });
  });
});