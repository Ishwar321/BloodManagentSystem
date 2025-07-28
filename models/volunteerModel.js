const mongoose = require("mongoose");

const volunteerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    organisation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    skills: [{
      type: String,
      enum: ["medical", "logistics", "communication", "coordination", "technical", "marketing", "registration"],
    }],
    availability: {
      weekdays: { type: Boolean, default: false },
      weekends: { type: Boolean, default: false },
      evenings: { type: Boolean, default: false },
      flexible: { type: Boolean, default: false },
    },
    experience: {
      type: String,
      enum: ["none", "beginner", "intermediate", "experienced", "expert"],
      default: "none",
    },
    status: {
      type: String,
      enum: ["active", "inactive", "pending", "suspended"],
      default: "pending",
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    totalHours: {
      type: Number,
      default: 0,
    },
    eventsParticipated: [{
      event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "events",
      },
      role: String,
      hours: Number,
      feedback: String,
      rating: { type: Number, min: 1, max: 5 },
    }],
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String,
    },
    notes: String,
  },
  { timestamps: true }
);

// Index for better query performance
volunteerSchema.index({ organisation: 1, status: 1 });
volunteerSchema.index({ user: 1, organisation: 1 }, { unique: true });

module.exports = mongoose.model("volunteers", volunteerSchema);
