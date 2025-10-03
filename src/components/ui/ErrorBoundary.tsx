'use client';

/**
 * React Error Boundary component for graceful error handling
 */

import React, { Component, ReactNode } from 'react';
import { AppError, ErrorType, ErrorSeverity } from '../../lib/errors';
import { errorHandler } from '../../lib/errors/error-handler';
import { Button } from './Button';
import { Card } from './Card';
import { Alert } from './Alert';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: AppError | null;
  errorId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    const appError = new AppError(
      ErrorType.UNKNOWN_ERROR,
      error.message,
      "Something went wrong. We're working to fix this issue.",
      ErrorSeverity.HIGH,
      {
        timestamp: new Date(),
        stack: error.stack
      }
    );

    return {
      hasError: true,
      error: appError,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { onError } = this.props;
    
    // Handle the error through our error handler
    errorHandler.handleError(error, {
      logError: true,
      notifyUser: false, // We'll handle user notification in the UI
      trackMetrics: true
    });

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorId: null
    });
  };

  handleReportError = () => {
    if (this.state.error && this.state.errorId) {
      // In a real app, this would send error report to support
      const errorReport = {
        errorId: this.state.errorId,
        error: this.state.error.toJSON(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString()
      };
      
      console.log('Error report:', errorReport);
      
      // Show confirmation to user
      alert('Error report sent. Thank you for helping us improve the app!');
    }
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const { fallback } = this.props;
      
      if (fallback) {
        return fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <Card className="max-w-md w-full">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Oops! Something went wrong
                </h2>
                <p className="text-gray-600 mb-4">
                  {this.state.error.userMessage}
                </p>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={this.handleRetry}
                  className="w-full"
                  variant="primary"
                >
                  Try Again
                </Button>
                
                <Button
                  onClick={() => window.location.href = '/'}
                  className="w-full"
                  variant="secondary"
                >
                  Go to Home
                </Button>
                
                <Button
                  onClick={this.handleReportError}
                  className="w-full"
                  variant="ghost"
                  size="sm"
                >
                  Report this issue
                </Button>
              </div>

              {this.state.errorId && (
                <div className="text-xs text-gray-400 mt-4">
                  Error ID: {this.state.errorId}
                </div>
              )}
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for functional components to handle errors
export const useErrorHandler = () => {
  const handleError = (error: Error | AppError) => {
    const result = errorHandler.handleError(error);
    
    // You can customize how errors are displayed here
    // For now, we'll throw to trigger the error boundary
    if (result.severity === ErrorSeverity.CRITICAL || result.severity === ErrorSeverity.HIGH) {
      throw error;
    }
    
    return result;
  };

  return { handleError };
};