export class RateLimiter {
  private static instance: RateLimiter;
  private requests: Map<string, number[]>;
  private readonly windowMs = 60000; // 1 minute window
  private readonly maxRequests = 5;   // 5 requests per minute

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
    this.cleanup(clientId);
    const timestamps = this.requests.get(clientId) || [];
    return timestamps.length >= this.maxRequests;
  }

  public recordRequest(clientId: string): void {
    const timestamps = this.requests.get(clientId) || [];
    timestamps.push(Date.now());
    this.requests.set(clientId, timestamps);
  }

  public getRemainingTime(clientId: string): number {
    const timestamps = this.requests.get(clientId) || [];
    if (timestamps.length === 0) return 0;
    
    const oldestTimestamp = timestamps[0];
    return Math.max(0, this.windowMs - (Date.now() - oldestTimestamp));
  }

  private cleanup(clientId: string): void {
    const now = Date.now();
    const timestamps = this.requests.get(clientId) || [];
    const validTimestamps = timestamps.filter(
      timestamp => now - timestamp < this.windowMs
    );
    
    if (validTimestamps.length > 0) {
      this.requests.set(clientId, validTimestamps);
    } else {
      this.requests.delete(clientId);
    }
  }
}