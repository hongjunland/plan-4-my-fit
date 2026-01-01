import React, { useState, useEffect, useRef } from 'react';
import { MoreVertical, Play, Copy, Trash2, Edit3, Clock, Target, Calendar } from 'lucide-react';
import { Card, Button } from '../ui';
import { MuscleGroupBadge } from './';
import type { RoutineWithDetails } from '../../services/routines';
import type { MuscleGroup } from '../../types';

interface RoutineCardProps {
  routine: RoutineWithDetails;
  onActivate: (routineId: string) => void;
  onEdit: (routineId: string) => void;
  onDuplicate: (routineId: string) => void;
  onDelete: (routineId: string) => void;
  isLoading?: boolean;
}

const SPLIT_TYPE_LABELS = {
  full_body: '전신',
  upper_lower: '상/하체',
  push_pull_legs: '푸쉬/풀/레그',
} as const;

const RoutineCard: React.FC<RoutineCardProps> = ({
  routine,
  onActivate,
  onEdit,
  onDuplicate,
  onDelete,
  isLoading = false,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 메뉴 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  // 루틴에서 사용되는 근육 그룹 추출
  const getMuscleGroups = (): MuscleGroup[] => {
    const muscleGroups = new Set<MuscleGroup>();
    routine.workouts.forEach(workout => {
      workout.exercises.forEach(exercise => {
        muscleGroups.add(exercise.muscleGroup);
      });
    });
    return Array.from(muscleGroups);
  };

  const muscleGroups = getMuscleGroups();
  const totalExercises = routine.workouts.reduce(
    (total, workout) => total + workout.exercises.length, 
    0
  );

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault(); // 추가
    setShowMenu(!showMenu);
  };

  const handleActionClick = (action: () => void) => (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setShowMenu(false);
    action();
  };

  return (
    <Card 
      className={`relative transition-all duration-200 cursor-pointer ${
        routine.isActive 
          ? 'ring-2 ring-primary-200 bg-primary-25 border-primary-200' 
          : 'hover:shadow-md'
      }`}
      hover={!isLoading && !routine.isActive}
    >
      {/* 클릭 영역 (투명한 오버레이) */}
      <div 
        className="absolute inset-0 z-0"
        onClick={() => !isLoading && onEdit(routine.id)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !isLoading) {
            e.preventDefault();
            onEdit(routine.id);
          }
        }}
      />

      {/* 메뉴 버튼 */}
      <div className="absolute top-4 right-4 z-10" ref={menuRef}>
        <button
          onClick={handleMenuClick}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          disabled={isLoading}
        >
          <MoreVertical size={16} className="text-gray-500" />
        </button>

        {/* 드롭다운 메뉴 */}
        {showMenu && (
          <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-2xl shadow-lg py-2 z-10 min-w-[160px]">
            {!routine.isActive && (
              <button
                onClick={handleActionClick(() => onActivate(routine.id))}
                className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors"
              >
                <Play size={16} className="text-green-600" />
                <span className="font-medium">활성화하기</span>
              </button>
            )}
            <button
              onClick={handleActionClick(() => onEdit(routine.id))}
              className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors"
            >
              <Edit3 size={16} className="text-blue-600" />
              <span className="font-medium">편집하기</span>
            </button>
            <button
              onClick={handleActionClick(() => onDuplicate(routine.id))}
              className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors"
            >
              <Copy size={16} className="text-purple-600" />
              <span className="font-medium">복제하기</span>
            </button>
            <hr className="my-1 border-gray-100" />
            <button
              onClick={handleActionClick(() => onDelete(routine.id))}
              className="w-full px-4 py-3 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-3 transition-colors"
            >
              <Trash2 size={16} />
              <span className="font-medium">삭제하기</span>
            </button>
          </div>
        )}
      </div>

      {/* 루틴 정보 */}
      <div className="pr-12 space-y-4">
        {/* 제목 */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2">
            {routine.name}
          </h3>
          {routine.isActive && (
            <span className="inline-block bg-green-500 text-white px-2 py-0.5 rounded-md text-xs font-medium mt-1">
              활성화됨
            </span>
          )}
        </div>

        {/* 루틴 설정 정보 */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-xs font-medium">
            <Clock size={12} />
            {routine.settings.durationWeeks}주 플랜
          </div>
          <div className="flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-xs font-medium">
            <Calendar size={12} />
            주 {routine.settings.workoutsPerWeek}회
          </div>
          <div className="flex items-center gap-1.5 bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full text-xs font-medium">
            <Target size={12} />
            {SPLIT_TYPE_LABELS[routine.settings.splitType]}
          </div>
        </div>

        {/* 운동 정보 */}
        <div className="flex items-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <span className="font-medium">{routine.workouts.length}일 프로그램</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <span className="font-medium">총 {totalExercises}개 운동</span>
          </div>
        </div>

        {/* 근육 그룹 배지 */}
        {muscleGroups.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {muscleGroups.slice(0, 5).map(muscleGroup => (
              <MuscleGroupBadge
                key={muscleGroup}
                muscleGroup={muscleGroup}
                size="sm"
              />
            ))}
            {muscleGroups.length > 5 && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full font-medium">
                +{muscleGroups.length - 5}개
              </span>
            )}
          </div>
        )}

        {/* 활성화 버튼 (비활성 루틴만) */}
        {!routine.isActive && (
          <div className="relative z-10">
            <Button
              variant="primary"
              size="md"
              fullWidth
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.stopPropagation();
                e.preventDefault();
                onActivate(routine.id);
              }}
              disabled={isLoading}
              loading={isLoading}
              className="mt-4 h-12 font-semibold"
            >
              {isLoading ? '활성화 중...' : '이 루틴 시작하기'}
            </Button>
          </div>
        )}

        {/* 생성일 */}
        <div className="text-xs text-gray-400 pt-2 border-t border-gray-100">
          {new Date(routine.createdAt).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })} 생성
        </div>
      </div>

      {/* 로딩 오버레이 */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-3xl backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium text-gray-700">처리 중...</span>
          </div>
        </div>
      )}
    </Card>
  );
};

export default RoutineCard;