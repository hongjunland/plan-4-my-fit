import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import TodayView from '../TodayView';
import useAuth from '../../../hooks/useAuth';
import useWorkoutLogs from '../../../hooks/useWorkoutLogs';
import { routinesService } from '../../../services/routines';

// Mock hooks and services
vi.mock('../../../hooks/useAuth');
vi.mock('../../../hooks/useWorkoutLogs');
vi.mock('../../../services/routines');

const mockUseAuth = vi.mocked(useAuth);
const mockUseWorkoutLogs = vi.mocked(useWorkoutLogs);
const mockRoutinesService = vi.mocked(routinesService);

describe('TodayView', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
  };

  const mockActiveRoutine = {
    id: 'routine-1',
    userId: 'user-1',
    name: '테스트 루틴',
    settings: {
      durationWeeks: 4,
      workoutsPerWeek: 3,
      splitType: 'full_body' as const,
    },
    workouts: [
      {
        id: 'workout-1',
        dayNumber: 1,
        name: 'Day 1 - 전신',
        exercises: [
          {
            id: 'exercise-1',
            name: '푸시업',
            sets: 3,
            reps: '10-12',
            muscleGroup: 'chest' as const,
          },
          {
            id: 'exercise-2',
            name: '스쿼트',
            sets: 3,
            reps: '15-20',
            muscleGroup: 'legs' as const,
          },
        ],
      },
    ],
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockWorkoutLogs = {
    toggleExerciseCompletion: vi.fn(),
    getWorkoutProgress: vi.fn(),
    isExerciseCompleted: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isLoading: false,
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
    });

    mockUseWorkoutLogs.mockReturnValue({
      ...mockWorkoutLogs,
      logs: [],
      isLoading: false,
      error: null,
      getTodayLogs: vi.fn(),
      getLogsByDate: vi.fn(),
      getWeeklyLogs: vi.fn(),
      getMonthlyLogs: vi.fn(),
      completeWorkout: vi.fn(),
      getStreakDays: vi.fn(),
      getMonthlyStats: vi.fn(),
      logWorkout: vi.fn(),
      getProgress: vi.fn(),
    });
  });

  it('활성 루틴이 없을 때 안내 메시지를 표시한다', async () => {
    mockRoutinesService.getActiveRoutine.mockResolvedValue(null);

    render(<TodayView />);

    await waitFor(() => {
      expect(screen.getByText(/활성화된 루틴이 없습니다/)).toBeInTheDocument();
      expect(screen.getByText(/루틴을 먼저 활성화해주세요/)).toBeInTheDocument();
    });
  });

  it('오늘의 운동을 올바르게 표시한다', async () => {
    mockRoutinesService.getActiveRoutine.mockResolvedValue(mockActiveRoutine);
    mockWorkoutLogs.getWorkoutProgress.mockResolvedValue({
      completedCount: 1,
      totalCount: 2,
      percentage: 50,
      isCompleted: false,
    });
    mockWorkoutLogs.isExerciseCompleted.mockReturnValue(false);

    render(<TodayView />);

    await waitFor(() => {
      expect(screen.getByText('오늘의 운동')).toBeInTheDocument();
      expect(screen.getByText('Day 1 - 전신')).toBeInTheDocument();
      expect(screen.getByText('푸시업')).toBeInTheDocument();
      expect(screen.getByText('스쿼트')).toBeInTheDocument();
      expect(screen.getByText('1/2 (50%)')).toBeInTheDocument();
    });
  });

  it('운동 완료 체크박스가 올바르게 동작한다', async () => {
    mockRoutinesService.getActiveRoutine.mockResolvedValue(mockActiveRoutine);
    mockWorkoutLogs.getWorkoutProgress.mockResolvedValue({
      completedCount: 0,
      totalCount: 2,
      percentage: 0,
      isCompleted: false,
    });
    mockWorkoutLogs.isExerciseCompleted.mockReturnValue(false);
    mockWorkoutLogs.toggleExerciseCompletion.mockResolvedValue({
      id: 'log-1',
      user_id: 'user-1',
      routine_id: 'routine-1',
      workout_id: 'workout-1',
      date: '2024-01-01',
      completed_exercises: ['exercise-1'],
      is_completed: false,
      created_at: '2024-01-01T00:00:00Z',
    });

    render(<TodayView />);

    await waitFor(() => {
      expect(screen.getByText('푸시업')).toBeInTheDocument();
    });

    // 첫 번째 운동의 체크박스 클릭
    const checkboxes = screen.getAllByRole('button');
    const exerciseCheckbox = checkboxes.find(button => 
      button.closest('div')?.textContent?.includes('푸시업')
    );
    
    if (exerciseCheckbox) {
      fireEvent.click(exerciseCheckbox);
      
      expect(mockWorkoutLogs.toggleExerciseCompletion).toHaveBeenCalledWith(
        'routine-1',
        'workout-1',
        'exercise-1',
        expect.any(String)
      );
    }
  });

  it('모든 운동 완료 시 축하 메시지를 표시한다', async () => {
    mockRoutinesService.getActiveRoutine.mockResolvedValue(mockActiveRoutine);
    mockWorkoutLogs.getWorkoutProgress.mockResolvedValue({
      completedCount: 2,
      totalCount: 2,
      percentage: 100,
      isCompleted: true,
    });
    mockWorkoutLogs.isExerciseCompleted.mockReturnValue(true);

    render(<TodayView />);

    await waitFor(() => {
      expect(screen.getByText(/오늘 운동을 완료했습니다/)).toBeInTheDocument();
      expect(screen.getByText('2/2 (100%)')).toBeInTheDocument();
    });
  });

  it('근육 그룹 태그가 올바르게 표시된다', async () => {
    mockRoutinesService.getActiveRoutine.mockResolvedValue(mockActiveRoutine);
    mockWorkoutLogs.getWorkoutProgress.mockResolvedValue({
      completedCount: 0,
      totalCount: 2,
      percentage: 0,
      isCompleted: false,
    });
    mockWorkoutLogs.isExerciseCompleted.mockReturnValue(false);

    render(<TodayView />);

    await waitFor(() => {
      expect(screen.getByText('가슴')).toBeInTheDocument(); // chest -> 가슴
      expect(screen.getByText('하체')).toBeInTheDocument(); // legs -> 하체
    });
  });

  it('로딩 상태를 올바르게 표시한다', () => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isLoading: true,
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(<TodayView />);

    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('에러 상태를 올바르게 표시한다', async () => {
    mockRoutinesService.getActiveRoutine.mockRejectedValue(new Error('네트워크 오류'));

    render(<TodayView />);

    await waitFor(() => {
      expect(screen.getByText('네트워크 오류')).toBeInTheDocument();
    });
  });
});