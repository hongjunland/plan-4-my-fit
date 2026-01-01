import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MuscleGroupSelector from '../MuscleGroupSelector';
import { MuscleGroup } from '../../../types';
import { MUSCLE_GROUP_COLORS } from '../../../constants';

describe('MuscleGroupSelector', () => {
  const mockOnSelectionChange = vi.fn();

  beforeEach(() => {
    mockOnSelectionChange.mockClear();
  });

  it('renders all muscle group options', () => {
    render(
      <MuscleGroupSelector 
        selectedMuscleGroups={[]} 
        onSelectionChange={mockOnSelectionChange} 
      />
    );

    expect(screen.getByText('가슴')).toBeInTheDocument();
    expect(screen.getByText('등')).toBeInTheDocument();
    expect(screen.getByText('어깨')).toBeInTheDocument();
    expect(screen.getByText('팔')).toBeInTheDocument();
    expect(screen.getByText('복근')).toBeInTheDocument();
    expect(screen.getByText('하체')).toBeInTheDocument();
    expect(screen.getByText('전신')).toBeInTheDocument();
  });

  it('shows selected muscle groups with correct styling', () => {
    render(
      <MuscleGroupSelector 
        selectedMuscleGroups={['chest', 'back']} 
        onSelectionChange={mockOnSelectionChange} 
      />
    );

    const chestButton = screen.getByText('가슴');
    const backButton = screen.getByText('등');
    const shouldersButton = screen.getByText('어깨');

    expect(chestButton.className).toContain('text-white');
    expect(backButton.className).toContain('text-white');
    expect(shouldersButton.className).toContain('text-gray-700');
  });

  it('handles multiple selection correctly', () => {
    render(
      <MuscleGroupSelector 
        selectedMuscleGroups={['chest']} 
        onSelectionChange={mockOnSelectionChange}
        multiple={true}
      />
    );

    // Add another muscle group
    fireEvent.click(screen.getByText('등'));
    expect(mockOnSelectionChange).toHaveBeenCalledWith(['chest', 'back']);

    // Remove existing muscle group
    fireEvent.click(screen.getByText('가슴'));
    expect(mockOnSelectionChange).toHaveBeenCalledWith([]);
  });

  it('handles single selection correctly', () => {
    render(
      <MuscleGroupSelector 
        selectedMuscleGroups={['chest']} 
        onSelectionChange={mockOnSelectionChange}
        multiple={false}
      />
    );

    // Select different muscle group
    fireEvent.click(screen.getByText('등'));
    expect(mockOnSelectionChange).toHaveBeenCalledWith(['back']);

    // Deselect current muscle group
    fireEvent.click(screen.getByText('가슴'));
    expect(mockOnSelectionChange).toHaveBeenCalledWith([]);
  });

  it('applies custom className', () => {
    const { container } = render(
      <MuscleGroupSelector 
        selectedMuscleGroups={[]} 
        onSelectionChange={mockOnSelectionChange}
        className="custom-class"
      />
    );

    expect((container.firstChild as HTMLElement)?.className).toContain('custom-class');
  });

  // 요구사항 4-1.7: 근육 그룹별 색상 코딩 테스트
  describe('Color Mapping Tests (Requirement 4-1.7)', () => {
    it('applies correct background colors for selected items', () => {
      render(
        <MuscleGroupSelector 
          selectedMuscleGroups={['chest', 'back', 'shoulders', 'arms', 'abs', 'legs', 'full_body']} 
          onSelectionChange={mockOnSelectionChange} 
        />
      );

      const chestButton = screen.getByText('가슴');
      const backButton = screen.getByText('등');
      const shouldersButton = screen.getByText('어깨');
      const armsButton = screen.getByText('팔');
      const absButton = screen.getByText('복근');
      const legsButton = screen.getByText('하체');
      const fullBodyButton = screen.getByText('전신');

      expect(chestButton.style.backgroundColor).toBe('rgb(255, 107, 107)'); // #ff6b6b - 빨강
      expect(backButton.style.backgroundColor).toBe('rgb(77, 171, 247)'); // #4dabf7 - 파랑
      expect(shouldersButton.style.backgroundColor).toBe('rgb(255, 146, 43)'); // #ff922b - 주황
      expect(armsButton.style.backgroundColor).toBe('rgb(81, 207, 102)'); // #51cf66 - 초록
      expect(absButton.style.backgroundColor).toBe('rgb(151, 117, 250)'); // #9775fa - 보라
      expect(legsButton.style.backgroundColor).toBe('rgb(139, 90, 60)'); // #8b5a3c - 갈색
      expect(fullBodyButton.style.backgroundColor).toBe('rgb(134, 142, 150)'); // #868e96 - 회색
    });

    it('uses colors from MUSCLE_GROUP_COLORS constant for all muscle groups', () => {
      const allMuscleGroups: MuscleGroup[] = ['chest', 'back', 'shoulders', 'arms', 'abs', 'legs', 'full_body'];
      
      render(
        <MuscleGroupSelector 
          selectedMuscleGroups={allMuscleGroups} 
          onSelectionChange={mockOnSelectionChange} 
        />
      );

      allMuscleGroups.forEach((muscleGroup) => {
        const labels = {
          chest: '가슴',
          back: '등',
          shoulders: '어깨',
          arms: '팔',
          abs: '복근',
          legs: '하체',
          full_body: '전신'
        };
        
        const button = screen.getByText(labels[muscleGroup]);
        const expectedColor = MUSCLE_GROUP_COLORS[muscleGroup];
        
        // Convert hex to rgb for comparison
        const hexToRgb = (hex: string) => {
          const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
          return result ? `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})` : null;
        };
        
        expect(button.style.backgroundColor).toBe(hexToRgb(expectedColor));
      });
    });
  });

  // 요구사항 4-1.6: 근육 그룹별 필터링 테스트
  describe('Filtering Tests (Requirement 4-1.6)', () => {
    it('filters to single muscle group when clicked in single mode', () => {
      render(
        <MuscleGroupSelector 
          selectedMuscleGroups={[]} 
          onSelectionChange={mockOnSelectionChange}
          multiple={false}
        />
      );

      // Click on chest muscle group
      fireEvent.click(screen.getByText('가슴'));
      expect(mockOnSelectionChange).toHaveBeenCalledWith(['chest']);
    });

    it('filters to multiple muscle groups when clicked in multiple mode', () => {
      const { rerender } = render(
        <MuscleGroupSelector 
          selectedMuscleGroups={[]} 
          onSelectionChange={mockOnSelectionChange}
          multiple={true}
        />
      );

      // Click on chest muscle group
      fireEvent.click(screen.getByText('가슴'));
      expect(mockOnSelectionChange).toHaveBeenLastCalledWith(['chest']);

      // Simulate state update by re-rendering with new selection
      rerender(
        <MuscleGroupSelector 
          selectedMuscleGroups={['chest']} 
          onSelectionChange={mockOnSelectionChange}
          multiple={true}
        />
      );

      // Click on back muscle group (should add to selection)
      fireEvent.click(screen.getByText('등'));
      expect(mockOnSelectionChange).toHaveBeenLastCalledWith(['chest', 'back']);
    });

    it('removes muscle group from filter when clicked again in multiple mode', () => {
      render(
        <MuscleGroupSelector 
          selectedMuscleGroups={['chest', 'back']} 
          onSelectionChange={mockOnSelectionChange}
          multiple={true}
        />
      );

      // Click on chest muscle group to remove it
      fireEvent.click(screen.getByText('가슴'));
      expect(mockOnSelectionChange).toHaveBeenCalledWith(['back']);
    });

    it('clears filter when same muscle group clicked in single mode', () => {
      render(
        <MuscleGroupSelector 
          selectedMuscleGroups={['chest']} 
          onSelectionChange={mockOnSelectionChange}
          multiple={false}
        />
      );

      // Click on already selected chest muscle group to deselect
      fireEvent.click(screen.getByText('가슴'));
      expect(mockOnSelectionChange).toHaveBeenCalledWith([]);
    });

    it('switches filter to different muscle group in single mode', () => {
      render(
        <MuscleGroupSelector 
          selectedMuscleGroups={['chest']} 
          onSelectionChange={mockOnSelectionChange}
          multiple={false}
        />
      );

      // Click on different muscle group
      fireEvent.click(screen.getByText('등'));
      expect(mockOnSelectionChange).toHaveBeenCalledWith(['back']);
    });

    it('handles filtering with all muscle group types', () => {
      const allMuscleGroups: MuscleGroup[] = ['chest', 'back', 'shoulders', 'arms', 'abs', 'legs', 'full_body'];
      const labels = {
        chest: '가슴',
        back: '등',
        shoulders: '어깨',
        arms: '팔',
        abs: '복근',
        legs: '하체',
        full_body: '전신'
      };

      const { rerender } = render(
        <MuscleGroupSelector 
          selectedMuscleGroups={[]} 
          onSelectionChange={mockOnSelectionChange}
          multiple={true}
        />
      );

      // Test filtering for each muscle group
      let currentSelection: MuscleGroup[] = [];
      allMuscleGroups.forEach((muscleGroup, index) => {
        fireEvent.click(screen.getByText(labels[muscleGroup]));
        currentSelection = [...currentSelection, muscleGroup];
        expect(mockOnSelectionChange).toHaveBeenLastCalledWith(currentSelection);
        
        // Re-render with updated selection for next iteration
        rerender(
          <MuscleGroupSelector 
            selectedMuscleGroups={currentSelection} 
            onSelectionChange={mockOnSelectionChange}
            multiple={true}
          />
        );
      });
    });

    it('maintains filter state correctly during multiple operations', () => {
      const { rerender } = render(
        <MuscleGroupSelector 
          selectedMuscleGroups={['chest']} 
          onSelectionChange={mockOnSelectionChange}
          multiple={true}
        />
      );

      // Add back
      fireEvent.click(screen.getByText('등'));
      expect(mockOnSelectionChange).toHaveBeenLastCalledWith(['chest', 'back']);

      // Re-render with updated selection
      rerender(
        <MuscleGroupSelector 
          selectedMuscleGroups={['chest', 'back']} 
          onSelectionChange={mockOnSelectionChange}
          multiple={true}
        />
      );

      // Add shoulders
      fireEvent.click(screen.getByText('어깨'));
      expect(mockOnSelectionChange).toHaveBeenLastCalledWith(['chest', 'back', 'shoulders']);

      // Re-render with updated selection
      rerender(
        <MuscleGroupSelector 
          selectedMuscleGroups={['chest', 'back', 'shoulders']} 
          onSelectionChange={mockOnSelectionChange}
          multiple={true}
        />
      );

      // Remove chest
      fireEvent.click(screen.getByText('가슴'));
      expect(mockOnSelectionChange).toHaveBeenLastCalledWith(['back', 'shoulders']);
    });
  });
});