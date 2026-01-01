import React from 'react';

interface MiniCalendarProps {
  year: number;
  month: number;
  workoutDates: string[]; // 운동한 날짜들 (YYYY-MM-DD 형식)
  completedDates: string[]; // 완료한 날짜들
}

const MiniCalendar: React.FC<MiniCalendarProps> = ({
  year,
  month,
  workoutDates,
  completedDates
}) => {
  // 해당 월의 첫 번째 날과 마지막 날 계산
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay(); // 0: 일요일, 1: 월요일, ...

  // 달력 그리드 생성
  const calendarDays: (number | null)[] = [];
  
  // 첫 주의 빈 칸들
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarDays.push(null);
  }
  
  // 실제 날짜들
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  // 날짜를 YYYY-MM-DD 형식으로 변환하는 함수
  const formatDate = (day: number): string => {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  // 날짜 상태 확인 함수
  const getDateStatus = (day: number | null): 'completed' | 'scheduled' | 'empty' => {
    if (!day) return 'empty';
    
    const dateStr = formatDate(day);
    
    if (completedDates.includes(dateStr)) {
      return 'completed';
    } else if (workoutDates.includes(dateStr)) {
      return 'scheduled';
    }
    
    return 'empty';
  };

  // 상태별 스타일 클래스
  const getStatusClass = (status: 'completed' | 'scheduled' | 'empty'): string => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 text-white';
      case 'scheduled':
        return 'bg-blue-100 text-blue-600';
      default:
        return 'text-gray-400';
    }
  };

  // 상태별 아이콘
  const getStatusIcon = (status: 'completed' | 'scheduled' | 'empty'): string => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'scheduled':
        return '·';
      default:
        return '';
    }
  };

  const monthNames = [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ];

  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h3 className="font-semibold text-gray-900 mb-4">
        {year}년 {monthNames[month - 1]} 운동 기록
      </h3>
      
      <div className="space-y-2">
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map(day => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
              {day}
            </div>
          ))}
        </div>
        
        {/* 달력 그리드 */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            const status = getDateStatus(day);
            const statusClass = getStatusClass(status);
            const icon = getStatusIcon(status);
            
            return (
              <div
                key={index}
                className={`
                  aspect-square flex items-center justify-center text-sm rounded-lg
                  ${statusClass}
                  ${day ? 'cursor-default' : ''}
                `}
              >
                {day && (
                  <div className="flex flex-col items-center">
                    <span className="text-xs">{day}</span>
                    {icon && <span className="text-xs">{icon}</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* 범례 */}
        <div className="flex justify-center space-x-4 mt-4 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">완료</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-100 rounded-full"></div>
            <span className="text-gray-600">예정</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-gray-200 rounded-full"></div>
            <span className="text-gray-600">휴식</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiniCalendar;