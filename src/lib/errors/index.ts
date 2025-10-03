/**
 * Comprehensive error handling system for the AI wine sommelier application
 */

export enum ErrorType {
  // AI Service Errors
  AI_SERVICE_UNAVAILABLE = 'AI_SERVICE_UNAVAILABLE',
  AI_RATE_LIMIT = 'AI_RATE_LIMIT',
  AI_INVALID_RESPONSE = 'AI_INVALID_RESPONSE',
  AI_TIMEOUT = 'AI_TIMEOUT',
  
  // Image Processing Errors
  IMAGE_PROCESSING_FAILED = 'IMAGE_PROCESSING_FAILED',
  OCR_FAILED = 'OCR_FAILED',
  WINE_RECOGNITION_FAILED = 'WINE_RECOGNITION_FAILED',
  
  // Database Errors
  DATABASE_CONNECTION = 'DATABASE_CONNECTION',
  DATABASE_QUERY = 'DATABASE_QUERY',
  DATA_VALIDATION = 'DATA_VALIDATION',
  
  // Authentication Errors
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  AUTH_INVALID = 'AUTH_INVALID',
  AUTH_EXPIRED = 'AUTH_EXPIRED',
  
  // Network Errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  OFFLINE = 'OFFLINE',
  
  // User Input Errors
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // General Errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  FEATURE_UNAVAILABLE = 'FEATURE_UNAVAILABLE'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface ErrorContext {
  userId?: string;
  operation?: string;
  timestamp: Date;
  userAgent?: string;
  url?: string;
  additionalData?: Record<string, any>;
}

export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly severity: ErrorSeverity;
  public readonly context: ErrorContext;
  public readonly userMessage: string;
  public readonly recoverable: boolean;
  public readonly retryable: boolean;

  constructor(
    type: ErrorType,
    message: string,
    userMessage: string,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context: Partial<ErrorContext> = {},
    recoverable: boolean = true,
    retryable: boolean = false
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.severity = severity;
    this.userMessage = userMessage;
    this.recoverable = recoverable;
    this.retryable = retryable;
    this.context = {
      timestamp: new Date(),
      ...context
    };
  }

  toJSON() {
    return {
      name: this.name,
      type: this.type,
      message: this.message,
      userMessage: this.userMessage,
      severity: this.severity,
      recoverable: this.recoverable,
      retryable: this.retryable,
      context: this.context,
      stack: this.stack
    };
  }
}

// AI Service specific errors
export class AIServiceError extends AppError {
  constructor(
    message: string,
    userMessage: string = "I'm having trouble processing your request right now. Please try again in a moment.",
    context: Partial<ErrorContext> = {}
  ) {
    super(
      ErrorType.AI_SERVICE_UNAVAILABLE,
      message,
      userMessage,
      ErrorSeverity.HIGH,
      context,
      true,
      true
    );
  }
}

export class AIRateLimitError extends AppError {
  constructor(
    retryAfter?: number,
    context: Partial<ErrorContext> = {}
  ) {
    const userMessage = retryAfter 
      ? `I'm processing a lot of requests right now. Please try again in ${retryAfter} seconds.`
      : "I'm processing a lot of requests right now. Please try again in a moment.";
    
    super(
      ErrorType.AI_RATE_LIMIT,
      'AI service rate limit exceeded',
      userMessage,
      ErrorSeverity.MEDIUM,
      { ...context, retryAfter },
      true,
      true
    );
  }
}

export class AITimeoutError extends AppError {
  constructor(context: Partial<ErrorContext> = {}) {
    super(
      ErrorType.AI_TIMEOUT,
      'AI service request timed out',
      "I'm taking longer than usual to respond. Please try again.",
      ErrorSeverity.MEDIUM,
      context,
      true,
      true
    );
  }
}

// Image processing errors
export class ImageProcessingError extends AppError {
  constructor(
    message: string,
    userMessage: string = "I couldn't process that image. Please try taking another photo or uploading a different image.",
    context: Partial<ErrorContext> = {}
  ) {
    super(
      ErrorType.IMAGE_PROCESSING_FAILED,
      message,
      userMessage,
      ErrorSeverity.MEDIUM,
      context,
      true,
      true
    );
  }
}

export class WineRecognitionError extends AppError {
  constructor(context: Partial<ErrorContext> = {}) {
    super(
      ErrorType.WINE_RECOGNITION_FAILED,
      'Wine label recognition failed',
      "I couldn't identify the wine from this image. You can add the wine details manually instead.",
      ErrorSeverity.LOW,
      context,
      true,
      false
    );
  }
}

// Database errors
export class DatabaseError extends AppError {
  constructor(
    message: string,
    userMessage: string = "There was a problem saving your data. Please try again.",
    context: Partial<ErrorContext> = {}
  ) {
    super(
      ErrorType.DATABASE_CONNECTION,
      message,
      userMessage,
      ErrorSeverity.HIGH,
      context,
      true,
      true
    );
  }
}

// Authentication errors
export class AuthenticationError extends AppError {
  constructor(
    type: ErrorType = ErrorType.AUTH_REQUIRED,
    userMessage: string = "Please sign in to continue.",
    context: Partial<ErrorContext> = {}
  ) {
    super(
      type,
      'Authentication required',
      userMessage,
      ErrorSeverity.MEDIUM,
      context,
      true,
      false
    );
  }
}

// Network errors
export class NetworkError extends AppError {
  constructor(
    message: string,
    userMessage: string = "Please check your internet connection and try again.",
    context: Partial<ErrorContext> = {}
  ) {
    super(
      ErrorType.NETWORK_ERROR,
      message,
      userMessage,
      ErrorSeverity.MEDIUM,
      context,
      true,
      true
    );
  }
}

export class OfflineError extends AppError {
  constructor(context: Partial<ErrorContext> = {}) {
    super(
      ErrorType.OFFLINE,
      'Application is offline',
      "You're currently offline. Some features may not be available.",
      ErrorSeverity.LOW,
      context,
      true,
      false
    );
  }
}