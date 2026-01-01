import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg' | 'none';
  shadow?: 'sm' | 'md' | 'lg' | 'none';
  hover?: boolean;
  onClick?: () => void;
}

const Card = ({ 
  children, 
  className, 
  padding = 'md',
  shadow = 'sm',
  hover = false,
  onClick
}: CardProps) => {
  const Component = onClick ? 'button' : 'div';
  
  return (
    <Component
      className={clsx(
        // Base styles - Toss design system
        'bg-white border border-gray-200 transition-all duration-200',
        // Toss-style rounded corners (larger than before)
        'rounded-3xl',
        // Shadow variants
        {
          'shadow-sm': shadow === 'sm',
          'shadow-md': shadow === 'md', 
          'shadow-lg': shadow === 'lg',
          'shadow-none': shadow === 'none',
        },
        // Padding variants
        {
          'p-3': padding === 'sm',
          'p-6': padding === 'md',
          'p-8': padding === 'lg',
          'p-0': padding === 'none',
        },
        // Hover effects
        hover && 'hover:shadow-md hover:scale-[1.02] cursor-pointer',
        // Click styles for button variant
        onClick && 'focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 active:scale-[0.98]',
        className
      )}
      onClick={onClick}
    >
      {children}
    </Component>
  );
};

export default Card;