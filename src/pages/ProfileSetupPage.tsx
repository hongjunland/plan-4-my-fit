import React from 'react';
import ProfileSetupForm from '../components/forms/ProfileSetupForm';

const ProfileSetupPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto">
        <div className="bg-white min-h-screen">
          <div className="p-4 pt-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                프로필 설정
              </h1>
              <p className="text-gray-600">
                맞춤형 운동 루틴을 위해 정보를 입력해주세요
              </p>
            </div>
            
            <ProfileSetupForm />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetupPage;