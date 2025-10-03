/**
 * Global error provider for handling application-wide errors
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AppError, ErrorSeverity } from '@/lib/errors';
import { errorHandler, ErrorHandlerResult } from '@/lib/errors/error-handler';
import { ErrorAlert } from '@/components/ui/ErrorAlert';

interface ErrorContextType {
  showError: (error: Error | AppError) => void;
  clearError: () => void;
  currentError: AppError | null;
  errorResult: ErrorHandlerResult | null;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

interface ErrorProviderProps {
  children: ReactNode;
}

export const ErrorProvider: React.FC<ErrorProviderProps> = ({ children }) => {
  const [currentError, setCurrentError] = useState<AppError | null>(null);
  const [errorResult, setErrorResult] = useState<ErrorHandlerResult | null>(null);

  const showError = useCallback((error: Error | AppError) => {
    const result = errorHandler.handleError(error);
    
    // Only show user-facing errors
    if (result.severity !== ErrorSeverity.DEBUG) {
      setCurrentError(error instanceof AppError ? error : new AppError(
        'UNKNOWN_ERROR' as any,
        error.message,
        result.userMessage
      ));
      setErrorResult(result);
    }
  }, []);

  const clearError = useCallback(() => {
    setCurrentError(null);
    setErrorResult(null);
  }, []);

  const handleRetry = useCallback(() => {
    if (errorResult?.shouldRetry) {
      clearError();
      // The retry logic should be handled by the component that triggered the error
    }
  }, [errorResult, clearError]);

  return (
    <ErrorContext.Provider value={{ showError, clearError, currentError, errorResult }}>
      {children}
      
      {/* Global error display */}
      {currentError && errorResult && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <ErrorAlert
            error={currentError}
            recoveryActions={errorResult.recoveryActions}
            onDismiss={clearError}
            onRetry={errorResult.shouldRetry ? handleRetry : undefined}
            autoHide={errorResult.severity === ErrorSeverity.LOW}
          />
        </div>
      )}
    </ErrorContext.Provider>
  );
};

export const useError = (): ErrorContextType => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
};

// Hook for handling async operations with global error handling
export const useAsyncWithGlobalError = () => {
  const { showError } = useError();
  
  const executeWithErrorHandling = useCallback(
    async (
      operation: () => Promise<any>,
      onSuccess?: (result: any) => void,
      onError?: (error: AppError) => void
    ): Promise<any> => {
      try {
        const result = await operation();
        onSuccess?.(result);
        return result;
      } catch (error) {
        const appError = error instanceof AppError ? error : new AppError(
          'UNKNOWN_ERROR' as any,
          error instanceof Error ? error.message : String(error),
          'An unexpected error occurred'
        );
        
        onError?.(appError);
        showError(appError);
        return null;
      }
    },
    [showError]
  );

  return { executeWithErrorHandling };
};