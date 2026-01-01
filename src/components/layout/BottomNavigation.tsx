import { NavLink } from 'react-router-dom';
import { User, Calendar, BarChart3, Dumbbell, LucideIcon } from 'lucide-react';
import { ROUTES } from '../../constants';
import { clsx } from 'clsx';

interface NavItem {
  path: string;
  icon: LucideIcon;
  label: string;
  badge?: string | number;
}

interface BottomNavigationProps {
  className?: string;
}

const BottomNavigation = ({ className }: BottomNavigationProps) => {
  const navItems: NavItem[] = [
    {
      path: ROUTES.MY,
      icon: User,
      label: '마이',
    },
    {
      path: ROUTES.ROUTINES,
      icon: Dumbbell,
      label: '루틴',
    },
    {
      path: ROUTES.CALENDAR,
      icon: Calendar,
      label: '캘린더',
    },
    {
      path: ROUTES.PROGRESS,
      icon: BarChart3,
      label: '진행',
    },
  ];

  return (
    <nav className={clsx(
      // Fixed positioning for mobile
      'fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-mobile bg-white z-50',
      // Toss-style border and shadow
      'border-t border-gray-100 shadow-lg',
      // Safe area for devices with home indicator
      'pb-safe-bottom',
      className
    )}>
      <div className="grid grid-cols-4">
        {navItems.map(({ path, icon: Icon, label, badge }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              clsx(
                'flex flex-col items-center justify-center py-2 px-2 text-xs font-medium transition-all duration-200',
                // Touch-friendly minimum size (48px)
                'min-h-[64px] touch-manipulation',
                // Active state with Toss colors
                isActive
                  ? 'text-primary-400 bg-primary-50'
                  : 'text-gray-500 hover:text-gray-700 active:bg-gray-100',
                // Focus styles for accessibility
                'focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-inset'
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <Icon 
                    size={22} 
                    className={clsx(
                      'mb-1 transition-colors',
                      isActive ? 'text-primary-400' : 'text-gray-500'
                    )} 
                  />
                  {badge && (
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[16px] h-4 px-1 text-xs font-bold text-white bg-error-500 rounded-full">
                      {badge}
                    </span>
                  )}
                </div>
                <span className={clsx(
                  'font-medium text-xs leading-tight',
                  isActive ? 'text-primary-400' : 'text-gray-500'
                )}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNavigation;