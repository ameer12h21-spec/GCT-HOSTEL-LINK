/**
 * Wraps a Supabase-style async call with exponential backoff retry.
 * Returns { data, error } like Supabase — on final failure, error is set.
 */
export async function withRetry<T>(
  fn: () => Promise<{ data: T | null; error: any }>,
  maxAttempts = 3,
  baseDelayMs = 800
): Promise<{ data: T | null; error: any }> {
  let lastError: any = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const result = await fn();
    if (!result.error) return result;
    lastError = result.error;
    if (attempt < maxAttempts) {
      await new Promise((resolve) =>
        setTimeout(resolve, baseDelayMs * Math.pow(2, attempt - 1))
      );
    }
  }
  return { data: null, error: lastError };
}

/**
 * Retry a simple async function (that may throw) with exponential backoff.
 */
export async function retryAsync<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 800
): Promise<T> {
  let lastError: any;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts) {
        await new Promise((resolve) =>
          setTimeout(resolve, baseDelayMs * Math.pow(2, attempt - 1))
        );
      }
    }
  }
  throw lastError;
}
