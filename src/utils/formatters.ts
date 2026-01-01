// Date formatting utilities
export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatDateShort = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
  });
};

// Muscle group formatting
export const formatMuscleGroup = (muscleGroup: string): string => {
  const muscleGroupMap: Record<string, string> = {
    chest: '가슴',
    back: '등',
    shoulders: '어깨',
    arms: '팔',
    abs: '복근',
    legs: '하체',
    full_body: '전신',
  };
  
  return muscleGroupMap[muscleGroup] || muscleGroup;
};