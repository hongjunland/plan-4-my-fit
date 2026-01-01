import React, { useState } from 'react';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { FeedbackModal } from './FeedbackModal';

interface FeedbackButtonProps {
  currentPage?: string;
  className?: string;
}

export const FeedbackButton: React.FC<FeedbackButtonProps> = ({
  currentPage,
  className = ''
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`fixed bottom-20 right-4 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105 z-40 ${className}`}
        aria-label="피드백 보내기"
      >
        <ChatBubbleLeftRightIcon className="w-6 h-6" />
      </button>

      <FeedbackModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentPage={currentPage}
      />
    </>
  );
};