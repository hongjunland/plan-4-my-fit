import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface Tab {
  key: string;
  label: string;
  content: ReactNode;
  disabled?: boolean;
  badge?: string | number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (key: string) => void;
  className?: string;
  variant?: 'default' | 'pills' | 'underline';
  size?: 'sm' | 'md' | 'lg';
}

const Tabs = ({ 
  tabs, 
  activeTab, 
  onTabChange, 
  className,
  variant = 'default',
  size = 'md'
}: TabsProps) => {
  return (
    <div className={className}>
      {/* Tab Navigation */}
      <div className={clsx(
        'flex mb-6',
        {
          // Default variant - Toss style pill container
          'bg-gray-100 rounded-2xl p-1': variant === 'default',
          // Pills variant - separate buttons
          'gap-2': variant === 'pills',
          // Underline variant - border bottom
          'border-b border-gray-200': variant === 'underline',
        }
      )}>
        {tabs.map(({ key, label, disabled, badge }) => (
          <button
            key={key}
            onClick={() => !disabled && onTabChange(key)}
            disabled={disabled}
            className={clsx(
              'font-semibold transition-all duration-200 focus:outline-none relative',
              // Size variants
              {
                'py-2 px-3 text-sm': size === 'sm',
                'py-3 px-4 text-base': size === 'md',
                'py-4 px-6 text-lg': size === 'lg',
              },
              // Variant styles
              {
                // Default variant (pills in container)
                'flex-1 rounded-xl': variant === 'default',
                // Pills variant (separate rounded buttons)
                'rounded-2xl px-6': variant === 'pills',
                // Underline variant
                'border-b-2 border-transparent': variant === 'underline',
              },
              // Active states
              {
                // Default variant active
                'bg-white text-primary-400 shadow-sm': variant === 'default' && activeTab === key,
                'text-gray-600 hover:text-gray-900': variant === 'default' && activeTab !== key,
                // Pills variant active
                'bg-primary-400 text-white shadow-lg': variant === 'pills' && activeTab === key,
                'bg-gray-100 text-gray-600 hover:bg-gray-200': variant === 'pills' && activeTab !== key,
                // Underline variant active
                'border-primary-400 text-primary-400': variant === 'underline' && activeTab === key,
                'text-gray-600 hover:text-gray-900 hover:border-gray-300': variant === 'underline' && activeTab !== key,
              },
              // Disabled state
              disabled && 'opacity-50 cursor-not-allowed',
              // Focus ring
              'focus:ring-2 focus:ring-primary-400 focus:ring-offset-2'
            )}
          >
            <span className="flex items-center gap-2">
              {label}
              {badge && (
                <span className={clsx(
                  'inline-flex items-center justify-center min-w-[20px] h-5 px-2 text-xs font-bold rounded-full',
                  activeTab === key 
                    ? 'bg-white text-primary-400' 
                    : 'bg-primary-400 text-white'
                )}>
                  {badge}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>
      
      {/* Tab Content */}
      <div className="animate-fade-in">
        {tabs.find(tab => tab.key === activeTab)?.content}
      </div>
    </div>
  );
};

export default Tabs;