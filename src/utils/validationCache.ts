// Simple hash function for content comparison
export const hashContent = (content: string): string => {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
};

interface CachedValidation {
  contentHash: string;
  result: any;
  timestamp: number;
  sectionName: string;
}

const CACHE_KEY_PREFIX = 'validation_cache_';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

export const getValidationCache = (sectionName: string, content: string): any | null => {
  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${sectionName}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (!cached) return null;
    
    const parsedCache: CachedValidation = JSON.parse(cached);
    
    // Check if cache expired
    if (Date.now() - parsedCache.timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(cacheKey);
      return null;
    }
    
    // Check if content changed
    const currentHash = hashContent(content);
    if (parsedCache.contentHash !== currentHash) {
      return null;
    }
    
    console.log(`✅ Using cached validation for ${sectionName}`);
    return parsedCache.result;
  } catch (error) {
    console.error('Error reading validation cache:', error);
    return null;
  }
};

export const setValidationCache = (
  sectionName: string,
  content: string,
  result: any
): void => {
  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${sectionName}`;
    const contentHash = hashContent(content);
    
    const cacheData: CachedValidation = {
      contentHash,
      result,
      timestamp: Date.now(),
      sectionName,
    };
    
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    console.log(`💾 Cached validation for ${sectionName}`);
  } catch (error) {
    console.error('Error saving validation cache:', error);
  }
};

export const clearValidationCache = (sectionName?: string): void => {
  try {
    if (sectionName) {
      const cacheKey = `${CACHE_KEY_PREFIX}${sectionName}`;
      localStorage.removeItem(cacheKey);
      console.log(`🗑️ Cleared cache for ${sectionName}`);
    } else {
      // Clear all validation caches
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(CACHE_KEY_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
      console.log('🗑️ Cleared all validation caches');
    }
  } catch (error) {
    console.error('Error clearing validation cache:', error);
  }
};
