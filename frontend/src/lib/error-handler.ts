// frontend/src/lib/error-handler.ts

/**
 * Extract error message from various error types
 * Prevents "Objects are not valid as a React child" errors
 */
export function getErrorMessage(error: unknown): string {
  // Handle Axios errors
  if (error && typeof error === 'object') {
    // Check if it's an Axios error with response data
    if ('response' in error && error.response && typeof error.response === 'object') {
      const response = error.response as any;
      
      // FastAPI validation errors (422)
      if (response.data && Array.isArray(response.data.detail)) {
        const validationErrors = response.data.detail.map((err: any) => {
          const field = Array.isArray(err.loc) ? err.loc.join(' → ') : 'Unknown field';
          return `${field}: ${err.msg}`;
        }).join(', ');
        return `Validation error: ${validationErrors}`;
      }
      
      // Standard error response
      if (response.data && response.data.detail) {
        return typeof response.data.detail === 'string' 
          ? response.data.detail 
          : JSON.stringify(response.data.detail);
      }
      
      // HTTP status text
      if (response.statusText) {
        return response.statusText;
      }
    }
    
    // Check if it's a standard Error object
    if ('message' in error && typeof error.message === 'string') {
      return error.message;
    }
  }
  
  // Fallback for unknown error types
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unexpected error occurred';
}

/**
 * Format validation errors from FastAPI 422 response
 */
export function formatValidationErrors(errors: any[]): string {
  if (!Array.isArray(errors)) {
    return 'Validation error occurred';
  }
  
  return errors.map(err => {
    const location = Array.isArray(err.loc) 
      ? err.loc.slice(1).join(' → ')  // Skip 'body' prefix
      : 'unknown field';
    
    return `${location}: ${err.msg}`;
  }).join('\n');
}