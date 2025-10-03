/**
 * Retry utility with exponential backoff and jitter
 */

export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  exponentialBase?: number;
  jitter?: boolean;
  retryCondition?: (error: Error) => boolean;
  onRetry?: (attempt: number, error: Error) => void;
}

export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: Error;
  attempts: number;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  exponentialBase: 2,
  jitter: true,
  retryCondition: () => true,
  onRetry: () => {}
};

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error;
  
  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      const result = await fn();
      return {
        success: true,
        result,
        attempts: attempt
      };
    } catch (error) {
      lastError = error as Error;
      
      // Check if we should retry this error
      if (!opts.retryCondition(lastError)) {
        break;
      }
      
      // Don't delay after the last attempt
      if (attempt < opts.maxAttempts) {
        opts.onRetry(attempt, lastError);
        
        const delay = calculateDelay(attempt, opts);
        await sleep(delay);
      }
    }
  }
  
  return {
    success: false,
    error: lastError!,
    attempts: opts.maxAttempts
  };
}

/**
 * Calculate delay with exponential backoff and optional jitter
 */
function calculateDelay(attempt: number, options: Required<RetryOptions>): number {
  const exponentialDelay = options.baseDelay * Math.pow(options.exponentialBase, attempt - 1);
  const cappedDelay = Math.min(exponentialDelay, options.maxDelay);
  
  if (options.jitter) {
    // Add random jitter (±25%)
    const jitterRange = cappedDelay * 0.25;
    const jitter = (Math.random() - 0.5) * 2 * jitterRange;
    return Math.max(0, cappedDelay + jitter);
  }
  
  return cappedDelay;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry conditions for common error types
 */
export const retryConditions = {
  // Retry network errors but not client errors (4xx)
  networkErrors: (error: Error): boolean => {
    if (error.message.includes('fetch')) {
      return true;
    }
    if (error.message.includes('timeout')) {
      return true;
    }
    if (error.message.includes('NetworkError')) {
      return true;
    }
    return false;
  },
  
  // Retry server errors (5xx) but not client errors (4xx)
  httpErrors: (error: Error): boolean => {
    const statusMatch = error.message.match(/status (\d+)/);
    if (statusMatch) {
      const status = parseInt(statusMatch[1]);
      return status >= 500; // Only retry server errors
    }
    return false;
  },
  
  // Retry rate limit errors
  rateLimitErrors: (error: Error): boolean => {
    return error.message.includes('rate limit') || 
           error.message.includes('429') ||
           error.message.includes('Too Many Requests');
  },
  
  // Retry timeout errors
  timeoutErrors: (error: Error): boolean => {
    return error.message.includes('timeout') ||
           error.message.includes('TIMEOUT');
  }
};

/**
 * Circuit breaker pattern for preventing cascading failures
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  constructor(
    private failureThreshold = 5,
    private recoveryTimeout = 60000 // 1 minute
  ) {}
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }
  
  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'open';
    }
  }
  
  getState(): string {
    return this.state;
  }
  
  reset(): void {
    this.failures = 0;
    this.lastFailureTime = 0;
    this.state = 'closed';
  }
}