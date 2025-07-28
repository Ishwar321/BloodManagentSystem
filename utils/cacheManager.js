const redis = require('redis');
const logger = require('./logger');

class CacheManager {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.defaultTTL = 3600; // 1 hour default TTL
    this.initialize();
  }

  async initialize() {
    try {
      // Only initialize Redis if URL is provided
      if (process.env.REDIS_URL) {
        this.client = redis.createClient({
          url: process.env.REDIS_URL,
          retry_strategy: (options) => {
            if (options.error && options.error.code === 'ECONNREFUSED') {
              logger.warn('Redis connection refused');
              return new Error('Redis server connection refused');
            }
            if (options.total_retry_time > 1000 * 60 * 60) {
              return new Error('Redis retry time exhausted');
            }
            if (options.attempt > 10) {
              return undefined;
            }
            return Math.min(options.attempt * 100, 3000);
          }
        });

        this.client.on('connect', () => {
          this.isConnected = true;
          logger.info('Redis cache connected successfully');
        });

        this.client.on('error', (err) => {
          this.isConnected = false;
          logger.warn('Redis cache error:', err.message);
        });

        this.client.on('end', () => {
          this.isConnected = false;
          logger.info('Redis cache connection ended');
        });

        await this.client.connect();
      } else {
        // logger.info('Redis URL not provided, using memory cache fallback');
        this.initializeMemoryCache();
      }
    } catch (error) {
      logger.warn('Failed to initialize Redis, using memory cache:', error.message);
      this.initializeMemoryCache();
    }
  }

  initializeMemoryCache() {
    // Fallback to in-memory cache
    this.memoryCache = new Map();
    this.cacheTimers = new Map();
    this.isConnected = true;
    // logger.info('Memory cache initialized as fallback');
  }

  async get(key) {
    try {
      if (!this.isConnected) return null;

      if (this.client) {
        const value = await this.client.get(key);
        return value ? JSON.parse(value) : null;
      } else {
        // Memory cache fallback
        return this.memoryCache.get(key) || null;
      }
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  async set(key, value, ttl = this.defaultTTL) {
    try {
      if (!this.isConnected) return false;

      if (this.client) {
        await this.client.setEx(key, ttl, JSON.stringify(value));
      } else {
        // Memory cache fallback
        this.memoryCache.set(key, value);
        
        // Set expiration timer
        if (this.cacheTimers.has(key)) {
          clearTimeout(this.cacheTimers.get(key));
        }
        
        const timer = setTimeout(() => {
          this.memoryCache.delete(key);
          this.cacheTimers.delete(key);
        }, ttl * 1000);
        
        this.cacheTimers.set(key, timer);
      }
      
      return true;
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  }

  async del(key) {
    try {
      if (!this.isConnected) return false;

      if (this.client) {
        await this.client.del(key);
      } else {
        // Memory cache fallback
        this.memoryCache.delete(key);
        if (this.cacheTimers.has(key)) {
          clearTimeout(this.cacheTimers.get(key));
          this.cacheTimers.delete(key);
        }
      }
      
      return true;
    } catch (error) {
      logger.error('Cache delete error:', error);
      return false;
    }
  }

  async flush() {
    try {
      if (!this.isConnected) return false;

      if (this.client) {
        await this.client.flushAll();
      } else {
        // Memory cache fallback
        this.memoryCache.clear();
        this.cacheTimers.forEach(timer => clearTimeout(timer));
        this.cacheTimers.clear();
      }
      
      logger.info('Cache flushed successfully');
      return true;
    } catch (error) {
      logger.error('Cache flush error:', error);
      return false;
    }
  }

  async exists(key) {
    try {
      if (!this.isConnected) return false;

      if (this.client) {
        return await this.client.exists(key) === 1;
      } else {
        return this.memoryCache.has(key);
      }
    } catch (error) {
      logger.error('Cache exists error:', error);
      return false;
    }
  }

  async getMultiple(keys) {
    try {
      if (!this.isConnected) return {};

      const results = {};
      
      if (this.client) {
        const values = await this.client.mGet(keys);
        keys.forEach((key, index) => {
          results[key] = values[index] ? JSON.parse(values[index]) : null;
        });
      } else {
        keys.forEach(key => {
          results[key] = this.memoryCache.get(key) || null;
        });
      }
      
      return results;
    } catch (error) {
      logger.error('Cache getMultiple error:', error);
      return {};
    }
  }

  // Cache middleware for Express routes
  middleware(ttl = this.defaultTTL) {
    return async (req, res, next) => {
      if (req.method !== 'GET') {
        return next();
      }

      const key = `cache:${req.originalUrl}:${JSON.stringify(req.query)}`;
      
      try {
        const cachedData = await this.get(key);
        
        if (cachedData) {
          logger.info(`Cache hit: ${key}`);
          return res.json(cachedData);
        }

        // Store original json method
        const originalJson = res.json;
        
        // Override json method to cache the response
        res.json = function(data) {
          if (res.statusCode === 200 && data.success) {
            cacheManager.set(key, data, ttl).catch(err => 
              logger.error('Cache set error in middleware:', err)
            );
          }
          originalJson.call(this, data);
        };

        next();
      } catch (error) {
        logger.error('Cache middleware error:', error);
        next();
      }
    };
  }

  async disconnect() {
    try {
      if (this.client && this.isConnected) {
        await this.client.disconnect();
        logger.info('Redis cache disconnected');
      }
      
      if (this.cacheTimers) {
        this.cacheTimers.forEach(timer => clearTimeout(timer));
        this.cacheTimers.clear();
      }
      
      this.isConnected = false;
    } catch (error) {
      logger.error('Cache disconnect error:', error);
    }
  }

  getStats() {
    return {
      isConnected: this.isConnected,
      type: this.client ? 'Redis' : 'Memory',
      cacheSize: this.client ? 'Unknown' : this.memoryCache.size
    };
  }
}

const cacheManager = new CacheManager();
module.exports = cacheManager;
