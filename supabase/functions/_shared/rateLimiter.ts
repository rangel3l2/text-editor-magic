export class RateLimiter {
  private static instance: RateLimiter;
  private requests: Map<string, number[]>;
  private backoffTimes: Map<string, number>;
  private readonly windowMs: number = 60000; // 1 minute
  private readonly maxRequests: number = 3; // 3 requests per minute
  private readonly maxBackoffMs: number = 300000; // 5 minutes

  private constructor() {
    this.requests = new Map();
    this.backoffTimes = new Map();
  }

  public static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  public isLimited(clientId: string): boolean {
    const now = Date.now();
    
    // Check if in backoff period
    const backoffUntil = this.backoffTimes.get(clientId);
    if (backoffUntil && now < backoffUntil) {
      return true;
    }

    const clientRequests = this.requests.get(clientId) || [];
    
    // Remove requests outside the time window
    const validRequests = clientRequests.filter(
      timestamp => now - timestamp < this.windowMs
    );
    
    this.requests.set(clientId, validRequests);
    
    return validRequests.length >= this.maxRequests;
  }

  public getRemainingTime(clientId: string): number {
    const now = Date.now();
    
    // Check backoff period first
    const backoffUntil = this.backoffTimes.get(clientId);
    if (backoffUntil && now < backoffUntil) {
      return backoffUntil - now;
    }

    const clientRequests = this.requests.get(clientId) || [];
    if (clientRequests.length === 0) return 0;
    
    const oldestRequest = Math.min(...clientRequests);
    const timeElapsed = now - oldestRequest;
    
    return Math.max(0, this.windowMs - timeElapsed);
  }

  public recordRequest(clientId: string): void {
    const now = Date.now();
    const clientRequests = this.requests.get(clientId) || [];
    clientRequests.push(now);
    this.requests.set(clientId, clientRequests);
  }

  public setBackoff(clientId: string): void {
    const now = Date.now();
    const currentBackoff = this.backoffTimes.get(clientId);
    
    // Implement exponential backoff
    let nextBackoff = currentBackoff ? 
      Math.min(currentBackoff * 2, this.maxBackoffMs) : 
      30000; // Start with 30 seconds
    
    this.backoffTimes.set(clientId, now + nextBackoff);
  }

  public clearBackoff(clientId: string): void {
    this.backoffTimes.delete(clientId);
  }
}