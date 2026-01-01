import { clsx } from 'clsx';

interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
  color?: 'primary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
}

const ProgressBar = ({ 
  value, 
  className, 
  color = 'primary',
  size = 'md',
  showLabel = false,
  label,
  animated = true
}: ProgressBarProps) => {
  const normalizedValue = Math.min(100, Math.max(0, value));
  
  const colorClasses = {
    primary: 'bg-primary-400',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    error: 'bg-error-500',
  };

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  return (
    <div className={clsx('w-full', className)}>
      {/* Label */}
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            {label || 'Progress'}
          </span>
          <span className="text-sm font-semibold text-gray-900">
            {Math.round(normalizedValue)}%
          </span>
        </div>
      )}
      
      {/* Progress Bar */}
      <div className={clsx(
        'w-full bg-gray-200 overflow-hidden',
        // Toss-style rounded corners
        'rounded-full',
        sizeClasses[size]
      )}>
        <div
          className={clsx(
            'h-full transition-all duration-500 ease-out rounded-full',
            colorClasses[color],
            // Add subtle gradient for Toss style
            'bg-gradient-to-r from-current to-current',
            // Animation
            animated && 'transition-all duration-700 ease-out'
          )}
          style={{ width: `${normalizedValue}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;