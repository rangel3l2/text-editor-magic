
export class RateLimiter {
  private requestMap: Map<string, number[]>;
  private maxRequests: number;
  private timeWindowMs: number;

  constructor(maxRequests: number = 5, timeWindowMs: number = 60000) {
    this.requestMap = new Map();
    this.maxRequests = maxRequests;
    this.timeWindowMs = timeWindowMs;
  }

  public isRateLimited(clientId: string): boolean {
    const now = Date.now();
    const timestamps = this.requestMap.get(clientId) || [];

    // Filter out timestamps that are outside the time window
    const recentTimestamps = timestamps.filter(timestamp => now - timestamp < this.timeWindowMs);
    
    // Update the timestamps for this client
    this.requestMap.set(clientId, recentTimestamps);

    // Check if the client has made too many requests
    if (recentTimestamps.length >= this.maxRequests) {
      return true;
    }

    // Add the current timestamp
    recentTimestamps.push(now);
    this.requestMap.set(clientId, recentTimestamps);
    return false;
  }

  public getRemainingRequests(clientId: string): number {
    const now = Date.now();
    const timestamps = this.requestMap.get(clientId) || [];
    const recentTimestamps = timestamps.filter(timestamp => now - timestamp < this.timeWindowMs);
    
    return Math.max(0, this.maxRequests - recentTimestamps.length);
  }

  public getNextAvailableTime(clientId: string): number {
    const now = Date.now();
    const timestamps = this.requestMap.get(clientId) || [];
    
    if (timestamps.length === 0) {
      return now;
    }
    
    const sortedTimestamps = [...timestamps].sort((a, b) => a - b);
    const oldestTimestamp = sortedTimestamps[0];
    
    return oldestTimestamp + this.timeWindowMs;
  }
}

export default RateLimiter;
