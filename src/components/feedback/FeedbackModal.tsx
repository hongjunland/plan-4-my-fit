import React, { useState } from 'react';
import { XMarkIcon, StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import Button from '../ui/Button';
import Input from '../ui/Input';
import toast from 'react-hot-toast';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage?: string;
}

interface FeedbackData {
  rating: number;
  category: string;
  description: string;
  email?: string;
  userAgent: string;
  currentPage: string;
  timestamp: string;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  currentPage = 'unknown'
}) => {
  const [rating, setRating] = useState(0);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    { value: 'bug', label: '🐛 버그 신고' },
    { value: 'feature', label: '✨ 기능 제안' },
    { value: 'ui', label: '🎨 UI/UX 개선' },
    { value: 'performance', label: '⚡ 성능 이슈' },
    { value: 'other', label: '💬 기타' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error('별점을 선택해주세요');
      return;
    }
    
    if (!category) {
      toast.error('카테고리를 선택해주세요');
      return;
    }
    
    if (!description.trim()) {
      toast.error('피드백 내용을 입력해주세요');
      return;
    }

    setIsSubmitting(true);

    try {
      const feedbackData: FeedbackData = {
        rating,
        category,
        description: description.trim(),
        email: email.trim() || undefined,
        userAgent: navigator.userAgent,
        currentPage,
        timestamp: new Date().toISOString()
      };

      // In a real app, this would send to your backend
      // For now, we'll log it and show success
      console.log('Feedback submitted:', feedbackData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('피드백이 전송되었습니다. 감사합니다!');
      
      // Reset form
      setRating(0);
      setCategory('');
      setDescription('');
      setEmail('');
      onClose();
      
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      toast.error('피드백 전송에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">피드백 보내기</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                전체적인 만족도를 평가해주세요
              </label>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    {star <= rating ? (
                      <StarSolidIcon className="w-8 h-8 text-yellow-400" />
                    ) : (
                      <StarIcon className="w-8 h-8 text-gray-300" />
                    )}
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  {rating === 1 && '매우 불만족'}
                  {rating === 2 && '불만족'}
                  {rating === 3 && '보통'}
                  {rating === 4 && '만족'}
                  {rating === 5 && '매우 만족'}
                </p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                피드백 유형
              </label>
              <div className="grid grid-cols-1 gap-2">
                {categories.map((cat) => (
                  <label key={cat.value} className="flex items-center">
                    <input
                      type="radio"
                      name="category"
                      value={cat.value}
                      checked={category === cat.value}
                      onChange={(e) => setCategory(e.target.value)}
                      className="mr-3 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">{cat.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                상세 내용
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="구체적인 피드백을 남겨주세요..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Email (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이메일 (선택사항)
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                placeholder="답변을 받고 싶으시면 이메일을 입력해주세요"
              />
              <p className="text-xs text-gray-500 mt-1">
                답변이 필요한 경우에만 입력해주세요
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                className="flex-1"
                disabled={isSubmitting}
              >
                취소
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? '전송 중...' : '피드백 보내기'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};