/**
 * Comprehensive tests for error handling system
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  AppError, 
  ErrorType, 
  ErrorSeverity,
  AIServiceError,
  AIRateLimitError,
  AITimeoutError,
  ImageProcessingError,
  WineRecognitionError,
  DatabaseError,
  AuthenticationError,
  NetworkError,
  OfflineError
} from '../index';
import { errorHandler } from '../error-handler';
import { withRetry, retryConditions, CircuitBreaker } from '../../utils/retry';
import { withFallback, AIServiceFallbacks, ImageProcessingFallbacks } from '../../utils/fallback';

describe('Error Types', () => {
  describe('AppError', () => {
    it('should create error with all properties', () => {
      const error = new AppError(
        ErrorType.AI_SERVICE_UNAVAILABLE,
        'Test error',
        'User friendly message',
        ErrorSeverity.HIGH,
        { userId: 'test-user' },
        true,
        true
      );

      expect(error.type).toBe(ErrorType.AI_SERVICE_UNAVAILABLE);
      expect(error.message).toBe('Test error');
      expect(error.userMessage).toBe('User friendly message');
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.recoverable).toBe(true);
      expect(error.retryable).toBe(true);
      expect(error.context.userId).toBe('test-user');
      expect(error.context.timestamp).toBeInstanceOf(Date);
    });

    it('should serialize to JSON correctly', () => {
      const error = new AppError(
        ErrorType.NETWORK_ERROR,
        'Network failed',
        'Check your connection'
      );

      const json = error.toJSON();
      expect(json.name).toBe('AppError');
      expect(json.type).toBe(ErrorType.NETWORK_ERROR);
      expect(json.message).toBe('Network failed');
      expect(json.userMessage).toBe('Check your connection');
    });
  });

  describe('Specific Error Types', () => {
    it('should create AI service error with defaults', () => {
      const error = new AIServiceError('Service down');
      
      expect(error.type).toBe(ErrorType.AI_SERVICE_UNAVAILABLE);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.retryable).toBe(true);
    });

    it('should create rate limit error with retry time', () => {
      const error = new AIRateLimitError(60);
      
      expect(error.type).toBe(ErrorType.AI_RATE_LIMIT);
      expect(error.context.retryAfter).toBe(60);
      expect(error.userMessage).toContain('60 seconds');
    });

    it('should create timeout error', () => {
      const error = new AITimeoutError();
      
      expect(error.type).toBe(ErrorType.AI_TIMEOUT);
      expect(error.retryable).toBe(true);
    });

    it('should create image processing error', () => {
      const error = new ImageProcessingError('Failed to process');
      
      expect(error.type).toBe(ErrorType.IMAGE_PROCESSING_FAILED);
      expect(error.retryable).toBe(true);
    });

    it('should create wine recognition error', () => {
      const error = new WineRecognitionError();
      
      expect(error.type).toBe(ErrorType.WINE_RECOGNITION_FAILED);
      expect(error.severity).toBe(ErrorSeverity.LOW);
      expect(error.retryable).toBe(false);
    });
  });
});

describe('Error Handler', () => {
  it('should handle AppError correctly', () => {
    const error = new AIServiceError('Service unavailable');
    const result = errorHandler.handleError(error);

    expect(result.userMessage).toBe(error.userMessage);
    expect(result.severity).toBe(error.severity);
    expect(result.shouldRetry).toBe(error.retryable);
  });

  it('should normalize regular Error to AppError', () => {
    const error = new Error('Network timeout');
    const result = errorHandler.handleError(error);

    expect(result.userMessage).toContain('longer than expected');
    expect(result.shouldRetry).toBe(true);
  });

  it('should generate recovery actions for different error types', () => {
    const aiError = new AIServiceError('Service down');
    const result = errorHandler.handleError(aiError);

    expect(result.recoveryActions).toHaveLength(2); // Retry + Fallback
    expect(result.recoveryActions[0].type).toBe('retry');
    expect(result.recoveryActions[1].type).toBe('fallback');
  });

  it('should calculate retry delay correctly', () => {
    const rateLimitError = new AIRateLimitError(30);
    const result = errorHandler.handleError(rateLimitError);

    expect(result.retryDelay).toBe(30);
  });
});

describe('Retry Logic', () => {
  it('should retry failed operations', async () => {
    let attempts = 0;
    const operation = vi.fn().mockImplementation(() => {
      attempts++;
      if (attempts < 3) {
        throw new Error('Temporary failure');
      }
      return Promise.resolve('success');
    });

    const result = await withRetry(operation, {
      maxAttempts: 3,
      baseDelay: 10
    });

    expect(result.success).toBe(true);
    expect(result.result).toBe('success');
    expect(result.attempts).toBe(3);
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it('should respect retry conditions', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('Client error 400'));

    const result = await withRetry(operation, {
      maxAttempts: 3,
      retryCondition: retryConditions.httpErrors
    });

    expect(result.success).toBe(false);
    expect(operation).toHaveBeenCalledTimes(1); // No retries for 4xx errors
  });

  it('should handle circuit breaker', async () => {
    const circuitBreaker = new CircuitBreaker(2, 1000);
    const failingOperation = vi.fn().mockRejectedValue(new Error('Service down'));

    // First two failures should go through
    await expect(circuitBreaker.execute(failingOperation)).rejects.toThrow();
    await expect(circuitBreaker.execute(failingOperation)).rejects.toThrow();

    // Circuit should be open now
    expect(circuitBreaker.getState()).toBe('open');
    await expect(circuitBreaker.execute(failingOperation)).rejects.toThrow('Circuit breaker is open');
  });
});

describe('Fallback Mechanisms', () => {
  it('should use fallback value when primary fails', async () => {
    const failingOperation = vi.fn().mockRejectedValue(new Error('Service down'));
    
    const result = await withFallback(failingOperation, {
      fallbackValue: 'fallback result'
    });

    expect(result).toBe('fallback result');
  });

  it('should use fallback function when primary fails', async () => {
    const failingOperation = vi.fn().mockRejectedValue(new Error('Service down'));
    const fallbackFunction = vi.fn().mockResolvedValue('fallback from function');
    
    const result = await withFallback(failingOperation, {
      fallbackFunction
    });

    expect(result).toBe('fallback from function');
    expect(fallbackFunction).toHaveBeenCalled();
  });

  it('should provide AI service fallbacks', () => {
    const fallback = AIServiceFallbacks.getRecommendationFallback();
    
    expect(fallback.fallbackMode).toBe(true);
    expect(fallback.recommendations).toHaveLength(2);
    expect(fallback.message).toContain('temporarily unavailable');
  });

  it('should provide chat fallbacks', () => {
    const fallback = AIServiceFallbacks.getChatFallback('what should i drink');
    
    expect(fallback.fallbackMode).toBe(true);
    expect(fallback.message).toContain('choose a wine');
    expect(fallback.suggestions).toHaveLength(3);
  });

  it('should provide image processing fallbacks', () => {
    const fallback = ImageProcessingFallbacks.getWineRecognitionFallback();
    
    expect(fallback.success).toBe(false);
    expect(fallback.fallbackMode).toBe(true);
    expect(fallback.suggestions).toHaveLength(3);
  });
});

describe('Performance Integration', () => {
  it('should track error metrics', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const error = new AIServiceError('Service down');
    errorHandler.handleError(error, { trackMetrics: true });

    // In a real test, you'd verify the metrics were sent to your analytics service
    expect(consoleSpy).toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });
});

describe('Error Listeners', () => {
  it('should notify error listeners', () => {
    const listener = vi.fn();
    errorHandler.addErrorListener(listener);

    const error = new AIServiceError('Test error');
    errorHandler.handleError(error);

    expect(listener).toHaveBeenCalledWith(error);

    errorHandler.removeErrorListener(listener);
  });

  it('should handle listener errors gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const faultyListener = vi.fn().mockImplementation(() => {
      throw new Error('Listener error');
    });

    errorHandler.addErrorListener(faultyListener);

    const error = new AIServiceError('Test error');
    expect(() => errorHandler.handleError(error)).not.toThrow();

    expect(consoleSpy).toHaveBeenCalledWith('Error in error listener:', expect.any(Error));

    errorHandler.removeErrorListener(faultyListener);
    consoleSpy.mockRestore();
  });
});