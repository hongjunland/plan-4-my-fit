import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExerciseLibrary from '../ExerciseLibrary';

describe('ExerciseLibrary', () => {
  const mockOnClose = vi.fn();
  const mockOnSelectExercise = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render exercise library correctly', () => {
    render(
      <ExerciseLibrary
        isOpen={true}
        onClose={mockOnClose}
        onSelectExercise={mockOnSelectExercise}
      />
    );

    expect(screen.getByText('운동 라이브러리')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('운동명으로 검색...')).toBeInTheDocument();
    expect(screen.getByText('근육 그룹 필터')).toBeInTheDocument();
  });

  it('should display exercise list', () => {
    render(
      <ExerciseLibrary
        isOpen={true}
        onClose={mockOnClose}
        onSelectExercise={mockOnSelectExercise}
      />
    );

    // Check for some common exercises
    expect(screen.getByText('벤치프레스')).toBeInTheDocument();
    expect(screen.getByText('스쿼트')).toBeInTheDocument();
    expect(screen.getByText('데드리프트')).toBeInTheDocument();
    expect(screen.getByText('풀업')).toBeInTheDocument();
  });

  it('should filter exercises by search term', async () => {
    const user = userEvent.setup();
    
    render(
      <ExerciseLibrary
        isOpen={true}
        onClose={mockOnClose}
        onSelectExercise={mockOnSelectExercise}
      />
    );

    const searchInput = screen.getByPlaceholderText('운동명으로 검색...');
    await user.type(searchInput, '벤치');

    expect(screen.getByText('벤치프레스')).toBeInTheDocument();
    expect(screen.getByText('인클라인 벤치프레스')).toBeInTheDocument();
    expect(screen.queryByText('스쿼트')).not.toBeInTheDocument();
  });

  it('should filter exercises by muscle group', async () => {
    const user = userEvent.setup();
    
    render(
      <ExerciseLibrary
        isOpen={true}
        onClose={mockOnClose}
        onSelectExercise={mockOnSelectExercise}
      />
    );

    // Click on chest muscle group
    const chestButton = screen.getByText('가슴');
    await user.click(chestButton);

    expect(screen.getByText('벤치프레스')).toBeInTheDocument();
    expect(screen.getByText('인클라인 벤치프레스')).toBeInTheDocument();
    expect(screen.queryByText('스쿼트')).not.toBeInTheDocument();
    expect(screen.queryByText('데드리프트')).not.toBeInTheDocument();
  });

  it('should combine search and muscle group filters', async () => {
    const user = userEvent.setup();
    
    render(
      <ExerciseLibrary
        isOpen={true}
        onClose={mockOnClose}
        onSelectExercise={mockOnSelectExercise}
      />
    );

    const searchInput = screen.getByPlaceholderText('운동명으로 검색...');
    await user.type(searchInput, '프레스');

    const chestButton = screen.getByText('가슴');
    await user.click(chestButton);

    expect(screen.getByText('벤치프레스')).toBeInTheDocument();
    expect(screen.getByText('인클라인 벤치프레스')).toBeInTheDocument();
    expect(screen.queryByText('숄더 프레스')).not.toBeInTheDocument(); // Different muscle group
  });

  it('should clear filters when clear button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <ExerciseLibrary
        isOpen={true}
        onClose={mockOnClose}
        onSelectExercise={mockOnSelectExercise}
      />
    );

    const searchInput = screen.getByPlaceholderText('운동명으로 검색...');
    await user.type(searchInput, '벤치');

    const chestButton = screen.getByText('가슴');
    await user.click(chestButton);

    const clearButton = screen.getByText('필터 초기화');
    await user.click(clearButton);

    expect(searchInput).toHaveValue('');
    expect(screen.getByText('스쿼트')).toBeInTheDocument(); // Should show all exercises again
  });

  it('should call onSelectExercise when exercise is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <ExerciseLibrary
        isOpen={true}
        onClose={mockOnClose}
        onSelectExercise={mockOnSelectExercise}
      />
    );

    const benchPressCard = screen.getByText('벤치프레스').closest('div');
    await user.click(benchPressCard!);

    expect(mockOnSelectExercise).toHaveBeenCalledWith({
      name: '벤치프레스',
      muscleGroup: 'chest',
      description: '가슴 근육을 발달시키는 대표적인 운동',
      defaultSets: 3,
      defaultReps: '8-10',
    });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should call onSelectExercise when plus button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <ExerciseLibrary
        isOpen={true}
        onClose={mockOnClose}
        onSelectExercise={mockOnSelectExercise}
      />
    );

    const plusButtons = screen.getAllByTitle('운동 추가');
    await user.click(plusButtons[0]); // Click first plus button

    expect(mockOnSelectExercise).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should call onClose when X button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <ExerciseLibrary
        isOpen={true}
        onClose={mockOnClose}
        onSelectExercise={mockOnSelectExercise}
      />
    );

    const closeButton = screen.getByRole('button', { name: '' }); // X button
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should show no results message when no exercises match filters', async () => {
    const user = userEvent.setup();
    
    render(
      <ExerciseLibrary
        isOpen={true}
        onClose={mockOnClose}
        onSelectExercise={mockOnSelectExercise}
      />
    );

    const searchInput = screen.getByPlaceholderText('운동명으로 검색...');
    await user.type(searchInput, 'nonexistent exercise');

    expect(screen.getByText('검색 조건에 맞는 운동이 없습니다')).toBeInTheDocument();
  });

  it('should display exercise count', () => {
    render(
      <ExerciseLibrary
        isOpen={true}
        onClose={mockOnClose}
        onSelectExercise={mockOnSelectExercise}
      />
    );

    // Should show total count of exercises in library
    expect(screen.getByText(/총 \d+개의 운동/)).toBeInTheDocument();
  });

  it('should not render when isOpen is false', () => {
    render(
      <ExerciseLibrary
        isOpen={false}
        onClose={mockOnClose}
        onSelectExercise={mockOnSelectExercise}
      />
    );

    expect(screen.queryByText('운동 라이브러리')).not.toBeInTheDocument();
  });
});