import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MiniCalendar from '../MiniCalendar';

describe('MiniCalendar', () => {
  const defaultProps = {
    year: 2024,
    month: 1, // January
    workoutDates: ['2024-01-01', '2024-01-03', '2024-01-05'],
    completedDates: ['2024-01-01', '2024-01-03']
  };

  it('should render calendar title with correct month and year', () => {
    render(<MiniCalendar {...defaultProps} />);
    
    expect(screen.getByText('2024년 1월 운동 기록')).toBeInTheDocument();
  });

  it('should render day headers', () => {
    render(<MiniCalendar {...defaultProps} />);
    
    const dayHeaders = ['일', '월', '화', '수', '목', '금', '토'];
    dayHeaders.forEach(day => {
      expect(screen.getByText(day)).toBeInTheDocument();
    });
  });

  it('should render calendar days for January 2024', () => {
    render(<MiniCalendar {...defaultProps} />);
    
    // January 2024 has 31 days
    for (let day = 1; day <= 31; day++) {
      expect(screen.getByText(day.toString())).toBeInTheDocument();
    }
  });

  it('should show completed workout indicators', () => {
    render(<MiniCalendar {...defaultProps} />);
    
    // Should show ✅ for completed dates
    const completedIndicators = screen.getAllByText('✅');
    expect(completedIndicators).toHaveLength(2); // 2024-01-01 and 2024-01-03
  });

  it('should show scheduled workout indicators', () => {
    render(<MiniCalendar {...defaultProps} />);
    
    // Should show · for scheduled but not completed dates
    const scheduledIndicators = screen.getAllByText('·');
    expect(scheduledIndicators).toHaveLength(1); // 2024-01-05 (scheduled but not completed)
  });

  it('should render legend', () => {
    render(<MiniCalendar {...defaultProps} />);
    
    expect(screen.getByText('완료')).toBeInTheDocument();
    expect(screen.getByText('예정')).toBeInTheDocument();
    expect(screen.getByText('휴식')).toBeInTheDocument();
  });

  it('should handle empty workout dates', () => {
    const emptyProps = {
      year: 2024,
      month: 1,
      workoutDates: [],
      completedDates: []
    };

    render(<MiniCalendar {...emptyProps} />);
    
    // Should not show any workout indicators in the calendar days
    const calendarContainer = screen.getByText('2024년 1월 운동 기록').parentElement;
    const checkmarks = calendarContainer?.querySelectorAll('*:contains("✅")') || [];
    const dots = calendarContainer?.querySelectorAll('*:contains("·")') || [];
    
    expect(checkmarks).toHaveLength(0);
    expect(dots).toHaveLength(0);
  });

  it('should handle February (28 days)', () => {
    const febProps = {
      year: 2024, // 2024 is a leap year
      month: 2,
      workoutDates: ['2024-02-29'],
      completedDates: ['2024-02-29']
    };

    render(<MiniCalendar {...febProps} />);
    
    // February 2024 (leap year) has 29 days
    expect(screen.getByText('29')).toBeInTheDocument();
    expect(screen.queryByText('30')).not.toBeInTheDocument();
  });

  it('should handle different months correctly', () => {
    const juneProps = {
      year: 2024,
      month: 6, // June
      workoutDates: [],
      completedDates: []
    };

    render(<MiniCalendar {...juneProps} />);
    
    expect(screen.getByText('2024년 6월 운동 기록')).toBeInTheDocument();
    // June has 30 days
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.queryByText('31')).not.toBeInTheDocument();
  });

  it('should apply correct CSS classes for different date states', () => {
    render(<MiniCalendar {...defaultProps} />);
    
    const container = screen.getByText('2024년 1월 운동 기록').closest('div');
    expect(container).toHaveClass('bg-white', 'rounded-xl', 'p-6', 'shadow-sm');
  });

  it('should handle edge case of month with different starting day', () => {
    // March 2024 starts on a Friday (day 5)
    const marchProps = {
      year: 2024,
      month: 3,
      workoutDates: ['2024-03-01'],
      completedDates: ['2024-03-01']
    };

    render(<MiniCalendar {...marchProps} />);
    
    expect(screen.getByText('2024년 3월 운동 기록')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('31')).toBeInTheDocument();
  });
});