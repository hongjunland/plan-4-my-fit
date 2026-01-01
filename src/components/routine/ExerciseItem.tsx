import React from 'react';
import { Edit3, Trash2, GripVertical } from 'lucide-react';
import { MuscleGroupBadge } from './';
import type { Exercise } from '../../types';

interface ExerciseItemProps {
  exercise: Exercise;
  onEdit: (exercise: Exercise) => void;
  onDelete: (exerciseId: string) => void;
  isDragging?: boolean;
  dragHandleProps?: any;
  className?: string;
}

const ExerciseItem: React.FC<ExerciseItemProps> = ({
  exercise,
  onEdit,
  onDelete,
  isDragging = false,
  dragHandleProps,
  className = '',
}) => {
  return (
    <div
      className={`
        bg-white border border-gray-200 rounded-xl p-4 
        ${isDragging ? 'shadow-lg opacity-90' : 'shadow-sm'}
        ${className}
      `}
    >
      <div className="flex items-center gap-3">
        {/* 드래그 핸들 */}
        <div
          {...dragHandleProps}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
        >
          <GripVertical size={16} />
        </div>

        {/* 운동 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-gray-900 truncate">
              {exercise.name}
            </h4>
            <MuscleGroupBadge 
              muscleGroup={exercise.muscleGroup} 
              size="sm" 
            />
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>{exercise.sets}세트</span>
            <span>{exercise.reps}회</span>
          </div>
          
          {exercise.description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
              {exercise.description}
            </p>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(exercise)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
            title="운동 수정"
          >
            <Edit3 size={16} />
          </button>
          <button
            onClick={() => onDelete(exercise.id)}
            className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
            title="운동 삭제"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExerciseItem;