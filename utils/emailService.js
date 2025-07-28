const nodemailer = require('nodemailer');
const logger = require('./logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialize();
  }

  initialize() {
    try {
      this.transporter = nodemailer.createTransport({
        service: 'gmail', // You can change this to your preferred email service
        auth: {
          user: process.env.EMAIL_USER || 'your-email@gmail.com',
          pass: process.env.EMAIL_PASS || 'your-app-password'
        }
      });

      // Verify connection only if credentials are properly configured
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS && 
          process.env.EMAIL_USER !== 'your-email@gmail.com') {
        this.transporter.verify((error, success) => {
          if (error) {
            logger.warn('Email service not configured properly:', error.message);
          } else {
            logger.info('Email service is ready to send messages');
          }
        });
      }
      // Skip verification if using default placeholder values
    } catch (error) {
      logger.error('Failed to initialize email service:', error);
    }
  }

  async sendEmail(to, subject, html, text = '') {
    try {
      if (!this.transporter) {
        logger.warn('Email service not initialized');
        return false;
      }

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'Blood Bank App <noreply@bloodbank.com>',
        to,
        subject,
        html,
        text
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully to ${to}`);
      return result;
    } catch (error) {
      logger.error(`Failed to send email to ${to}:`, error);
      return false;
    }
  }

  async sendWelcomeEmail(user) {
    const subject = 'Welcome to Blood Bank App!';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545;">Welcome to Blood Bank App!</h2>
        <p>Dear ${user.name || user.hospitalName || user.organisationName},</p>
        <p>Thank you for joining our blood donation platform. Your account has been successfully created.</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3>Account Details:</h3>
          <p><strong>Email:</strong> ${user.email}</p>
          <p><strong>Role:</strong> ${user.role}</p>
          <p><strong>Registration Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        <p>You can now log in to your account and start contributing to saving lives through blood donation.</p>
        <p>If you have any questions, please don't hesitate to contact our support team.</p>
        <p>Best regards,<br>Blood Bank App Team</p>
      </div>
    `;
    
    return this.sendEmail(user.email, subject, html);
  }

  async sendDonationReminder(donor) {
    const subject = 'Time for Your Next Blood Donation!';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545;">It's Time to Donate Again!</h2>
        <p>Dear ${donor.name},</p>
        <p>We hope you're doing well! It's been a while since your last donation, and we wanted to remind you that you're eligible to donate again.</p>
        <div style="background-color: #e8f5e8; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3>Why Your Donation Matters:</h3>
          <ul>
            <li>One donation can save up to 3 lives</li>
            <li>Blood is needed every 2 seconds</li>
            <li>Your blood type (${donor.bloodGroup}) is always in demand</li>
          </ul>
        </div>
        <p>Please consider scheduling your next donation. Every donation makes a difference!</p>
        <p>Thank you for being a life-saver!</p>
        <p>Best regards,<br>Blood Bank App Team</p>
      </div>
    `;
    
    return this.sendEmail(donor.email, subject, html);
  }

  async sendBloodRequestNotification(hospital, bloodGroup, quantity) {
    const subject = 'Blood Request Notification';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545;">Blood Request Submitted</h2>
        <p>Dear ${hospital.hospitalName},</p>
        <p>Your blood request has been successfully submitted to our system.</p>
        <div style="background-color: #fff3cd; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3>Request Details:</h3>
          <p><strong>Blood Group:</strong> ${bloodGroup}</p>
          <p><strong>Quantity:</strong> ${quantity} units</p>
          <p><strong>Request Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        <p>We will process your request and notify you once blood is available.</p>
        <p>For urgent requests, please contact us directly.</p>
        <p>Best regards,<br>Blood Bank App Team</p>
      </div>
    `;
    
    return this.sendEmail(hospital.email, subject, html);
  }

  async sendEventNotification(participants, event) {
    const subject = `Upcoming Event: ${event.title}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545;">${event.title}</h2>
        <p>Dear Participant,</p>
        <p>This is a reminder about the upcoming blood donation event you registered for.</p>
        <div style="background-color: #e3f2fd; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3>Event Details:</h3>
          <p><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
          <p><strong>Time:</strong> ${event.startTime} - ${event.endTime}</p>
          <p><strong>Location:</strong> ${event.location.address}</p>
          <p><strong>Description:</strong> ${event.description}</p>
        </div>
        <p>Please bring a valid ID and ensure you meet the donation eligibility criteria.</p>
        <p>Thank you for your commitment to saving lives!</p>
        <p>Best regards,<br>Blood Bank App Team</p>
      </div>
    `;
    
    // Send to all participants
    const promises = participants.map(participant => 
      this.sendEmail(participant.email, subject, html)
    );
    
    return Promise.allSettled(promises);
  }
}

module.exports = new EmailService();
