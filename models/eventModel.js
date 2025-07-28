const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Event title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Event description is required"],
    },
    type: {
      type: String,
      enum: ["blood_drive", "awareness_seminar", "workshop", "conference", "community_outreach"],
      default: "blood_drive",
    },
    date: {
      type: Date,
      required: [true, "Event date is required"],
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    location: {
      address: {
        type: String,
        required: [true, "Event address is required"],
      },
      city: String,
      state: String,
      zipCode: String,
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },
    expectedAttendees: {
      type: Number,
      required: true,
      min: 1,
    },
    actualAttendees: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["scheduled", "confirmed", "in_progress", "completed", "cancelled", "postponed"],
      default: "scheduled",
    },
    organisation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    volunteers: [{
      volunteer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
      },
      role: {
        type: String,
        enum: ["coordinator", "registration", "medical", "logistics", "general"],
        default: "general",
      },
      assignedAt: {
        type: Date,
        default: Date.now,
      },
    }],
    registeredDonors: [{
      donor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
      },
      registeredAt: {
        type: Date,
        default: Date.now,
      },
      attended: {
        type: Boolean,
        default: false,
      },
      donated: {
        type: Boolean,
        default: false,
      },
    }],
    requirements: {
      equipment: [String],
      staff: [String],
      supplies: [String],
    },
    outcomes: {
      totalDonors: { type: Number, default: 0 },
      totalBloodCollected: { type: Number, default: 0 }, // in ML
      newDonorRegistrations: { type: Number, default: 0 },
      feedbackScore: { type: Number, min: 1, max: 5 },
      notes: String,
    },
  },
  { timestamps: true }
);

// Index for better query performance
eventSchema.index({ organisation: 1, status: 1 });
eventSchema.index({ date: 1 });
eventSchema.index({ "location.city": 1 });

module.exports = mongoose.model("events", eventSchema);
