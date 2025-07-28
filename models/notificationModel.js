const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
    },
    message: {
      type: String,
      required: [true, "Message is required"],
    },
    type: {
      type: String,
      enum: [
        "donation_reminder",
        "blood_request",
        "camp_invitation",
        "announcement",
        "approval",
        "rejection",
        "alert",
        "emergency",
      ],
      required: [true, "Notification type is required"],
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
    recipients: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true,
      },
      isRead: {
        type: Boolean,
        default: false,
      },
      readAt: Date,
    }],
    targetAudience: {
      type: String,
      enum: ["all", "donors", "hospitals", "organizations", "specific"],
      default: "specific",
    },
    criteria: {
      bloodGroup: [String],
      location: {
        city: String,
        state: String,
      },
      lastDonationBefore: Date,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    expiryDate: Date,
    isActive: {
      type: Boolean,
      default: true,
    },
    metadata: {
      relatedCamp: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DonationCamp",
      },
      relatedRequest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Request",
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
