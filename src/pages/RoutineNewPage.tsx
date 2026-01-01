import RoutineCreationForm from '../components/forms/RoutineCreationForm';

const RoutineNewPage = () => {
  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          새 루틴 생성
        </h2>
        <p className="text-gray-600">
          AI가 당신에게 맞는 운동 루틴을 만들어드립니다
        </p>
      </div>
      
      <RoutineCreationForm />
    </div>
  );
};

export default RoutineNewPage;