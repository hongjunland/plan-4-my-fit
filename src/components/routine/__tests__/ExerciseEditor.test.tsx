import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExerciseEditor from '../ExerciseEditor';
import type { Exercise } from '../../../types';

const mockExercise: Exercise = {
  id: 'exercise-1',
  name: '벤치프레스',
  sets: 3,
  reps: '8-10',
  muscleGroup: 'chest',
  description: '가슴 운동',
};

describe('ExerciseEditor', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render add mode correctly', () => {
    render(
      <ExerciseEditor
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByText('운동 추가')).toBeInTheDocument();
    expect(screen.getByText('운동 라이브러리에서 선택')).toBeInTheDocument();
    expect(screen.getByText('추가하기')).toBeInTheDocument();
  });

  it('should render edit mode correctly', () => {
    render(
      <ExerciseEditor
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        exercise={mockExercise}
      />
    );

    expect(screen.getByText('운동 수정')).toBeInTheDocument();
    expect(screen.queryByText('운동 라이브러리에서 선택')).not.toBeInTheDocument();
    expect(screen.getByText('수정하기')).toBeInTheDocument();
    
    // Check if form is populated with exercise data
    expect(screen.getByDisplayValue('벤치프레스')).toBeInTheDocument();
    expect(screen.getByDisplayValue('3')).toBeInTheDocument();
    expect(screen.getByDisplayValue('8-10')).toBeInTheDocument();
    expect(screen.getByDisplayValue('가슴 운동')).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup();
    
    render(
      <ExerciseEditor
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const submitButton = screen.getByText('추가하기');
    await user.click(submitButton);

    expect(screen.getByText('운동명을 입력해주세요')).toBeInTheDocument();
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('should validate sets range', async () => {
    const user = userEvent.setup();
    
    render(
      <ExerciseEditor
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const nameInput = screen.getByPlaceholderText('예: 벤치프레스');
    const setsInput = screen.getByDisplayValue('3');
    const submitButton = screen.getByText('추가하기');

    await user.type(nameInput, '테스트 운동');
    await user.clear(setsInput);
    await user.type(setsInput, '15');
    await user.click(submitButton);

    // The validation should prevent form submission
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('should submit form with valid data in add mode', async () => {
    const user = userEvent.setup();
    
    render(
      <ExerciseEditor
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const nameInput = screen.getByPlaceholderText('예: 벤치프레스');
    const repsInput = screen.getByDisplayValue('8-10');
    const descriptionInput = screen.getByPlaceholderText('운동 방법이나 주의사항을 입력하세요');
    const submitButton = screen.getByText('추가하기');

    await user.type(nameInput, '스쿼트');
    await user.clear(repsInput);
    await user.type(repsInput, '10-12');
    await user.type(descriptionInput, '하체 운동');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        name: '스쿼트',
        sets: 3,
        reps: '10-12',
        muscleGroup: 'chest',
        description: '하체 운동',
      });
    });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should submit form with valid data in edit mode', async () => {
    const user = userEvent.setup();
    
    render(
      <ExerciseEditor
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        exercise={mockExercise}
      />
    );

    const nameInput = screen.getByDisplayValue('벤치프레스');
    const submitButton = screen.getByText('수정하기');

    await user.clear(nameInput);
    await user.type(nameInput, '인클라인 벤치프레스');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        ...mockExercise,
        name: '인클라인 벤치프레스',
      });
    });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should call onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <ExerciseEditor
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const cancelButton = screen.getByText('취소');
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should call onClose when X button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <ExerciseEditor
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    // Find the X button inside the ExerciseEditor (not the Modal's X button)
    const closeButtons = screen.getAllByRole('button');
    const exerciseEditorCloseButton = closeButtons.find(button => 
      button.querySelector('svg.lucide-x.text-gray-500')
    );
    
    expect(exerciseEditorCloseButton).toBeDefined();
    await user.click(exerciseEditorCloseButton!);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should clear errors when input changes', async () => {
    const user = userEvent.setup();
    
    render(
      <ExerciseEditor
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const submitButton = screen.getByText('추가하기');
    await user.click(submitButton);

    expect(screen.getByText('운동명을 입력해주세요')).toBeInTheDocument();

    const nameInput = screen.getByPlaceholderText('예: 벤치프레스');
    await user.type(nameInput, '테스트');

    expect(screen.queryByText('운동명을 입력해주세요')).not.toBeInTheDocument();
  });

  it('should not render when isOpen is false', () => {
    render(
      <ExerciseEditor
        isOpen={false}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    expect(screen.queryByText('운동 추가')).not.toBeInTheDocument();
  });
});