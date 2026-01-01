import { InputHTMLAttributes, forwardRef, useState, useId } from 'react';
import { clsx } from 'clsx';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled';
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    label, 
    error, 
    helperText,
    leftIcon,
    rightIcon,
    variant = 'default',
    type,
    className,
    id,
    'aria-describedby': ariaDescribedBy,
    ...props 
  }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const helperTextId = `${inputId}-helper`;
    
    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;

    // Build aria-describedby
    const describedByIds = [
      ariaDescribedBy,
      error ? errorId : null,
      helperText && !error ? helperTextId : null,
    ].filter(Boolean).join(' ');

    return (
      <div className="space-y-2">
        {label && (
          <label 
            htmlFor={inputId}
            className="block text-sm font-semibold text-gray-900"
          >
            {label}
            {props.required && (
              <span className="text-error-500 ml-1" aria-label="필수 입력">*</span>
            )}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div 
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500"
              aria-hidden="true"
            >
              {leftIcon}
            </div>
          )}
          
          <input
            ref={ref}
            id={inputId}
            type={inputType}
            aria-describedby={describedByIds || undefined}
            aria-invalid={error ? 'true' : 'false'}
            className={clsx(
              // Base styles - Toss design system
              'w-full transition-all duration-200 font-medium text-base',
              // Toss-style rounded corners
              'rounded-2xl',
              // Minimum touch target for mobile (WCAG AA compliance)
              'min-h-[56px]',
              // Padding with icon considerations
              {
                'px-4': !leftIcon && !rightIcon && !isPassword,
                'pl-12 pr-4': leftIcon && !rightIcon && !isPassword,
                'pl-4 pr-12': !leftIcon && (rightIcon || isPassword),
                'pl-12 pr-12': leftIcon && (rightIcon || isPassword),
              },
              // Variant styles
              {
                // Default variant
                'border-2 border-gray-200 bg-white focus:border-primary-400 focus:bg-white': variant === 'default' && !error,
                // Filled variant (Toss style)
                'border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-400': variant === 'filled' && !error,
              },
              // Error state
              error && 'border-error-500 focus:border-error-500 focus:ring-error-500 bg-error-50',
              // Focus state
              'focus:outline-none',
              // Placeholder
              'placeholder-gray-500',
              className
            )}
            {...props}
          />
          
          {/* Right icon or password toggle */}
          {(rightIcon || isPassword) && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              {isPassword ? (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400"
                  aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              ) : (
                <div className="text-gray-500" aria-hidden="true">{rightIcon}</div>
              )}
            </div>
          )}
        </div>
        
        {/* Helper text or error message */}
        {(error || helperText) && (
          <p 
            id={error ? errorId : helperTextId}
            className={clsx(
              'text-sm',
              error ? 'text-error-500' : 'text-gray-600'
            )}
            role={error ? 'alert' : undefined}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;