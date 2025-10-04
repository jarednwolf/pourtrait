/**
 * Wrapper component for async operations with comprehensive error handling
 */

import React, { ReactNode } from 'react';
import { ErrorAlert } from './ErrorAlert';
import { LoadingState } from './LoadingState';
// Button is not used directly here; actions are rendered via ErrorAlert
import { useAsyncOperation } from '@/hooks/useAsyncOperation';
import { AppError } from '@/lib/errors';

interface AsyncOperationWrapperProps<T> {
  children: (data: T | null, execute: (fn: () => Promise<T>) => Promise<void>) => ReactNode;
  loadingComponent?: ReactNode;
  errorComponent?: (error: AppError, retry: () => void) => ReactNode;
  emptyComponent?: ReactNode;
  className?: string;
  enableRetry?: boolean;
  enableFallback?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: AppError) => void;
}

export function AsyncOperationWrapper<T>({
  children,
  loadingComponent,
  errorComponent,
  emptyComponent,
  className = '',
  enableRetry = true,
  enableFallback = false,
  onSuccess,
  onError
}: AsyncOperationWrapperProps<T>) {
  const operation = useAsyncOperation<T>({
    enableRetry,
    enableFallback,
    onSuccess,
    onError
  });

  const { data, loading, error, execute, retry } = operation;

  // Show loading state
  if (loading) {
    return (
      <div className={className}>
        {loadingComponent || (
          <LoadingState 
            message="Loading..." 
            progress={operation.progress}
            type={operation.progress !== undefined ? 'progress' : 'spinner'}
          />
        )}
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={className}>
        {errorComponent ? (
          errorComponent(error, retry)
        ) : (
          <ErrorAlert
            error={error}
            onRetry={error.retryable ? retry : undefined}
            onDismiss={() => operation.reset()}
            recoveryActions={[
              ...(error.retryable ? [{
                type: 'retry' as const,
                label: 'Try Again',
                action: retry
              }] : []),
              {
                type: 'manual' as const,
                label: 'Reset',
                action: () => operation.reset()
              }
            ]}
          />
        )}
      </div>
    );
  }

  // Show empty state
  if (data === null && emptyComponent) {
    return (
      <div className={className}>
        {emptyComponent}
      </div>
    );
  }

  // Render children with data and execute function
  return (
    <div className={className}>
      {children(data, execute)}
    </div>
  );
}

// Specialized wrappers for common use cases
export const AIOperationWrapper: React.FC<AsyncOperationWrapperProps<any>> = (props) => (
  <AsyncOperationWrapper
    {...props}
    enableRetry={true}
    enableFallback={true}
    loadingComponent={
      <LoadingState 
        message="AI is thinking..." 
        type="dots"
        className="py-8"
      />
    }
  />
);

export const ImageProcessingWrapper: React.FC<AsyncOperationWrapperProps<any>> = (props) => (
  <AsyncOperationWrapper
    {...props}
    enableRetry={true}
    enableFallback={true}
    loadingComponent={
      <LoadingState 
        message="Processing image..." 
        type="progress"
        className="py-8"
      />
    }
  />
);

export const DataOperationWrapper: React.FC<AsyncOperationWrapperProps<any>> = (props) => (
  <AsyncOperationWrapper
    {...props}
    enableRetry={true}
    enableFallback={false}
    loadingComponent={
      <LoadingState 
        message="Loading data..." 
        type="skeleton"
        className="py-4"
      />
    }
  />
);