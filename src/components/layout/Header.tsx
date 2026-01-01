import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, MoreHorizontal } from 'lucide-react';
import { ROUTES } from '../../constants';
import { clsx } from 'clsx';

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  showMenuButton?: boolean;
  onBackClick?: () => void;
  onMenuClick?: () => void;
  rightElement?: React.ReactNode;
  className?: string;
}

const Header = ({ 
  title,
  showBackButton = false,
  showMenuButton = false,
  onBackClick,
  onMenuClick,
  rightElement,
  className
}: HeaderProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get page title based on current route if not provided
  const getPageTitle = () => {
    if (title) return title;
    
    switch (location.pathname) {
      case ROUTES.MY:
        return '마이페이지';
      case ROUTES.ROUTINES:
        return '루틴 관리';
      case ROUTES.ROUTINES_NEW:
        return '루틴 생성';
      case ROUTES.CALENDAR:
        return '운동 캘린더';
      case ROUTES.PROGRESS:
        return '진행 상황';
      case ROUTES.PROFILE_SETUP:
        return '프로필 설정';
      case ROUTES.LOGIN:
        return '로그인';
      default:
        if (location.pathname.includes('/routines/') && location.pathname.includes('/edit')) {
          return '루틴 편집';
        }
        return '헬스 루틴 플래너';
    }
  };

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      navigate(-1);
    }
  };

  return (
    <header className={clsx(
      // Fixed positioning for mobile
      'fixed top-0 left-1/2 transform -translate-x-1/2 w-full max-w-mobile bg-white z-50',
      // Toss-style border
      'border-b border-gray-100',
      // Safe area for notched devices
      'pt-safe-top',
      className
    )}>
      <div className="flex items-center justify-between px-4 py-4 min-h-[56px]">
        {/* Left side - Back button or spacer */}
        <div className="flex items-center w-10">
          {showBackButton && (
            <button
              onClick={handleBackClick}
              className="p-2 -ml-2 rounded-2xl hover:bg-gray-100 active:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400"
              aria-label="뒤로 가기"
            >
              <ArrowLeft size={20} className="text-gray-700" />
            </button>
          )}
        </div>

        {/* Center - Title */}
        <div className="flex-1 text-center">
          <h1 className="text-lg font-bold text-gray-900 truncate px-4">
            {getPageTitle()}
          </h1>
        </div>

        {/* Right side - Menu button or custom element */}
        <div className="flex items-center justify-end w-10">
          {rightElement || (
            showMenuButton && (
              <button
                onClick={onMenuClick}
                className="p-2 -mr-2 rounded-2xl hover:bg-gray-100 active:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400"
                aria-label="메뉴"
              >
                <MoreHorizontal size={20} className="text-gray-700" />
              </button>
            )
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;