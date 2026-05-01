export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: number;
}

export class RateLimiter {
  private limit: number = 10;
  private remaining: number = 10;
  private resetTime: number = 0;
  private buffer: number = 5;

  setBuffer(buffer: number): void {
    this.buffer = buffer;
  }

  updateFromHeaders(headers: Record<string, string>): void {
    const limit = headers['x-ratelimit-requests-limit'] || headers['X-RateLimit-Limit'];
    const remaining = headers['x-ratelimit-requests-remaining'] || headers['X-RateLimit-Remaining'];
    const reset = headers['x-ratelimit-requests-reset'] || headers['X-RateLimit-Reset'];

    if (limit) this.limit = parseInt(limit, 10);
    if (remaining) this.remaining = parseInt(remaining, 10);
    if (reset) this.resetTime = parseInt(reset, 10) * 1000;
  }

  getRateLimitInfo(): RateLimitInfo {
    return {
      limit: this.limit,
      remaining: this.remaining,
      resetTime: this.resetTime,
    };
  }

  async waitIfNeeded(): Promise<void> {
    if (this.remaining <= this.buffer && this.resetTime > Date.now()) {
      const waitTime = this.resetTime - Date.now() + 100;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  shouldRetry(): boolean {
    return this.remaining > 0;
  }

  isLimited(): boolean {
    return this.remaining <= 0;
  }
}