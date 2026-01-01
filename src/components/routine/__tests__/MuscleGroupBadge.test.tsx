import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import MuscleGroupBadge from '../MuscleGroupBadge';
import { MuscleGroup } from '../../../types';
import { MUSCLE_GROUP_COLORS } from '../../../constants';

describe('MuscleGroupBadge', () => {
  it('renders muscle group badge with text', () => {
    render(<MuscleGroupBadge muscleGroup="chest" />);
    expect(screen.getByText('가슴')).toBeInTheDocument();
  });

  it('renders all muscle group types correctly', () => {
    const muscleGroups: MuscleGroup[] = ['chest', 'back', 'shoulders', 'arms', 'abs', 'legs', 'full_body'];
    const expectedLabels = ['가슴', '등', '어깨', '팔', '복근', '하체', '전신'];

    muscleGroups.forEach((muscleGroup, index) => {
      const { unmount } = render(<MuscleGroupBadge muscleGroup={muscleGroup} />);
      expect(screen.getByText(expectedLabels[index])).toBeInTheDocument();
      unmount();
    });
  });

  // 요구사항 4-1.7: 근육 그룹별 색상 코딩 테스트
  describe('Color Mapping Tests (Requirement 4-1.7)', () => {
    it('applies correct background color for chest (빨강)', () => {
      const { container } = render(<MuscleGroupBadge muscleGroup="chest" />);
      const badge = container.firstChild as HTMLElement;
      expect(badge.style.backgroundColor).toBe('rgb(255, 107, 107)'); // #ff6b6b
    });

    it('applies correct background color for back (파랑)', () => {
      const { container } = render(<MuscleGroupBadge muscleGroup="back" />);
      const badge = container.firstChild as HTMLElement;
      expect(badge.style.backgroundColor).toBe('rgb(77, 171, 247)'); // #4dabf7
    });

    it('applies correct background color for shoulders (주황)', () => {
      const { container } = render(<MuscleGroupBadge muscleGroup="shoulders" />);
      const badge = container.firstChild as HTMLElement;
      expect(badge.style.backgroundColor).toBe('rgb(255, 146, 43)'); // #ff922b
    });

    it('applies correct background color for arms (초록)', () => {
      const { container } = render(<MuscleGroupBadge muscleGroup="arms" />);
      const badge = container.firstChild as HTMLElement;
      expect(badge.style.backgroundColor).toBe('rgb(81, 207, 102)'); // #51cf66
    });

    it('applies correct background color for abs (보라)', () => {
      const { container } = render(<MuscleGroupBadge muscleGroup="abs" />);
      const badge = container.firstChild as HTMLElement;
      expect(badge.style.backgroundColor).toBe('rgb(151, 117, 250)'); // #9775fa
    });

    it('applies correct background color for legs (갈색)', () => {
      const { container } = render(<MuscleGroupBadge muscleGroup="legs" />);
      const badge = container.firstChild as HTMLElement;
      expect(badge.style.backgroundColor).toBe('rgb(139, 90, 60)'); // #8b5a3c
    });

    it('applies correct background color for full_body (회색)', () => {
      const { container } = render(<MuscleGroupBadge muscleGroup="full_body" />);
      const badge = container.firstChild as HTMLElement;
      expect(badge.style.backgroundColor).toBe('rgb(134, 142, 150)'); // #868e96
    });

    it('uses colors from MUSCLE_GROUP_COLORS constant', () => {
      const muscleGroups: MuscleGroup[] = ['chest', 'back', 'shoulders', 'arms', 'abs', 'legs', 'full_body'];
      
      muscleGroups.forEach((muscleGroup) => {
        const { container } = render(<MuscleGroupBadge muscleGroup={muscleGroup} />);
        const badge = container.firstChild as HTMLElement;
        const expectedColor = MUSCLE_GROUP_COLORS[muscleGroup];
        
        // Convert hex to rgb for comparison
        const hexToRgb = (hex: string) => {
          const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
          return result ? `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})` : null;
        };
        
        expect(badge.style.backgroundColor).toBe(hexToRgb(expectedColor));
      });
    });
  });

  it('renders without text when showText is false', () => {
    render(<MuscleGroupBadge muscleGroup="chest" showText={false} />);
    expect(screen.queryByText('가슴')).not.toBeInTheDocument();
  });

  it('applies different sizes correctly', () => {
    const { container: smallContainer } = render(<MuscleGroupBadge muscleGroup="chest" size="sm" />);
    const { container: largeContainer } = render(<MuscleGroupBadge muscleGroup="chest" size="lg" />);
    
    const smallBadge = smallContainer.firstChild as HTMLElement;
    const largeBadge = largeContainer.firstChild as HTMLElement;
    
    expect(smallBadge.className).toContain('text-xs');
    expect(largeBadge.className).toContain('text-base');
  });

  it('applies custom className', () => {
    const { container } = render(<MuscleGroupBadge muscleGroup="chest" className="custom-class" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('custom-class');
  });
});