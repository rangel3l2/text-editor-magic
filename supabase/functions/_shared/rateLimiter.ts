export class RateLimiter {
  private static instance: RateLimiter;
  private clients: Map<string, { count: number; timestamp: number }>;
  private readonly RATE_LIMIT = 5; // Reduced from 10 to be more conservative
  private readonly RATE_WINDOW = 60 * 1000; // 1 minute window

  private constructor() {
    this.clients = new Map();
  }

  public static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  public isLimited(clientId: string): boolean {
    const now = Date.now();
    const clientRate = this.clients.get(clientId);

    if (!clientRate) {
      this.clients.set(clientId, { count: 1, timestamp: now });
      return false;
    }

    if (now - clientRate.timestamp > this.RATE_WINDOW) {
      this.clients.set(clientId, { count: 1, timestamp: now });
      return false;
    }

    if (clientRate.count >= this.RATE_LIMIT) {
      return true;
    }

    clientRate.count++;
    return false;
  }

  public getRemainingTime(clientId: string): number {
    const clientRate = this.clients.get(clientId);
    if (!clientRate) return 0;
    
    const timeElapsed = Date.now() - clientRate.timestamp;
    return Math.max(0, this.RATE_WINDOW - timeElapsed);
  }
}