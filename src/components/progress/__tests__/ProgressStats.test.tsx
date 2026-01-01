import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProgressStats from '../ProgressStats';

describe('ProgressStats', () => {
  const defaultProps = {
    weeklyCompletionRate: 75,
    routineCompletionRate: 60,
    streakDays: 5,
    motivationMessage: '💪 잘하고 있어요! 5일 연속이에요!'
  };

  it('should render motivation message', () => {
    render(<ProgressStats {...defaultProps} />);
    
    expect(screen.getByText('💪 잘하고 있어요! 5일 연속이에요!')).toBeInTheDocument();
  });

  it('should display weekly completion rate', () => {
    render(<ProgressStats {...defaultProps} />);
    
    expect(screen.getByText('이번 주 완료율')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('should display routine completion rate', () => {
    render(<ProgressStats {...defaultProps} />);
    
    expect(screen.getByText('전체 루틴 진행률')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
  });

  it('should display streak days', () => {
    render(<ProgressStats {...defaultProps} />);
    
    expect(screen.getByText('연속 운동 일수')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('일')).toBeInTheDocument();
  });

  it('should show fire emoji for streak days > 0', () => {
    render(<ProgressStats {...defaultProps} />);
    
    expect(screen.getByText('🔥')).toBeInTheDocument();
  });

  it('should not show fire emoji for 0 streak days', () => {
    render(<ProgressStats {...defaultProps} streakDays={0} />);
    
    expect(screen.queryByText('🔥')).not.toBeInTheDocument();
  });

  it('should show achievement message for 7+ streak days', () => {
    render(<ProgressStats {...defaultProps} streakDays={7} />);
    
    expect(screen.getByText('일주일 연속 달성! 👏')).toBeInTheDocument();
  });

  it('should not show achievement message for < 7 streak days', () => {
    render(<ProgressStats {...defaultProps} streakDays={5} />);
    
    expect(screen.queryByText('일주일 연속 달성! 👏')).not.toBeInTheDocument();
  });

  it('should handle zero values correctly', () => {
    const zeroProps = {
      weeklyCompletionRate: 0,
      routineCompletionRate: 0,
      streakDays: 0,
      motivationMessage: '💪 오늘도 운동으로 건강한 하루 만들어요!'
    };

    render(<ProgressStats {...zeroProps} />);
    
    expect(screen.getAllByText('0%')).toHaveLength(2); // Weekly and routine completion rates
    expect(screen.getByText('0')).toBeInTheDocument(); // Streak days
    expect(screen.queryByText('🔥')).not.toBeInTheDocument();
  });

  it('should handle 100% completion rates', () => {
    const maxProps = {
      weeklyCompletionRate: 100,
      routineCompletionRate: 100,
      streakDays: 30,
      motivationMessage: '🔥 대단해요! 30일 연속 운동 중이에요!'
    };

    render(<ProgressStats {...maxProps} />);
    
    expect(screen.getAllByText('100%')).toHaveLength(2);
    expect(screen.getByText('30')).toBeInTheDocument();
  });
});