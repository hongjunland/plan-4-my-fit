import React from 'react';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepTitles: string[];
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentStep,
  totalSteps,
  stepTitles
}) => {
  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className="mb-8">
      {/* Progress Bar */}
      <div className="relative mb-4">
        <div className="h-2 bg-gray-200 rounded-full">
          <div 
            className="h-2 bg-blue-500 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="absolute -top-1 right-0 transform translate-x-1/2">
          <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-sm" />
        </div>
      </div>

      {/* Step Info */}
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-600">
          {stepTitles[currentStep - 1]}
        </span>
        <span className="text-gray-500">
          {currentStep}/{totalSteps}
        </span>
      </div>
    </div>
  );
};

export default ProgressIndicator;