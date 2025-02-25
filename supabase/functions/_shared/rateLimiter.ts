export class RateLimiter {
  private static instance: RateLimiter;
  private requests: Map<string, number[]>;
  private backoffTimes: Map<string, number>;
  private readonly windowMs: number = 60000; // 1 minute
  private readonly maxRequests: number = 5; // 5 requests per minute
  private readonly maxResultsRequests: number = 2; // 2 requests per minute for Results
  private readonly maxBackoffMs: number = 300000; // 5 minutes
  private readonly baseBackoffMs: number = 30000; // 30 seconds
  private readonly cache: Map<string, { result: any; timestamp: number }>;
  private readonly cacheTTL: number = 300000; // 5 minutes cache TTL
  private readonly resultsCacheTTL: number = 600000; // 10 minutes cache TTL for Results

  private constructor() {
    this.requests = new Map();
    this.backoffTimes = new Map();
    this.cache = new Map();
  }

  public static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  public getCachedResult(key: string, isResultsSection: boolean = false): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const ttl = isResultsSection ? this.resultsCacheTTL : this.cacheTTL;
    if (Date.now() - cached.timestamp > ttl) {
      this.cache.delete(key);
      return null;
    }

    console.log(`Cache hit for key: ${key}`);
    return cached.result;
  }

  public setCacheResult(key: string, result: any): void {
    this.cache.set(key, {
      result,
      timestamp: Date.now()
    });
    console.log(`Cached result for key: ${key}`);
  }

  public isLimited(clientId: string, isResultsSection: boolean = false): boolean {
    const now = Date.now();
    
    // Check if in backoff period
    const backoffUntil = this.backoffTimes.get(clientId);
    if (backoffUntil && now < backoffUntil) {
      console.log(`Client ${clientId} is in backoff period until ${new Date(backoffUntil)}`);
      return true;
    }

    // Clean up old requests
    this.cleanupOldRequests(clientId, now);
    
    const clientRequests = this.requests.get(clientId) || [];
    const maxRequests = isResultsSection ? this.maxResultsRequests : this.maxRequests;
    const isLimited = clientRequests.length >= maxRequests;
    
    if (isLimited) {
      console.log(`Rate limit exceeded for client ${clientId}. ${clientRequests.length} requests in the last minute.`);
      this.setBackoff(clientId);
    }
    
    return isLimited;
  }

  private cleanupOldRequests(clientId: string, now: number): void {
    const clientRequests = this.requests.get(clientId) || [];
    const validRequests = clientRequests.filter(
      timestamp => now - timestamp < this.windowMs
    );
    this.requests.set(clientId, validRequests);
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
    
    // Clean up old requests before calculating
    this.cleanupOldRequests(clientId, now);
    
    const updatedRequests = this.requests.get(clientId) || [];
    if (updatedRequests.length < this.maxRequests) return 0;
    
    const oldestRequest = Math.min(...updatedRequests);
    return Math.max(0, this.windowMs - (now - oldestRequest));
  }

  public recordRequest(clientId: string): void {
    const now = Date.now();
    const clientRequests = this.requests.get(clientId) || [];
    
    // Clean up old requests before recording
    this.cleanupOldRequests(clientId, now);
    
    const updatedRequests = this.requests.get(clientId) || [];
    updatedRequests.push(now);
    this.requests.set(clientId, updatedRequests);
    
    console.log(`Recorded request for client ${clientId}. Total requests in window: ${updatedRequests.length}`);
  }

  public setBackoff(clientId: string): void {
    const now = Date.now();
    const currentBackoff = this.backoffTimes.get(clientId);
    
    // Implement exponential backoff
    let nextBackoff = currentBackoff ? 
      Math.min(currentBackoff * 2, this.maxBackoffMs) : 
      this.baseBackoffMs;
    
    this.backoffTimes.set(clientId, now + nextBackoff);
    console.log(`Set backoff for client ${clientId} until ${new Date(now + nextBackoff)}`);
  }

  public clearBackoff(clientId: string): void {
    this.backoffTimes.delete(clientId);
    console.log(`Cleared backoff for client ${clientId}`);
  }
}