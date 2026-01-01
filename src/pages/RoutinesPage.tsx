import React from 'react';
import { RoutineList } from '../components/routine';

const RoutinesPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 메인 컨텐츠 */}
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-sm">
        <div className="p-6 pb-24"> {/* 하단 네비게이션 공간 확보 */}
          <RoutineList />
        </div>
      </div>
    </div>
  );
};

export default RoutinesPage;