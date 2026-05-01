export class ApiError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public response?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class RateLimitError extends ApiError {
  constructor(message: string = 'Rate limit exceeded', public resetTime?: number) {
    super(message, 'RATE_LIMIT', 429);
    this.name = 'RateLimitError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, public validationErrors?: Record<string, string[]>) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found') {
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string = 'Invalid or missing API key') {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function handleApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response?: { status?: number; data?: unknown }; message?: string };
    if (axiosError.response?.status === 429) {
      return new RateLimitError('Rate limit exceeded');
    }
    if (axiosError.response?.status === 401) {
      return new AuthenticationError();
    }
    if (axiosError.response?.status === 404) {
      return new NotFoundError();
    }
    return new ApiError(axiosError.message || 'Unknown error', undefined, axiosError.response?.status, axiosError.response?.data);
  }
  
  return new ApiError(error instanceof Error ? error.message : 'Unknown error');
}