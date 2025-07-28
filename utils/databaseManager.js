const mongoose = require('mongoose');
const logger = require('../utils/logger');

class DatabaseManager {
  constructor() {
    this.isConnected = false;
    this.connectionAttempts = 0;
    this.maxRetries = 5;
    this.retryDelay = 5000; // 5 seconds
  }

  async connect(mongoUri) {
    try {
      this.connectionAttempts++;
      logger.info(`Database connection attempt ${this.connectionAttempts}/${this.maxRetries}`);

      await mongoose.connect(mongoUri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
        maxIdleTimeMS: 30000,
        connectTimeoutMS: 20000
      });

      this.isConnected = true;
      this.connectionAttempts = 0;
      logger.info('MongoDB connected successfully');

      // Handle connection events
      mongoose.connection.on('disconnected', () => {
        this.isConnected = false;
        logger.warn('MongoDB disconnected');
        this.handleReconnection(mongoUri);
      });

      mongoose.connection.on('error', (err) => {
        logger.error('MongoDB connection error:', err);
        this.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        this.isConnected = true;
        logger.info('MongoDB reconnected');
      });

      return true;
    } catch (error) {
      logger.error(`Database connection failed (attempt ${this.connectionAttempts}):`, error);
      
      if (this.connectionAttempts < this.maxRetries) {
        logger.info(`Retrying connection in ${this.retryDelay / 1000} seconds...`);
        await this.delay(this.retryDelay);
        return this.connect(mongoUri);
      } else {
        logger.error('Max connection attempts reached. Exiting...');
        process.exit(1);
      }
    }
  }

  async handleReconnection(mongoUri) {
    if (this.connectionAttempts < this.maxRetries && !this.isConnected) {
      await this.delay(this.retryDelay);
      await this.connect(mongoUri);
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async disconnect() {
    try {
      await mongoose.disconnect();
      this.isConnected = false;
      logger.info('MongoDB disconnected gracefully');
    } catch (error) {
      logger.error('Error during MongoDB disconnection:', error);
    }
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name
    };
  }

  async getStats() {
    try {
      if (!this.isConnected) {
        return { error: 'Database not connected' };
      }

      const admin = mongoose.connection.db.admin();
      const stats = await admin.serverStatus();
      
      return {
        uptime: stats.uptime,
        version: stats.version,
        connections: stats.connections,
        memory: stats.mem,
        operations: stats.opcounters
      };
    } catch (error) {
      logger.error('Error getting database stats:', error);
      return { error: error.message };
    }
  }
}

module.exports = new DatabaseManager();
