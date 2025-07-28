const mongoose = require("mongoose");

const campaignSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Campaign title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Campaign description is required"],
    },
    type: {
      type: String,
      enum: ["awareness", "corporate", "social", "community", "educational"],
      default: "awareness",
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },
    targetAudience: {
      type: String,
      required: true,
    },
    goals: {
      type: String,
    },
    budget: {
      type: Number,
      min: 0,
    },
    status: {
      type: String,
      enum: ["planning", "active", "completed", "paused", "cancelled"],
      default: "planning",
    },
    reach: {
      type: Number,
      default: 0,
    },
    engagementMetrics: {
      views: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      shares: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 },
    },
    organisation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    tags: [String],
    mediaFiles: [String], // URLs to campaign materials
  },
  { timestamps: true }
);

// Index for better query performance
campaignSchema.index({ organisation: 1, status: 1 });
campaignSchema.index({ startDate: 1, endDate: 1 });

module.exports = mongoose.model("campaigns", campaignSchema);
