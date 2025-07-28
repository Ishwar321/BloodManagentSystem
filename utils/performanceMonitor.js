const logger = require('../utils/logger');

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: 0,
      errors: 0,
      totalResponseTime: 0,
      averageResponseTime: 0,
      slowRequests: 0,
      endpoints: new Map(),
      startTime: Date.now()
    };
    this.slowRequestThreshold = 1000; // 1 second
  }

  // Middleware to monitor request performance
  middleware() {
    return (req, res, next) => {
      const startTime = Date.now();
      const endpoint = `${req.method} ${req.route?.path || req.path}`;

      // Track request start
      this.metrics.requests++;

      // Override end method to capture response time
      const originalEnd = res.end;
      res.end = (...args) => {
        const responseTime = Date.now() - startTime;
        
        // Update metrics
        this.updateMetrics(endpoint, responseTime, res.statusCode);
        
        // Log slow requests
        if (responseTime > this.slowRequestThreshold) {
          logger.warn(`Slow request detected: ${endpoint} - ${responseTime}ms`);
          this.metrics.slowRequests++;
        }

        // Call original end method
        originalEnd.apply(res, args);
      };

      next();
    };
  }

  updateMetrics(endpoint, responseTime, statusCode) {
    // Update total response time and average
    this.metrics.totalResponseTime += responseTime;
    this.metrics.averageResponseTime = this.metrics.totalResponseTime / this.metrics.requests;

    // Track errors
    if (statusCode >= 400) {
      this.metrics.errors++;
    }

    // Track endpoint-specific metrics
    if (!this.metrics.endpoints.has(endpoint)) {
      this.metrics.endpoints.set(endpoint, {
        requests: 0,
        totalTime: 0,
        averageTime: 0,
        errors: 0,
        minTime: responseTime,
        maxTime: responseTime
      });
    }

    const endpointMetrics = this.metrics.endpoints.get(endpoint);
    endpointMetrics.requests++;
    endpointMetrics.totalTime += responseTime;
    endpointMetrics.averageTime = endpointMetrics.totalTime / endpointMetrics.requests;
    endpointMetrics.minTime = Math.min(endpointMetrics.minTime, responseTime);
    endpointMetrics.maxTime = Math.max(endpointMetrics.maxTime, responseTime);
    
    if (statusCode >= 400) {
      endpointMetrics.errors++;
    }
  }

  getMetrics() {
    const uptime = Date.now() - this.metrics.startTime;
    const requestsPerSecond = this.metrics.requests / (uptime / 1000);

    return {
      uptime: uptime,
      uptimeFormatted: this.formatUptime(uptime),
      requests: {
        total: this.metrics.requests,
        errors: this.metrics.errors,
        errorRate: this.metrics.requests ? (this.metrics.errors / this.metrics.requests * 100).toFixed(2) : 0,
        requestsPerSecond: requestsPerSecond.toFixed(2),
        slowRequests: this.metrics.slowRequests
      },
      responseTime: {
        average: this.metrics.averageResponseTime.toFixed(2),
        total: this.metrics.totalResponseTime
      },
      endpoints: this.getTopEndpoints(),
      memory: this.getMemoryUsage(),
      cpu: process.cpuUsage()
    };
  }

  getTopEndpoints(limit = 10) {
    const endpointArray = Array.from(this.metrics.endpoints.entries())
      .map(([endpoint, metrics]) => ({
        endpoint,
        ...metrics,
        errorRate: metrics.requests ? (metrics.errors / metrics.requests * 100).toFixed(2) : 0
      }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, limit);

    return endpointArray;
  }

  getMemoryUsage() {
    const memUsage = process.memoryUsage();
    return {
      rss: this.formatBytes(memUsage.rss),
      heapTotal: this.formatBytes(memUsage.heapTotal),
      heapUsed: this.formatBytes(memUsage.heapUsed),
      external: this.formatBytes(memUsage.external),
      arrayBuffers: this.formatBytes(memUsage.arrayBuffers)
    };
  }

  formatBytes(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  reset() {
    this.metrics = {
      requests: 0,
      errors: 0,
      totalResponseTime: 0,
      averageResponseTime: 0,
      slowRequests: 0,
      endpoints: new Map(),
      startTime: Date.now()
    };
    logger.info('Performance metrics reset');
  }

  // Memory leak detection
  checkMemoryLeaks() {
    const memUsage = process.memoryUsage();
    const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
    
    if (heapUsedMB > 500) { // Alert if heap usage > 500MB
      logger.warn(`High memory usage detected: ${heapUsedMB.toFixed(2)}MB`);
      return true;
    }
    return false;
  }

  // Performance optimization suggestions
  getOptimizationSuggestions() {
    const suggestions = [];
    const metrics = this.getMetrics();

    if (parseFloat(metrics.requests.errorRate) > 5) {
      suggestions.push('High error rate detected. Consider reviewing error handling and validation.');
    }

    if (parseFloat(metrics.responseTime.average) > 500) {
      suggestions.push('High average response time. Consider implementing caching or optimizing database queries.');
    }

    if (this.metrics.slowRequests > this.metrics.requests * 0.1) {
      suggestions.push('Many slow requests detected. Consider implementing request timeouts and optimization.');
    }

    const topEndpoints = this.getTopEndpoints(5);
    const slowEndpoints = topEndpoints.filter(ep => ep.averageTime > 1000);
    if (slowEndpoints.length > 0) {
      suggestions.push(`Slow endpoints detected: ${slowEndpoints.map(ep => ep.endpoint).join(', ')}`);
    }

    return suggestions;
  }
}

module.exports = new PerformanceMonitor();
