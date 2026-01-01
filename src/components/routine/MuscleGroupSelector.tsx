import React from 'react';
import { MuscleGroup } from '../../types';
import { MUSCLE_GROUP_COLORS } from '../../constants';

interface MuscleGroupSelectorProps {
  selectedMuscleGroups?: MuscleGroup[];
  onSelectionChange?: (muscleGroups: MuscleGroup[]) => void;
  selected?: MuscleGroup; // Single selection mode
  onChange?: (muscleGroup: MuscleGroup) => void; // Single selection mode
  multiple?: boolean;
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

const ALL_MUSCLE_GROUPS: MuscleGroup[] = [
  'chest',
  'back', 
  'shoulders',
  'arms',
  'abs',
  'legs',
  'full_body',
];

const MuscleGroupSelector: React.FC<MuscleGroupSelectorProps> = ({
  selectedMuscleGroups = [],
  onSelectionChange,
  selected,
  onChange,
  multiple = true,
  className = '',
}) => {
  // Single selection mode
  if (!multiple && selected !== undefined && onChange) {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {ALL_MUSCLE_GROUPS.map((muscleGroup) => {
          const isSelected = selected === muscleGroup;
          const backgroundColor = MUSCLE_GROUP_COLORS[muscleGroup];
          const label = MUSCLE_GROUP_LABELS[muscleGroup];

          return (
            <button
              key={muscleGroup}
              type="button"
              onClick={() => onChange(muscleGroup)}
              className={`
                px-3 py-2 rounded-full text-sm font-medium transition-all duration-200
                ${isSelected 
                  ? 'text-white shadow-md transform scale-105' 
                  : 'text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300'
                }
              `}
              style={isSelected ? { backgroundColor } : {}}
            >
              {label}
            </button>
          );
        })}
      </div>
    );
  }

  // Multiple selection mode
  const handleMuscleGroupClick = (muscleGroup: MuscleGroup) => {
    if (!onSelectionChange) return;

    if (selectedMuscleGroups.includes(muscleGroup)) {
      // Remove from selection
      onSelectionChange(selectedMuscleGroups.filter(mg => mg !== muscleGroup));
    } else {
      // Add to selection
      onSelectionChange([...selectedMuscleGroups, muscleGroup]);
    }
  };

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {ALL_MUSCLE_GROUPS.map((muscleGroup) => {
        const isSelected = selectedMuscleGroups.includes(muscleGroup);
        const backgroundColor = MUSCLE_GROUP_COLORS[muscleGroup];
        const label = MUSCLE_GROUP_LABELS[muscleGroup];

        return (
          <button
            key={muscleGroup}
            type="button"
            onClick={() => handleMuscleGroupClick(muscleGroup)}
            className={`
              px-3 py-2 rounded-full text-sm font-medium transition-all duration-200
              ${isSelected 
                ? 'text-white shadow-md transform scale-105' 
                : 'text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300'
              }
            `}
            style={isSelected ? { backgroundColor } : {}}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};

export default MuscleGroupSelector;