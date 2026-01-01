import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ExerciseItem from '../ExerciseItem';
import type { Exercise } from '../../../types';

const mockExercise: Exercise = {
  id: 'exercise-1',
  name: '벤치프레스',
  sets: 3,
  reps: '8-10',
  muscleGroup: 'chest',
  description: '가슴 근육을 발달시키는 운동',
};

describe('ExerciseItem', () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render exercise information correctly', () => {
    render(
      <ExerciseItem
        exercise={mockExercise}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('벤치프레스')).toBeInTheDocument();
    expect(screen.getByText('3세트')).toBeInTheDocument();
    expect(screen.getByText('8-10회')).toBeInTheDocument();
    expect(screen.getByText('가슴 근육을 발달시키는 운동')).toBeInTheDocument();
  });

  it('should render muscle group badge', () => {
    render(
      <ExerciseItem
        exercise={mockExercise}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('가슴')).toBeInTheDocument();
  });

  it('should call onEdit when edit button is clicked', () => {
    render(
      <ExerciseItem
        exercise={mockExercise}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const editButton = screen.getByTitle('운동 수정');
    fireEvent.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith(mockExercise);
  });

  it('should call onDelete when delete button is clicked', () => {
    render(
      <ExerciseItem
        exercise={mockExercise}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const deleteButton = screen.getByTitle('운동 삭제');
    fireEvent.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith('exercise-1');
  });

  it('should render without description when not provided', () => {
    const exerciseWithoutDescription = { ...mockExercise, description: undefined };
    
    render(
      <ExerciseItem
        exercise={exerciseWithoutDescription}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('벤치프레스')).toBeInTheDocument();
    expect(screen.queryByText('가슴 근육을 발달시키는 운동')).not.toBeInTheDocument();
  });

  it('should apply dragging styles when isDragging is true', () => {
    const { container } = render(
      <ExerciseItem
        exercise={mockExercise}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        isDragging={true}
      />
    );

    const exerciseElement = container.firstChild as HTMLElement;
    expect(exerciseElement).toHaveClass('shadow-lg', 'opacity-90');
  });

  it('should render drag handle with proper props', () => {
    const mockDragHandleProps = {
      'data-testid': 'drag-handle',
      onMouseDown: vi.fn(),
    };

    render(
      <ExerciseItem
        exercise={mockExercise}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        dragHandleProps={mockDragHandleProps}
      />
    );

    const dragHandle = screen.getByTestId('drag-handle');
    expect(dragHandle).toBeInTheDocument();
  });
});