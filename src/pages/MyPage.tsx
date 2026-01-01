import React from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import { ROUTES } from '../constants';

const MyPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate(ROUTES.LOGIN);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const menuItems = [
    {
      label: '프로필 설정',
      icon: '👤',
      onClick: () => navigate(ROUTES.MY_PROFILE),
      description: '개인 정보 및 운동 설정 수정',
      available: true
    },
    {
      label: '알림 설정',
      icon: '🔔',
      onClick: () => {
        // TODO: Implement notification settings in future version
        alert('알림 설정 기능은 향후 업데이트에서 제공될 예정입니다.');
      },
      description: '운동 알림 및 리마인더 설정',
      available: false
    },
    {
      label: '캘린더 연동',
      icon: '📅',
      onClick: () => {
        // TODO: Implement calendar integration in future version
        alert('캘린더 연동 기능은 향후 업데이트에서 제공될 예정입니다.');
      },
      description: '구글 캘린더와 운동 일정 동기화',
      available: false
    },
    {
      label: '도움말',
      icon: '❓',
      onClick: () => {
        // TODO: Implement help page in future version
        alert('도움말 페이지는 향후 업데이트에서 제공될 예정입니다.');
      },
      description: '앱 사용법 및 자주 묻는 질문',
      available: false
    }
  ];

  return (
    <div className="p-4 pb-20"> {/* Added bottom padding for navigation */}
      <div className="space-y-4">
        {/* User Profile Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center overflow-hidden">
              {user?.profilePicture ? (
                <img 
                  src={user.profilePicture} 
                  alt="Profile" 
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <span className="text-white text-xl font-semibold">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-lg">
                {user?.name || '사용자'}
              </h3>
              <p className="text-gray-600 text-sm">
                {user?.email || 'user@example.com'}
              </p>
              <div className="mt-1">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  활성 사용자
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Menu Items */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-500 px-2 mb-3">설정</h4>
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={item.onClick}
              disabled={!item.available}
              className={`w-full bg-white rounded-xl p-4 shadow-sm text-left transition-colors ${
                item.available 
                  ? 'hover:bg-gray-50 active:bg-gray-100' 
                  : 'opacity-60 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">{item.icon}</span>
                <div className="flex-1">
                  <div className={`font-medium ${item.available ? 'text-gray-900' : 'text-gray-500'}`}>
                    {item.label}
                    {!item.available && (
                      <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                        준비중
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">{item.description}</div>
                </div>
                {item.available && (
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </div>
            </button>
          ))}
          
          {/* Logout Button */}
          <div className="pt-4 border-t border-gray-100 mt-6">
            <button
              onClick={handleLogout}
              className="w-full bg-white rounded-xl p-4 shadow-sm text-left text-red-600 hover:bg-red-50 active:bg-red-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">🚪</span>
                <div className="flex-1">
                  <div className="font-medium">로그아웃</div>
                  <div className="text-sm text-red-400">계정에서 로그아웃합니다</div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyPage;