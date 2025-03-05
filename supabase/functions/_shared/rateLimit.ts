
import { RateLimiter } from "./rateLimiter.ts";

// Create separate rate limiters for different function endpoints
const rateLimiters: Record<string, RateLimiter> = {};

interface RateLimitResult {
  allowed: boolean;
  timeRemaining: number;
  remainingRequests: number;
}

/**
 * Apply rate limiting for a specific client and function
 * 
 * @param clientId The client identifier (usually IP address)
 * @param functionName The name of the function being rate limited
 * @param maxRequests Maximum number of requests in the time window (default: 5)
 * @param timeWindowMs Time window in milliseconds (default: 60000 = 1 minute)
 * @returns Object containing rate limit information
 */
export async function rateLimit(
  clientId: string, 
  functionName: string,
  maxRequests: number = 5,
  timeWindowMs: number = 60000
): Promise<RateLimitResult> {
  // Create a rate limiter for this function if it doesn't exist
  if (!rateLimiters[functionName]) {
    rateLimiters[functionName] = new RateLimiter(maxRequests, timeWindowMs);
  }
  
  const limiter = rateLimiters[functionName];
  const isRateLimited = limiter.isRateLimited(clientId);
  
  return {
    allowed: !isRateLimited,
    timeRemaining: isRateLimited ? limiter.getNextAvailableTime(clientId) - Date.now() : 0,
    remainingRequests: limiter.getRemainingRequests(clientId)
  };
}
