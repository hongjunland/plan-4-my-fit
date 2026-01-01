import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import CalendarPage from '../CalendarPage';

// Mock the calendar view components
vi.mock('../../components/calendar/TodayView', () => ({
  default: () => <div data-testid="today-view">Today View</div>,
}));

vi.mock('../../components/calendar/WeekView', () => ({
  default: () => <div data-testid="week-view">Week View</div>,
}));

vi.mock('../../components/calendar/MonthView', () => ({
  default: () => <div data-testid="month-view">Month View</div>,
}));

describe('CalendarPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('기본적으로 오늘 탭이 선택되어 있다', () => {
    render(<CalendarPage />);

    const todayTab = screen.getByRole('button', { name: '오늘' });
    expect(todayTab).toHaveClass('bg-white', 'text-blue-600', 'shadow-sm');
    expect(screen.getByTestId('today-view')).toBeInTheDocument();
  });

  it('탭 네비게이션이 올바르게 표시된다', () => {
    render(<CalendarPage />);

    expect(screen.getByRole('button', { name: '오늘' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '주간' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '월간' })).toBeInTheDocument();
  });

  it('주간 탭 클릭 시 주간 뷰가 표시된다', () => {
    render(<CalendarPage />);

    const weekTab = screen.getByRole('button', { name: '주간' });
    fireEvent.click(weekTab);

    expect(weekTab).toHaveClass('bg-white', 'text-blue-600', 'shadow-sm');
    expect(screen.getByTestId('week-view')).toBeInTheDocument();
    expect(screen.queryByTestId('today-view')).not.toBeInTheDocument();
  });

  it('월간 탭 클릭 시 월간 뷰가 표시된다', () => {
    render(<CalendarPage />);

    const monthTab = screen.getByRole('button', { name: '월간' });
    fireEvent.click(monthTab);

    expect(monthTab).toHaveClass('bg-white', 'text-blue-600', 'shadow-sm');
    expect(screen.getByTestId('month-view')).toBeInTheDocument();
    expect(screen.queryByTestId('today-view')).not.toBeInTheDocument();
  });

  it('탭 전환이 올바르게 동작한다', () => {
    render(<CalendarPage />);

    // 초기 상태: 오늘 탭 선택
    expect(screen.getByTestId('today-view')).toBeInTheDocument();

    // 주간 탭으로 전환
    fireEvent.click(screen.getByRole('button', { name: '주간' }));
    expect(screen.getByTestId('week-view')).toBeInTheDocument();
    expect(screen.queryByTestId('today-view')).not.toBeInTheDocument();

    // 월간 탭으로 전환
    fireEvent.click(screen.getByRole('button', { name: '월간' }));
    expect(screen.getByTestId('month-view')).toBeInTheDocument();
    expect(screen.queryByTestId('week-view')).not.toBeInTheDocument();

    // 다시 오늘 탭으로 전환
    fireEvent.click(screen.getByRole('button', { name: '오늘' }));
    expect(screen.getByTestId('today-view')).toBeInTheDocument();
    expect(screen.queryByTestId('month-view')).not.toBeInTheDocument();
  });

  it('비활성 탭의 스타일이 올바르게 적용된다', () => {
    render(<CalendarPage />);

    const weekTab = screen.getByRole('button', { name: '주간' });
    const monthTab = screen.getByRole('button', { name: '월간' });

    expect(weekTab).toHaveClass('text-gray-600');
    expect(monthTab).toHaveClass('text-gray-600');
    expect(weekTab).not.toHaveClass('bg-white', 'text-blue-600', 'shadow-sm');
    expect(monthTab).not.toHaveClass('bg-white', 'text-blue-600', 'shadow-sm');
  });

  it('탭 호버 효과가 올바르게 적용된다', () => {
    render(<CalendarPage />);

    const weekTab = screen.getByRole('button', { name: '주간' });
    expect(weekTab).toHaveClass('hover:text-gray-900');
  });
});