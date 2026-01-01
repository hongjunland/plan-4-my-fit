import React from 'react';
import { MuscleGroup } from '../../types';
import { MUSCLE_GROUP_COLORS } from '../../constants';

interface MuscleGroupBadgeProps {
  muscleGroup: MuscleGroup;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  chest: '가슴',
  back: '등',
  shoulders: '어깨',
  arms: '팔',
  abs: '복근',
  legs: '하체',
  full_body: '전신',
};

const SIZE_CLASSES = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1.5 text-sm',
  lg: 'px-4 py-2 text-base',
};

const MuscleGroupBadge: React.FC<MuscleGroupBadgeProps> = ({
  muscleGroup,
  size = 'md',
  showText = true,
  className = '',
}) => {
  const backgroundColor = MUSCLE_GROUP_COLORS[muscleGroup];
  const label = MUSCLE_GROUP_LABELS[muscleGroup];
  const sizeClass = SIZE_CLASSES[size];

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium text-white ${sizeClass} ${className}`}
      style={{ backgroundColor }}
    >
      {showText && label}
      {!showText && (
        <div 
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor }}
          title={label}
        />
      )}
    </span>
  );
};

export default MuscleGroupBadge;