/**
 * Central error handler for the application
 */

import { AppError, ErrorType, ErrorSeverity } from './index';
import { logger } from '../utils/logger';

export interface ErrorHandlerOptions {
  logError?: boolean;
  notifyUser?: boolean;
  trackMetrics?: boolean;
}

export interface ErrorRecoveryAction {
  type: 'retry' | 'fallback' | 'redirect' | 'refresh' | 'manual';
  label: string;
  action: () => void | Promise<void>;
}

export interface ErrorHandlerResult {
  userMessage: string;
  severity: ErrorSeverity;
  recoveryActions: ErrorRecoveryAction[];
  shouldRetry: boolean;
  retryDelay?: number;
}

class ErrorHandler {
  private static instance: ErrorHandler;
  private errorListeners: ((error: AppError) => void)[] = [];

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Handle an error and return user-friendly information
   */
  handleError(
    error: Error | AppError,
    options: ErrorHandlerOptions = {}
  ): ErrorHandlerResult {
    const appError = this.normalizeError(error);
    
    // Default options
    const {
      logError = true,
      trackMetrics = true
    } = options;

    // Log the error
    if (logError) {
      this.logError(appError);
    }

    // Track metrics
    if (trackMetrics) {
      this.trackErrorMetrics(appError);
    }

    // Notify listeners
    this.notifyListeners(appError);

    // Generate recovery actions
    const recoveryActions = this.generateRecoveryActions(appError);

    return {
      userMessage: appError.userMessage,
      severity: appError.severity,
      recoveryActions,
      shouldRetry: appError.retryable,
      retryDelay: this.getRetryDelay(appError)
    };
  }

  /**
   * Convert any error to AppError
   */
  private normalizeError(error: Error | AppError): AppError {
    if (error instanceof AppError) {
      return error;
    }

    // Handle specific error types
    if (error.message.includes('fetch')) {
      return new AppError(
        ErrorType.NETWORK_ERROR,
        error.message,
        "There was a network problem. Please check your connection and try again.",
        ErrorSeverity.MEDIUM,
        {},
        true,
        true
      );
    }

    if (error.message.includes('timeout')) {
      return new AppError(
        ErrorType.AI_TIMEOUT,
        error.message,
        "The request is taking longer than expected. Please try again.",
        ErrorSeverity.MEDIUM,
        {},
        true,
        true
      );
    }

    // Default unknown error
    return new AppError(
      ErrorType.UNKNOWN_ERROR,
      error.message,
      "Something unexpected happened. Please try again.",
      ErrorSeverity.MEDIUM,
      {},
      true,
      false
    );
  }

  /**
   * Log error with appropriate level
   */
  private logError(error: AppError): void {
    const logData = {
      type: error.type,
      message: error.message,
      severity: error.severity,
      context: error.context,
      stack: error.stack
    };

    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        logger.error('Critical error occurred', logData);
        break;
      case ErrorSeverity.HIGH:
        logger.error('High severity error', logData);
        break;
      case ErrorSeverity.MEDIUM:
        logger.warn('Medium severity error', logData);
        break;
      case ErrorSeverity.LOW:
        logger.info('Low severity error', logData);
        break;
    }
  }

  /**
   * Track error metrics for monitoring
   */
  private trackErrorMetrics(error: AppError): void {
    // In a real application, this would send to analytics service
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: error.type,
        fatal: error.severity === ErrorSeverity.CRITICAL,
        custom_map: {
          error_type: error.type,
          error_severity: error.severity,
          recoverable: error.recoverable
        }
      });
    }
  }

  /**
   * Generate appropriate recovery actions for the error
   */
  private generateRecoveryActions(error: AppError): ErrorRecoveryAction[] {
    const actions: ErrorRecoveryAction[] = [];

    // Retry action for retryable errors
    if (error.retryable) {
      actions.push({
        type: 'retry',
        label: 'Try Again',
        action: () => {
          // This will be handled by the calling component
        }
      });
    }

    // Specific actions based on error type
    switch (error.type) {
      case ErrorType.AI_SERVICE_UNAVAILABLE:
        actions.push({
          type: 'fallback',
          label: 'Browse Wine Library',
          action: () => {
            window.location.href = '/inventory';
          }
        });
        break;

      case ErrorType.WINE_RECOGNITION_FAILED:
        actions.push({
          type: 'manual',
          label: 'Add Wine Manually',
          action: () => {
            // This will be handled by the calling component
          }
        });
        break;

      case ErrorType.AUTH_REQUIRED:
      case ErrorType.AUTH_EXPIRED:
        actions.push({
          type: 'redirect',
          label: 'Sign In',
          action: () => {
            window.location.href = '/auth/signin';
          }
        });
        break;

      case ErrorType.OFFLINE:
        actions.push({
          type: 'refresh',
          label: 'Check Connection',
          action: () => {
            window.location.reload();
          }
        });
        break;

      case ErrorType.DATABASE_CONNECTION:
        actions.push({
          type: 'refresh',
          label: 'Refresh Page',
          action: () => {
            window.location.reload();
          }
        });
        break;
    }

    return actions;
  }

  /**
   * Calculate retry delay based on error type
   */
  private getRetryDelay(error: AppError): number | undefined {
    if (!error.retryable) {return undefined;}

    switch (error.type) {
      case ErrorType.AI_RATE_LIMIT:
        return (error.context.retryAfter as number) || 30;
      case ErrorType.AI_TIMEOUT:
        return 5;
      case ErrorType.NETWORK_ERROR:
        return 3;
      default:
        return 2;
    }
  }

  /**
   * Add error listener
   */
  addErrorListener(listener: (error: AppError) => void): void {
    this.errorListeners.push(listener);
  }

  /**
   * Remove error listener
   */
  removeErrorListener(listener: (error: AppError) => void): void {
    const index = this.errorListeners.indexOf(listener);
    if (index > -1) {
      this.errorListeners.splice(index, 1);
    }
  }

  /**
   * Notify all error listeners
   */
  private notifyListeners(error: AppError): void {
    this.errorListeners.forEach(listener => {
      try {
        listener(error);
      } catch (e) {
        console.error('Error in error listener:', e);
      }
    });
  }
}

export const errorHandler = ErrorHandler.getInstance();