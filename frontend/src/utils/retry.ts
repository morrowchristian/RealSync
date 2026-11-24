// Retry a promise-returning function, for transient backend hiccups
// (the free Render backend sleeps and can 502/time out on cold start).
// Retries `attempts` times total, waiting `delayMs` between attempts.
// Throws the last error if every attempt fails.
export async function withRetry<T>(
  fn: () => Promise<T>,
  attempts = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (i < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  throw lastError;
}
