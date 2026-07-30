export interface CacheItem<T> {
  value: T;
  expiry: number;
}

export class TTLCache<T> {
  private cache = new Map<string, CacheItem<T>>();
  private readonly ttlMs: number;
  private readonly maxSize: number;

  constructor(ttlSeconds: number = 3600, maxSize: number = 1000) {
    this.ttlMs = ttlSeconds * 1000;
    this.maxSize = maxSize;
    
    // Periodically clean up expired items to prevent memory leaks (every 10 minutes)
    setInterval(() => this.cleanup(), 10 * 60 * 1000).unref();
  }

  set(key: string, value: T): void {
    if (this.cache.size >= this.maxSize) {
      // Very simple size limit: delete the first key if we hit maxSize
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      value,
      expiry: Date.now() + this.ttlMs
    });
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }
}
