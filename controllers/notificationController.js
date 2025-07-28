const notificationModel = require("../models/notificationModel");
const userModel = require("../models/userModel");
const mongoose = require("mongoose");

// CREATE NOTIFICATION
const createNotificationController = async (req, res) => {
  try {
    const {
      title,
      message,
      type,
      targetAudience,
      criteria,
      priority,
      expiryDate,
    } = req.body;

    if (!title || !message || !type) {
      return res.status(400).send({
        success: false,
        message: "Title, message, and type are required",
      });
    }

    let recipients = [];

    if (targetAudience === "specific" && req.body.recipients) {
      recipients = req.body.recipients.map(userId => ({ user: userId }));
    } else {
      // Find users based on target audience and criteria
      let query = { isActive: true };
      
      if (targetAudience !== "all") {
        if (targetAudience === "donors") query.role = "donar";
        else if (targetAudience === "hospitals") query.role = "hospital";
        else if (targetAudience === "organizations") query.role = "organisation";
      }

      // Apply additional criteria
      if (criteria) {
        if (criteria.bloodGroup && criteria.bloodGroup.length > 0) {
          query.bloodGroup = { $in: criteria.bloodGroup };
        }
        if (criteria.location) {
          if (criteria.location.city) {
            query["location.city"] = new RegExp(criteria.location.city, "i");
          }
          if (criteria.location.state) {
            query["location.state"] = new RegExp(criteria.location.state, "i");
          }
        }
        if (criteria.lastDonationBefore) {
          query.lastDonationDate = { $lt: new Date(criteria.lastDonationBefore) };
        }
      }

      const users = await userModel.find(query, "_id");
      recipients = users.map(user => ({ user: user._id }));
    }

    const notification = new notificationModel({
      title,
      message,
      type,
      sender: req.body.userId,
      recipients,
      targetAudience,
      criteria,
      priority: priority || "medium",
      expiryDate,
    });

    await notification.save();

    return res.status(201).send({
      success: true,
      message: "Notification created successfully",
      notification,
      recipientCount: recipients.length,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error in creating notification",
      error,
    });
  }
};

// GET USER NOTIFICATIONS
const getUserNotificationsController = async (req, res) => {
  try {
    const userId = req.body.userId;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    let query = {
      "recipients.user": userId,
      isActive: true,
      $or: [
        { expiryDate: { $exists: false } },
        { expiryDate: { $gt: new Date() } },
      ],
    };

    if (unreadOnly === "true") {
      query["recipients.isRead"] = false;
    }

    const notifications = await notificationModel
      .find(query, {
        title: 1,
        message: 1,
        type: 1,
        priority: 1,
        createdAt: 1,
        "recipients.$": 1,
      })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await notificationModel.countDocuments(query);
    const unreadCount = await notificationModel.countDocuments({
      "recipients.user": userId,
      "recipients.isRead": false,
      isActive: true,
    });

    return res.status(200).send({
      success: true,
      message: "Notifications fetched successfully",
      notifications: notifications.map(notif => ({
        _id: notif._id,
        title: notif.title,
        message: notif.message,
        type: notif.type,
        priority: notif.priority,
        createdAt: notif.createdAt,
        isRead: notif.recipients[0]?.isRead || false,
        readAt: notif.recipients[0]?.readAt,
      })),
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
      unreadCount,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error in fetching notifications",
      error,
    });
  }
};

// MARK NOTIFICATION AS READ
const markNotificationReadController = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.body.userId;

    if (!mongoose.isValidObjectId(notificationId)) {
      return res.status(400).send({
        success: false,
        message: "Invalid notification ID",
      });
    }

    const notification = await notificationModel.findOneAndUpdate(
      {
        _id: notificationId,
        "recipients.user": userId,
      },
      {
        $set: {
          "recipients.$.isRead": true,
          "recipients.$.readAt": new Date(),
        },
      },
      { new: true }
    );

    if (!notification) {
      return res.status(404).send({
        success: false,
        message: "Notification not found",
      });
    }

    return res.status(200).send({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error in marking notification as read",
      error,
    });
  }
};

// MARK ALL NOTIFICATIONS AS READ
const markAllNotificationsReadController = async (req, res) => {
  try {
    const userId = req.body.userId;

    await notificationModel.updateMany(
      {
        "recipients.user": userId,
        "recipients.isRead": false,
      },
      {
        $set: {
          "recipients.$.isRead": true,
          "recipients.$.readAt": new Date(),
        },
      }
    );

    return res.status(200).send({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error in marking all notifications as read",
      error,
    });
  }
};

// DELETE NOTIFICATION
const deleteNotificationController = async (req, res) => {
  try {
    const { notificationId } = req.params;

    if (!mongoose.isValidObjectId(notificationId)) {
      return res.status(400).send({
        success: false,
        message: "Invalid notification ID",
      });
    }

    const notification = await notificationModel.findByIdAndUpdate(
      notificationId,
      { isActive: false },
      { new: true }
    );

    if (!notification) {
      return res.status(404).send({
        success: false,
        message: "Notification not found",
      });
    }

    return res.status(200).send({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error in deleting notification",
      error,
    });
  }
};

// SEND DONATION REMINDERS
const sendDonationRemindersController = async (req, res) => {
  try {
    // Find eligible donors who haven't donated in last 3 months
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const eligibleDonors = await userModel.find({
      role: "donar",
      isEligible: true,
      isActive: true,
      $or: [
        { lastDonationDate: { $lt: threeMonthsAgo } },
        { lastDonationDate: { $exists: false } },
      ],
      "preferences.donationReminders": true,
    });

    if (eligibleDonors.length === 0) {
      return res.status(200).send({
        success: true,
        message: "No eligible donors found for reminders",
        count: 0,
      });
    }

    const notification = new notificationModel({
      title: "Time to Donate Blood Again! ❤️",
      message: "It's been a while since your last donation. Your blood can save lives! Find nearby donation camps or hospitals.",
      type: "donation_reminder",
      sender: req.body.userId,
      recipients: eligibleDonors.map(donor => ({ user: donor._id })),
      targetAudience: "donors",
      priority: "medium",
    });

    await notification.save();

    return res.status(200).send({
      success: true,
      message: "Donation reminders sent successfully",
      count: eligibleDonors.length,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error in sending donation reminders",
      error,
    });
  }
};

module.exports = {
  createNotificationController,
  getUserNotificationsController,
  markNotificationReadController,
  markAllNotificationsReadController,
  deleteNotificationController,
  sendDonationRemindersController,
};
