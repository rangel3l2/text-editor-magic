export class RateLimiter {
  private static instance: RateLimiter;
  private requests: Map<string, number[]>;
  private readonly windowMs: number = 60000; // 1 minute
  private readonly maxRequests: number = 5; // 5 requests per minute

  private constructor() {
    this.requests = new Map();
  }

  public static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  public isLimited(clientId: string): boolean {
    const now = Date.now();
    const clientRequests = this.requests.get(clientId) || [];
    
    // Remove requests outside the time window
    const validRequests = clientRequests.filter(
      timestamp => now - timestamp < this.windowMs
    );
    
    this.requests.set(clientId, validRequests);
    
    return validRequests.length >= this.maxRequests;
  }

  public getRemainingTime(clientId: string): number {
    const clientRequests = this.requests.get(clientId) || [];
    if (clientRequests.length === 0) return 0;
    
    const oldestRequest = Math.min(...clientRequests);
    const now = Date.now();
    const timeElapsed = now - oldestRequest;
    
    return Math.max(0, this.windowMs - timeElapsed);
  }

  public recordRequest(clientId: string): void {
    const now = Date.now();
    const clientRequests = this.requests.get(clientId) || [];
    clientRequests.push(now);
    this.requests.set(clientId, clientRequests);
  }
}