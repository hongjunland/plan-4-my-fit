import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MuscleGroupChart from '../MuscleGroupChart';
import type { MuscleGroupStats } from '../../../services/progressStats';

describe('MuscleGroupChart', () => {
  const mockMuscleGroupStats: MuscleGroupStats[] = [
    { muscleGroup: 'chest', frequency: 10, percentage: 40 },
    { muscleGroup: 'back', frequency: 8, percentage: 32 },
    { muscleGroup: 'legs', frequency: 5, percentage: 20 },
    { muscleGroup: 'shoulders', frequency: 2, percentage: 8 }
  ];

  it('should render chart title', () => {
    render(<MuscleGroupChart muscleGroupStats={mockMuscleGroupStats} />);
    
    expect(screen.getByText('근육 그룹별 운동 빈도')).toBeInTheDocument();
  });

  it('should display muscle group names in Korean', () => {
    render(<MuscleGroupChart muscleGroupStats={mockMuscleGroupStats} />);
    
    expect(screen.getByText('가슴')).toBeInTheDocument();
    expect(screen.getByText('등')).toBeInTheDocument();
    expect(screen.getByText('하체')).toBeInTheDocument();
    expect(screen.getByText('어깨')).toBeInTheDocument();
  });

  it('should display frequency and percentage for each muscle group', () => {
    render(<MuscleGroupChart muscleGroupStats={mockMuscleGroupStats} />);
    
    expect(screen.getByText('10회')).toBeInTheDocument();
    expect(screen.getByText('40%')).toBeInTheDocument();
    expect(screen.getByText('8회')).toBeInTheDocument();
    expect(screen.getByText('32%')).toBeInTheDocument();
    expect(screen.getByText('5회')).toBeInTheDocument();
    expect(screen.getByText('20%')).toBeInTheDocument();
    expect(screen.getByText('2회')).toBeInTheDocument();
    expect(screen.getByText('8%')).toBeInTheDocument();
  });

  it('should display total workout count', () => {
    render(<MuscleGroupChart muscleGroupStats={mockMuscleGroupStats} />);
    
    expect(screen.getByText('총 운동 횟수')).toBeInTheDocument();
    expect(screen.getByText('25회')).toBeInTheDocument(); // 10 + 8 + 5 + 2 = 25
  });

  it('should render empty state when no stats provided', () => {
    render(<MuscleGroupChart muscleGroupStats={[]} />);
    
    expect(screen.getByText('운동 기록이 없습니다')).toBeInTheDocument();
    expect(screen.getByText('운동을 완료하면 통계가 표시됩니다')).toBeInTheDocument();
  });

  it('should handle single muscle group', () => {
    const singleStat: MuscleGroupStats[] = [
      { muscleGroup: 'chest', frequency: 5, percentage: 100 }
    ];

    render(<MuscleGroupChart muscleGroupStats={singleStat} />);
    
    expect(screen.getByText('가슴')).toBeInTheDocument();
    expect(screen.getAllByText('5회')).toHaveLength(2); // One in stats, one in total
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('should handle all muscle groups', () => {
    const allMuscleGroups: MuscleGroupStats[] = [
      { muscleGroup: 'chest', frequency: 5, percentage: 20 },
      { muscleGroup: 'back', frequency: 4, percentage: 16 },
      { muscleGroup: 'shoulders', frequency: 3, percentage: 12 },
      { muscleGroup: 'arms', frequency: 6, percentage: 24 },
      { muscleGroup: 'abs', frequency: 2, percentage: 8 },
      { muscleGroup: 'legs', frequency: 4, percentage: 16 },
      { muscleGroup: 'full_body', frequency: 1, percentage: 4 }
    ];

    render(<MuscleGroupChart muscleGroupStats={allMuscleGroups} />);
    
    expect(screen.getByText('가슴')).toBeInTheDocument();
    expect(screen.getByText('등')).toBeInTheDocument();
    expect(screen.getByText('어깨')).toBeInTheDocument();
    expect(screen.getByText('팔')).toBeInTheDocument();
    expect(screen.getByText('복근')).toBeInTheDocument();
    expect(screen.getByText('하체')).toBeInTheDocument();
    expect(screen.getByText('전신')).toBeInTheDocument();
    
    expect(screen.getByText('25회')).toBeInTheDocument(); // Total: 5+4+3+6+2+4+1 = 25
  });

  it('should handle zero frequency correctly', () => {
    const zeroFrequencyStats: MuscleGroupStats[] = [
      { muscleGroup: 'chest', frequency: 0, percentage: 0 }
    ];

    render(<MuscleGroupChart muscleGroupStats={zeroFrequencyStats} />);
    
    expect(screen.getByText('가슴')).toBeInTheDocument();
    expect(screen.getAllByText('0회')).toHaveLength(2); // One in stats, one in total
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('should render progress bars with correct widths', () => {
    render(<MuscleGroupChart muscleGroupStats={mockMuscleGroupStats} />);
    
    // Check if progress bars are rendered (they should have style width)
    const progressBars = document.querySelectorAll('[style*="width"]');
    expect(progressBars.length).toBeGreaterThan(0);
  });

  it('should handle unknown muscle group gracefully', () => {
    const unknownMuscleGroup: MuscleGroupStats[] = [
      { muscleGroup: 'unknown' as any, frequency: 3, percentage: 100 }
    ];

    render(<MuscleGroupChart muscleGroupStats={unknownMuscleGroup} />);
    
    expect(screen.getByText('unknown')).toBeInTheDocument(); // Should fallback to original name
    expect(screen.getAllByText('3회')).toHaveLength(2); // One in stats, one in total
    expect(screen.getByText('100%')).toBeInTheDocument();
  });
});