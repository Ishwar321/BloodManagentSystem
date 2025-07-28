const cron = require('node-cron');
const userModel = require('../models/userModel');
const inventoryModel = require('../models/inventoryModel');
const logger = require('../utils/logger');

class ScheduleManager {
  constructor() {
    this.tasks = new Map();
  }

  // Clean up expired blood inventory (blood expires after 42 days)
  scheduleBloodExpiryCheck() {
    const task = cron.schedule('0 2 * * *', async () => { // Run daily at 2 AM
      try {
        logger.info('Running blood expiry check...');
        
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() - 42); // 42 days ago
        
        const expiredBlood = await inventoryModel.find({
          inventoryType: 'in',
          createdAt: { $lt: expiryDate }
        });

        if (expiredBlood.length > 0) {
          // Mark as expired or remove
          await inventoryModel.updateMany(
            { _id: { $in: expiredBlood.map(b => b._id) } },
            { $set: { status: 'expired' } }
          );
          
          logger.info(`Marked ${expiredBlood.length} blood units as expired`);
        }
      } catch (error) {
        logger.error('Error in blood expiry check:', error);
      }
    }, {
      scheduled: false
    });

    this.tasks.set('bloodExpiryCheck', task);
    return task;
  }

  // Send donation reminders to eligible donors
  scheduleDonationReminders() {
    const task = cron.schedule('0 9 * * 1', async () => { // Run every Monday at 9 AM
      try {
        logger.info('Sending donation reminders...');
        
        // Find donors who haven't donated in the last 56 days (8 weeks)
        const reminderDate = new Date();
        reminderDate.setDate(reminderDate.getDate() - 56);
        
        const eligibleDonors = await userModel.find({
          role: 'donar',
          isEligible: true,
          lastDonation: { $lt: reminderDate }
        });

        logger.info(`Found ${eligibleDonors.length} donors eligible for reminder`);
        
        // Here you would integrate with email/SMS service
        // For now, just log the reminder
        eligibleDonors.forEach(donor => {
          logger.info(`Reminder needed for donor: ${donor.name} (${donor.email})`);
        });
        
      } catch (error) {
        logger.error('Error in donation reminder task:', error);
      }
    }, {
      scheduled: false
    });

    this.tasks.set('donationReminders', task);
    return task;
  }

  // Generate daily reports
  scheduleDailyReports() {
    const task = cron.schedule('0 23 * * *', async () => { // Run daily at 11 PM
      try {
        logger.info('Generating daily report...');
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // Get today's statistics
        const todaysDonations = await inventoryModel.countDocuments({
          inventoryType: 'in',
          createdAt: { $gte: today, $lt: tomorrow }
        });
        
        const todaysRequests = await inventoryModel.countDocuments({
          inventoryType: 'out',
          createdAt: { $gte: today, $lt: tomorrow }
        });
        
        const newDonors = await userModel.countDocuments({
          role: 'donar',
          createdAt: { $gte: today, $lt: tomorrow }
        });
        
        logger.info(`Daily Report - Donations: ${todaysDonations}, Requests: ${todaysRequests}, New Donors: ${newDonors}`);
        
      } catch (error) {
        logger.error('Error in daily report generation:', error);
      }
    }, {
      scheduled: false
    });

    this.tasks.set('dailyReports', task);
    return task;
  }

  // Backup database (placeholder for backup logic)
  scheduleBackup() {
    const task = cron.schedule('0 3 * * 0', async () => { // Run every Sunday at 3 AM
      try {
        logger.info('Starting database backup...');
        
        // Here you would implement backup logic
        // For example, using mongodump or similar tools
        
        logger.info('Database backup completed');
        
      } catch (error) {
        logger.error('Error in database backup:', error);
      }
    }, {
      scheduled: false
    });

    this.tasks.set('backup', task);
    return task;
  }

  // Start all scheduled tasks
  startAllTasks() {
    this.scheduleBloodExpiryCheck().start();
    this.scheduleDonationReminders().start();
    this.scheduleDailyReports().start();
    this.scheduleBackup().start();
    
    logger.info('All scheduled tasks started');
  }

  // Stop all scheduled tasks
  stopAllTasks() {
    this.tasks.forEach((task, name) => {
      task.stop();
      logger.info(`Stopped task: ${name}`);
    });
    
    this.tasks.clear();
    logger.info('All scheduled tasks stopped');
  }

  // Get task status
  getTaskStatus() {
    const status = {};
    this.tasks.forEach((task, name) => {
      status[name] = {
        running: task.running,
        scheduled: task.scheduled
      };
    });
    return status;
  }
}

module.exports = new ScheduleManager();
