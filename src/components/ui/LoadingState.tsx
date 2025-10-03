/**
 * Comprehensive loading state component with skeleton screens
 */

import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface LoadingStateProps {
  type?: 'spinner' | 'skeleton' | 'dots' | 'progress';
  message?: string;
  progress?: number; // 0-100 for progress type
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  type = 'spinner',
  message,
  progress,
  className = '',
  size = 'md'
}) => {
  const renderSpinner = () => (
    <div className={`flex flex-col items-center justify-center space-y-3 ${className}`}>
      <LoadingSpinner size={size} />
      {message && (
        <p className="text-sm text-gray-600 text-center">{message}</p>
      )}
    </div>
  );

  const renderSkeleton = () => (
    <div className={`animate-pulse space-y-4 ${className}`}>
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>
      <div className="h-32 bg-gray-200 rounded"></div>
    </div>
  );

  const renderDots = () => (
    <div className={`flex items-center justify-center space-x-1 ${className}`}>
      <div className="flex space-x-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </div>
      {message && (
        <span className="ml-3 text-sm text-gray-600">{message}</span>
      )}
    </div>
  );

  const renderProgress = () => (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between text-sm text-gray-600">
        <span>{message || 'Loading...'}</span>
        <span>{progress}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress || 0}%` }}
        />
      </div>
    </div>
  );

  switch (type) {
    case 'skeleton':
      return renderSkeleton();
    case 'dots':
      return renderDots();
    case 'progress':
      return renderProgress();
    default:
      return renderSpinner();
  }
};

// Skeleton components for specific use cases
export const WineCardSkeleton: React.FC = () => (
  <div className="animate-pulse">
    <div className="bg-gray-200 rounded-lg h-48 mb-4"></div>
    <div className="space-y-2">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
    </div>
  </div>
);

export const ChatMessageSkeleton: React.FC = () => (
  <div className="animate-pulse flex space-x-3">
    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    </div>
  </div>
);

export const RecommendationSkeleton: React.FC = () => (
  <div className="animate-pulse space-y-4">
    <div className="flex items-center space-x-3">
      <div className="w-12 h-12 bg-gray-200 rounded"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
    <div className="space-y-2">
      <div className="h-3 bg-gray-200 rounded"></div>
      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
    </div>
  </div>
);