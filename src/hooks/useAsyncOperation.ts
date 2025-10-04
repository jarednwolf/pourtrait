/**
 * Hook for managing async operations with loading states and error handling
 */

import { useState, useCallback, useRef } from 'react';
import { AppError } from '../lib/errors';
import { errorHandler } from '../lib/errors/error-handler';
import { withRetry, RetryOptions } from '../lib/utils/retry';
import { withFallback, FallbackOptions } from '../lib/utils/fallback';

export interface AsyncOperationState<T> {
  data: T | null;
  loading: boolean;
  error: AppError | null;
  progress?: number;
}

export interface AsyncOperationOptions<T> extends RetryOptions, FallbackOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: AppError) => void;
  onProgress?: (progress: number) => void;
  enableRetry?: boolean;
  enableFallback?: boolean;
}

export interface AsyncOperationResult<T> extends AsyncOperationState<T> {
  execute: (fn: () => Promise<T>) => Promise<void>;
  retry: () => Promise<void>;
  reset: () => void;
  setProgress: (progress: number) => void;
}

export function useAsyncOperation<T = any>(
  options: AsyncOperationOptions<T> = {}
): AsyncOperationResult<T> {
  const [state, setState] = useState<AsyncOperationState<T>>({
    data: null,
    loading: false,
    error: null,
    progress: undefined
  });

  const lastOperationRef = useRef<(() => Promise<T>) | null>(null);

  const execute = useCallback(async (fn: () => Promise<T>) => {
    lastOperationRef.current = fn;
    
    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      progress: 0
    }));

    try {
      let result: T;

      if (options.enableRetry) {
        const retryResult = await withRetry(fn, {
          ...options,
          onRetry: (attempt, error) => {
            options.onRetry?.(attempt, error);
            setState(prev => ({
              ...prev,
              progress: (attempt / (options.maxAttempts || 3)) * 50
            }));
          }
        });

        if (!retryResult.success) {
          throw retryResult.error;
        }
        result = retryResult.result!;
      } else if (options.enableFallback) {
        result = await withFallback(fn, {
          ...options,
          onFallback: (error) => {
            options.onFallback?.(error);
            setState(prev => ({
              ...prev,
              progress: 75
            }));
          }
        });
      } else {
        result = await fn();
      }

      setState({
        data: result,
        loading: false,
        error: null,
        progress: 100
      });

      options.onSuccess?.(result);
    } catch (error) {
      const handled = errorHandler.handleError(error as Error)
      const appError = error instanceof AppError 
        ? error 
        : new AppError(
            'UNKNOWN_ERROR' as any,
            (error as Error).message,
            handled.userMessage || 'An unexpected error occurred'
          );

      setState({
        data: null,
        loading: false,
        error: appError,
        progress: undefined
      });

      options.onError?.(appError);
    }
  }, [options]);

  const retry = useCallback(async () => {
    if (lastOperationRef.current) {
      await execute(lastOperationRef.current);
    }
  }, [execute]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      progress: undefined
    });
    lastOperationRef.current = null;
  }, []);

  const setProgress = useCallback((progress: number) => {
    setState(prev => ({
      ...prev,
      progress: Math.max(0, Math.min(100, progress))
    }));
  }, []);

  return {
    ...state,
    execute,
    retry,
    reset,
    setProgress
  };
}

// Specialized hooks for common operations
export function useAIOperation<T = any>(options: AsyncOperationOptions<T> = {}) {
  return useAsyncOperation<T>({
    enableRetry: true,
    enableFallback: true,
    maxAttempts: 3,
    baseDelay: 1000,
    retryCondition: (error) => {
      return error.message.includes('timeout') ||
             error.message.includes('rate limit') ||
             error.message.includes('503') ||
             error.message.includes('502');
    },
    ...options
  });
}

export function useImageProcessingOperation<T = any>(options: AsyncOperationOptions<T> = {}) {
  return useAsyncOperation<T>({
    enableRetry: true,
    enableFallback: true,
    maxAttempts: 2,
    baseDelay: 2000,
    retryCondition: (error) => {
      return error.message.includes('timeout') ||
             error.message.includes('network');
    },
    ...options
  });
}

export function useDataOperation<T = any>(options: AsyncOperationOptions<T> = {}) {
  return useAsyncOperation<T>({
    enableRetry: true,
    maxAttempts: 3,
    baseDelay: 500,
    retryCondition: (error) => {
      return error.message.includes('network') ||
             error.message.includes('timeout') ||
             error.message.includes('503') ||
             error.message.includes('502');
    },
    ...options
  });
}