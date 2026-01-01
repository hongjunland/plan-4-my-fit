import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Button from '../components/ui/Button';
import ProfileEditForm from '../components/forms/ProfileEditForm';
import { ROUTES } from '../constants';

const ProfileEditPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const step = searchParams.get('step');
  const initialStep = step ? parseInt(step, 10) : 1;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto">
        <div className="bg-white min-h-screen">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <Button
              variant="ghost"
              onClick={() => navigate(ROUTES.MY)}
              className="p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">
              프로필 수정
            </h1>
            <div className="w-10" /> {/* Spacer */}
          </div>

          <div className="p-4 pt-8">
            <div className="text-center mb-8">
              <p className="text-gray-600">
                정보를 수정하여 더 정확한 맞춤형 루틴을 받아보세요
              </p>
            </div>
            
            <ProfileEditForm initialStep={initialStep} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditPage;