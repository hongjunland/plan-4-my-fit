import { ButtonHTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  loading = false,
  className, 
  disabled,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  ...props 
}: ButtonProps) => {
  return (
    <button
      className={clsx(
        // Base styles - Toss design system
        'font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden',
        // Toss-style rounded corners
        'rounded-2xl',
        // Minimum touch target for mobile (WCAG AA compliance)
        'min-h-[48px] min-w-[48px]',
        {
          // Primary variant - Toss blue
          'bg-primary-400 text-white hover:bg-primary-500 active:bg-primary-600 shadow-lg hover:shadow-xl': variant === 'primary',
          // Secondary variant - Light gray
          'bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300': variant === 'secondary',
          // Outline variant
          'border-2 border-gray-300 text-gray-700 hover:bg-gray-50 active:bg-gray-100 hover:border-gray-400': variant === 'outline',
          // Ghost variant
          'text-gray-700 hover:bg-gray-100 active:bg-gray-200': variant === 'ghost',
          // Sizes
          'px-4 py-2 text-sm': size === 'sm',
          'px-6 py-3 text-base': size === 'md',
          'px-8 py-4 text-lg': size === 'lg',
          // Full width
          'w-full': fullWidth,
        },
        className
      )}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-busy={loading}
      {...props}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div 
            className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"
            aria-hidden="true"
          />
        </div>
      )}
      <span className={clsx(loading && 'opacity-0')}>
        {children}
      </span>
    </button>
  );
};

export default Button;